const fs = require('node:fs');
const path = require('node:path');
const { createHash, randomBytes } = require('node:crypto');
const { spawn, spawnSync } = require('node:child_process');
const { fixturePassword, profileName } = require('../acceptance/run-pa01.cjs');
const { supportedNode, javaMajor } = require('../acceptance/preflight.cjs');

const VERSION = '5.6.3';
const ZIP_SHA512 = '387fadca903ee0aa30e3f2115fdfedb3898b102e6b9fe7cc3942703094bd2e65b235df2b0c6d0d3248e74c9a7950a36e42625fd74425368342c12e40b0163076';
const API = 'http://127.0.0.1:3300';
const STAGES = Object.freeze([
  { id: 'REN01-base', threads: 1, seconds: 30 },
  { id: 'REN01-carga', threads: 5, seconds: 60 },
  { id: 'EST01-10', threads: 10, seconds: 45 },
  { id: 'EST01-20', threads: 20, seconds: 45 },
  { id: 'EST01-recuperacion', threads: 1, seconds: 30 },
].map(s => Object.freeze(s)));
class PerfError extends Error { constructor(code) { super(code); this.code = code; } }
const check = (value, code) => { if (!value) throw new PerfError(code); };
const hash = (file, algorithm = 'sha256') => createHash(algorithm).update(fs.readFileSync(file)).digest('hex');

function csvRows(text) {
  const rows = []; let row = []; let field = ''; let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') { field += '"'; i++; } else quoted = !quoted;
    } else if (!quoted && (c === ',' || c === '\n')) {
      row.push(field.replace(/\r$/, '')); field = '';
      if (c === '\n') { rows.push(row); row = []; }
    } else field += c;
  }
  check(!quoted, 'results-csv');
  if (field || row.length) { row.push(field.replace(/\r$/, '')); rows.push(row); }
  return rows;
}

function parseSamples(text) {
  const [headers, ...rows] = csvRows(text.replace(/^\uFEFF/, ''));
  const expected = ['timeStamp','elapsed','label','responseCode','success','bytes','Latency','Connect'];
  check(headers?.length === expected.length && new Set(headers).size === expected.length && expected.every(h => headers.includes(h)), 'results-fields');
  return rows.map(row => {
    check(row.length === headers.length, 'results-csv');
    const value = Object.fromEntries(headers.map((h, i) => [h, row[i]]));
    check(['auth-me','perfil'].includes(value.label) && ['true','false'].includes(value.success), 'results-sample');
    for (const key of ['timeStamp','elapsed','bytes','Latency','Connect']) check(/^\d+$/.test(value[key]) && Number.isSafeInteger(Number(value[key])), 'results-sample');
    check(Number(value.timeStamp) > 0, 'results-sample');
    return { timestamp: Number(value.timeStamp), elapsed: Number(value.elapsed), label: value.label,
      passed: value.success === 'true' && value.responseCode === '200',
      code: /^\d{3}$/.test(value.responseCode) ? value.responseCode : 'transport-error' };
  });
}

function stats(samples) {
  check(samples.length > 0, 'results-empty');
  const times = samples.map(s => s.elapsed).sort((a,b) => a-b);
  const percentile = p => times[Math.max(0, Math.ceil(p * times.length) - 1)];
  const span = Math.max(...samples.map(s => s.timestamp + s.elapsed)) - Math.min(...samples.map(s => s.timestamp));
  const errors = samples.filter(s => !s.passed).length;
  const responseCodes = {};
  for (const s of samples) responseCodes[s.code] = (responseCodes[s.code] || 0) + 1;
  return { requests: samples.length, errors, errorPercent: Number((100 * errors / samples.length).toFixed(3)),
    meanMs: Number((times.reduce((a,b) => a+b,0) / times.length).toFixed(2)),
    minMs: times[0], p50Ms: percentile(0.5), p90Ms: percentile(0.9), p95Ms: percentile(0.95), p99Ms: percentile(0.99), maxMs: times.at(-1),
    measuredSeconds: Number((span / 1000).toFixed(3)), requestsPerSecond: span > 0 ? Number((samples.length * 1000 / span).toFixed(3)) : null,
    responseCodes };
}

function assessStage(stage, samples) {
  check(STAGES.some(s => s.id === stage.id && s.threads === stage.threads && s.seconds === stage.seconds), 'stage-scope');
  const endpoints = Object.fromEntries(['auth-me','perfil'].map(label => [label, stats(samples.filter(s => s.label === label))]));
  const overall = stats(samples);
  const enoughSamples = Object.values(endpoints).every(s => s.requests >= 10);
  const timingRequired = !['EST01-10','EST01-20'].includes(stage.id);
  const criteriaPassed = enoughSamples && Object.values(endpoints).every(s => s.errorPercent <= 1 && (!timingRequired || s.p95Ms <= 2000));
  return { ...stage, overall, endpoints, enoughSamples, timingRequired, criteriaPassed,
    stopIncrease: Object.values(endpoints).some(s => s.errorPercent > 5 || s.p95Ms >= 5000) };
}

