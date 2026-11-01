const fs = require('node:fs');
const path = require('node:path');
const { randomBytes, createHash } = require('node:crypto');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '../..');
const compose = ['compose', '--env-file', 'tools/dast/.local/config.env', '-f', 'tools/dast/compose.yml'];

function main() {
  if (process.argv.length !== 2) throw new Error('Este comando utiliza exclusivamente la API local; no admite una URL externa.');
  const source = JSON.parse(fs.readFileSync(path.join(__dirname, '.local/source.json'), 'utf8'));
  if (!/^[a-f0-9]{40}$/.test(source.backendCommit) || !/^[a-f0-9]{64}$/.test(source.schemaSha256)) {
    throw new Error('Faltan los metadatos del entorno preparado.');
  }
  const preflight = spawnSync('docker', [...compose, 'exec', '-T', 'api', 'node', 'dast-tools/check-auth.cjs'], { cwd: root, encoding: 'utf8' });
  if (preflight.error || preflight.status !== 0) throw new Error('La comprobacion HTTP previa fallo. Revisa API, base y fixtures antes de escanear.');
  const smoke = JSON.parse(preflight.stdout);
  if (smoke.results?.length !== 8 || !smoke.results.every(result => result.passed === true)) throw new Error('La comprobacion de autenticacion no esta aprobada.');

  const runId = 'zap-auth-' + new Date().toISOString().replace(/[:.]/g, '-') + '-' + randomBytes(3).toString('hex');
  const directory = path.join(__dirname, '.local/reports', runId);
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
  fs.writeFileSync(path.join(directory, 'auth-smoke.json'), JSON.stringify(smoke, null, 2) + '\n');
  fs.writeFileSync(path.join(directory, 'source.json'), JSON.stringify(source, null, 2) + '\n');
  const uid = typeof process.getuid === 'function' ? `${process.getuid()}:${process.getgid()}` : '1000:1000';
  console.log('Autenticacion previa: 8/8. Iniciando ZAP en la red interna de Docker.');
  console.log('Reportes de esta ejecucion: ' + path.relative(root, directory));
  const scan = spawnSync('docker', [...compose, '--profile', 'scan', 'run', '--rm', '--no-deps', '-T', 'zap'], {
    cwd: root, stdio: 'inherit', env: { ...process.env, DAST_ZAP_RUN_ID: runId, DAST_ZAP_USER: uid },
  });
  if (scan.error || ![0, 1].includes(scan.status)) throw new Error('ZAP no completo la ejecucion. Conserva el directorio de reportes para diagnosticarla.');
  const summary = JSON.parse(fs.readFileSync(path.join(directory, 'summary.json'), 'utf8'));
  if (summary.scannerExecuted !== true || summary.target !== 'http://api:3000') throw new Error('No se encontro evidencia del scanner local.');
  const mobileCommit = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).stdout?.trim();
  const imageId = spawnSync('docker', ['image', 'inspect', 'ghcr.io/zaproxy/zaproxy:2.17.0', '--format', '{{.Id}}'], { encoding: 'utf8' }).stdout?.trim();
  summary.source = { backendCommit: source.backendCommit, schemaSha256: source.schemaSha256,
    mobileCommit, scannerImage: 'ghcr.io/zaproxy/zaproxy:2.17.0', scannerImageId: imageId,
    planSha256: createHash('sha256').update(fs.readFileSync(path.join(__dirname, 'zap/auth.plan.yml'))).digest('hex'),
    rawReportSha256: createHash('sha256').update(fs.readFileSync(path.join(directory, 'zap-auth.json'))).digest('hex') };
  fs.writeFileSync(path.join(directory, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
  console.log(JSON.stringify(summary, null, 2));
  if (scan.status === 1 || !summary.highRiskGatePassed) {
    console.error('Se detectaron hallazgos altos. El resultado requiere correccion y revision.');
    return 1;
  }
  console.log('Escaneo terminado sin hallazgos altos en este alcance. Los avisos requieren revision.');
  console.log('Para compartir el resultado utiliza summary.json; los reportes completos se conservan localmente.');
  return 0;
}

try { process.exitCode = main(); } catch (error) {
  console.error(error.message);
  process.exitCode = 3;
}