function javaArgs(jar, plan, properties, dir, stage) {
  check(STAGES.some(s => s.id === stage.id && s.threads === stage.threads && s.seconds === stage.seconds), 'stage-scope');
  return ['-Xms128m','-Xmx512m','-Djava.awt.headless=true','-jar',jar,'-n','-t',plan,'-q',properties,
    '-l',path.join(dir, stage.id + '.csv'),'-j',path.join(dir, stage.id + '.log'),'-L','OFF',
    `-Jcnm.threads=${stage.threads}`, `-Jcnm.seconds=${stage.seconds}`, '-Jcnm.ramp=5'];
}

async function apiRequest(route, options = {}, fetcher = fetch) {
  check(['/api/mobile/auth/login','/api/mobile/auth/me','/api/mobile/perfil'].includes(route), 'api-scope');
  try {
    const r = await fetcher(API + route, { ...options, redirect: 'error', signal: AbortSignal.timeout(15000) });
    check(r.status === 200, 'api-http'); const body = await r.json();
    check(body?.ok === true, 'api-contract'); return body;
  } catch (e) { throw e instanceof PerfError ? e : new PerfError('api-http'); }
}

// El cliente no interpreta ni descifra el token; la API comprueba su validez.
// NextAuth emite JWE de cinco segmentos, incluido uno que puede estar vacio.
function bearerToken(value) {
  check(typeof value === 'string' && value.length <= 8192 &&
    /^[A-Za-z0-9._~+\/-]+=*$/.test(value) && !/\s/.test(value), 'fixture-token');
  return value;
}

async function prepareToken(password, fetcher = fetch) {
  const login = await apiRequest('/api/mobile/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'dast_patient_a', password }) }, fetcher);
  const token = bearerToken(login.data?.token);
  const options = { headers: { Authorization: `Bearer ${token}` } };
  const me = await apiRequest('/api/mobile/auth/me', options, fetcher);
  check(me.data?.username === 'dast_patient_a' && me.data?.rol_id === 2, 'fixture-identity');
  try { profileName(await apiRequest('/api/mobile/perfil', options, fetcher)); }
  catch { throw new PerfError('fixture-profile'); }
  return token;
}

function command(file, args, root) {
  const r = spawnSync(file, args, { encoding: 'utf8', shell: false, windowsHide: true, cwd: root, timeout: 90000 });
  check(!r.error && r.status === 0, 'local-command'); return r.stdout.trim();
}

function runJava(file, args, env, root) {
  return new Promise((resolve, reject) => {
    const child = spawn(file, args, { cwd: root, env, shell: false, windowsHide: true, stdio: 'ignore' });
    let code = 'jmeter-command'; let settled = false;
    const onInterrupt = () => { code = 'interrupted'; child.kill(); };
    process.once('SIGINT', onInterrupt);
    const timer = setTimeout(() => { code = 'jmeter-timeout'; child.kill(); }, 100000);
    const finish = ok => {
      if (settled) return; settled = true; clearTimeout(timer); process.removeListener('SIGINT', onInterrupt);
      if (ok && code === 'jmeter-command') resolve(); else reject(new PerfError(code));
    };
    child.once('error', () => finish(false)); child.once('exit', status => finish(status === 0));
  });
}

async function main() {
  const root = path.resolve(__dirname, '../..');
  const runId = new Date().toISOString().replace(/[:.]/g,'-') + '-' + randomBytes(3).toString('hex');
  const dir = path.join(root,'tools/dast/.local/reports/jmeter-' + runId);
  const report = { executedAt: new Date().toISOString(), scope: 'REN01-EST01-local-read', tool: 'Apache JMeter',
    toolVersion: VERSION, performanceExecuted: false, scannerExecuted: false, passed: false,
    target: API, routes: ['GET /api/mobile/auth/me','GET /api/mobile/perfil'],
    criteria: { localOnly: true, minimumSamplesPerEndpointPerStage: 10, maximumErrorPercent: 1,
      p95LimitMsForNormalAndRecovery: 2000, stopIncreaseAboveErrorPercent: 5, stopIncreaseAtP95Ms: 5000 },
    stages: [], limitations: ['API Next en desarrollo y HTTP local; no mide el binario Android ni la red de produccion.',
      'Un generador local, una cuenta ficticia compartida y hasta veinte usuarios virtuales; no demuestra capacidad maxima.',
      'El login se prepara fuera de la carga; no se mide su rendimiento.',
      'Commit backend declarado desde source.json; no verificado contra la imagen.',
      'Los limites son objetivos locales fijados antes de ejecutar, no un SLA de produccion.'] };
  let phase = 'preparation';
  try {
    check(process.argv.length === 2, 'arguments'); check(supportedNode(process.version), 'node-version');
    const local = path.join(root,'tools/dast/.local');
    const password = fixturePassword(fs.readFileSync(path.join(local,'config.env'),'utf8'));
    const source = JSON.parse(fs.readFileSync(path.join(local,'source.json'),'utf8'));
    check(/^[a-f0-9]{40}$/.test(source.backendCommit), 'source-metadata'); report.backendCommitDeclared = source.backendCommit;
    report.mobileCommit = command('git',['-C',root,'rev-parse','HEAD'],root);
    check(/^[a-f0-9]{40}$/.test(report.mobileCommit), 'source-metadata');
    check(!command('git',['-C',root,'status','--porcelain','--untracked-files=no'],root), 'dirty-source');
    const jar = path.join(local,`jmeter/apache-jmeter-${VERSION}/bin/ApacheJMeter.jar`);
    const zip = path.join(local,`jmeter/apache-jmeter-${VERSION}.zip`);
    check(fs.existsSync(jar) && fs.existsSync(zip), 'jmeter-install'); check(hash(zip,'sha512') === ZIP_SHA512, 'jmeter-integrity');
    report.distributionSha512 = ZIP_SHA512; report.jarSha256 = hash(jar);
    const java = process.env.JAVA_HOME ? path.join(process.env.JAVA_HOME,'bin',process.platform === 'win32' ? 'java.exe' : 'java') : 'java';
    const javaResult = spawnSync(java,['-version'],{encoding:'utf8',shell:false,windowsHide:true,timeout:10000});
    const major = javaMajor((javaResult.stderr || '') + (javaResult.stdout || ''));
    check(!javaResult.error && javaResult.status === 0 && major >= 17, 'java-version'); report.javaMajor = major;
    check(/\b5\.6\.3\b/.test(command(java,['-jar',jar,'--version'],root)), 'jmeter-version');
    const plan = path.join(__dirname,'local-read.jmx'); const properties = path.join(__dirname,'results.properties');
    report.planSha256 = hash(plan); report.resultsPropertiesSha256 = hash(properties);
    phase = 'fixtures';
    const compose = ['compose','--env-file',path.join(local,'config.env'),'-f',path.join(root,'tools/dast/compose.yml'),'-f',path.join(root,'tools/dast/compose-emulator.yml')];
    for (const script of ['seed-auth.cjs','seed-profiles.cjs']) command('docker',[...compose,'exec','-T','api','node',`dast-tools/${script}`],root);
    const token = await prepareToken(password);
    fs.mkdirSync(dir,{recursive:true,mode:0o700});
    const env = { ...process.env, CNM_JMETER_TOKEN: token };
    let stopped = false;
    for (const stage of STAGES) {
      if (stopped && stage.id !== 'EST01-recuperacion') continue;
      phase = stage.id;
      console.log(`${stage.id}: ${stage.threads} usuarios virtuales, ${stage.seconds} segundos. JMeter trabajando...`);
      await runJava(java,javaArgs(jar,plan,properties,dir,stage),env,root);
      const measured = parseSamples(fs.readFileSync(path.join(dir,stage.id + '.csv'),'utf8'));
      if (measured.length) report.performanceExecuted = true;
      const result = assessStage(stage,measured);
      report.stages.push(result);
      console.log(`${stage.id}: ${result.overall.requests} consultas; errores ${result.overall.errorPercent}%; p95 ${result.overall.p95Ms} ms.`);
      if (result.stopIncrease) { stopped = true; report.loadIncreaseStopped = true; }
    }
    delete env.CNM_JMETER_TOKEN;
    report.passed = report.stages.length === STAGES.length && report.stages.every(s => s.criteriaPassed);
  } catch (e) { report.failedAt = phase; report.errorCode = e instanceof PerfError ? e.code : 'preparation-error'; }
  finally {
    fs.mkdirSync(dir,{recursive:true,mode:0o700});
    fs.writeFileSync(path.join(dir,'summary.json'),JSON.stringify(report,null,2) + '\n',{mode:0o600,flag:'wx'});
    console.log(JSON.stringify(report,null,2)); console.log('Resumen local: ' + path.relative(root,path.join(dir,'summary.json')));
    if (!report.passed) process.exitCode = 1;
  }
}

module.exports = { PerfError, STAGES, csvRows, parseSamples, stats, assessStage, javaArgs, apiRequest, bearerToken, prepareToken };
if (require.main === module) main().catch(() => {
  console.error('No se pudo guardar el resumen local. No compartas claves, tokens ni configuracion privada.'); process.exitCode = 1;
});
