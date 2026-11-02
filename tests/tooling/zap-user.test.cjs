const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');
const { test } = require('node:test');

function fixture(t, imageUser) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cnm-zap-user-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const tools = path.join(root, 'tools/dast'), local = path.join(tools, '.local'), bin = path.join(root, 'bin');
  fs.mkdirSync(path.join(tools, 'zap'), { recursive: true });
  fs.mkdirSync(local); fs.mkdirSync(bin);
  fs.writeFileSync(path.join(local, 'config.env'), '# synthetic fixture\n');
  fs.copyFileSync(path.join(__dirname, '../../tools/dast/run-zap.cjs'), path.join(tools, 'run-zap.cjs'));
  fs.writeFileSync(path.join(tools, 'zap/auth.plan.yml'), 'fixture plan');
  fs.writeFileSync(path.join(local, 'source.json'), JSON.stringify({ backendCommit: 'a'.repeat(40), schemaSha256: 'b'.repeat(64) }));
  const git = args => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8' });
  git(['init', '-q']); git(['add', '.']);
  git(['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.test', 'commit', '-qm', 'fixture']);
  const calls = path.join(root, 'calls.jsonl');
  fs.writeFileSync(path.join(bin, 'docker'), `#!${process.execPath}
const fs=require('node:fs'),path=require('node:path'),args=process.argv.slice(2);
fs.appendFileSync(process.env.FIXTURE_CALLS,JSON.stringify({args,user:process.env.DAST_ZAP_USER})+'\\n');
if(args.includes('exec'))console.log(JSON.stringify({results:Array.from({length:8},()=>({passed:true}))}));
else if(args.includes('run')){
const directory=path.join(process.cwd(),'tools/dast/.local/reports',process.env.DAST_ZAP_RUN_ID);
fs.writeFileSync(path.join(directory,'summary.json'),JSON.stringify({scannerExecuted:true,scannerExitCode:0,target:'http://api:3000',highRiskGatePassed:true,counts:{high:0,medium:0,low:0,informational:0}}));
fs.writeFileSync(path.join(directory,'zap-auth.json'),'{}');
}else console.log('sha256:'+'f'.repeat(64));
`, { mode: 0o755 });
  const env = { ...process.env, PATH: bin + path.delimiter + process.env.PATH, FIXTURE_CALLS: calls };
  delete env.DAST_ZAP_IMAGE_USER;
  if (imageUser !== undefined) env.DAST_ZAP_IMAGE_USER = imageUser;
  const result = spawnSync(process.execPath, [path.join(tools, 'run-zap.cjs')], { encoding: 'utf8', env });
  return { root, local, calls, result };
}

for (const imageUser of [undefined, 'zap']) {
  test('el scanner prepara permisos compatibles para ' + (imageUser ?? 'el usuario local'),
    { skip: process.platform === 'win32' }, t => {
      const data = fixture(t, imageUser);
      assert.equal(data.result.status, 0, data.result.stderr);
      const calls = fs.readFileSync(data.calls, 'utf8').trim().split('\n').map(JSON.parse);
      const scan = calls.find(item => item.args.includes('run'));
      assert.equal(scan.user, imageUser ? 'zap:' + process.getgid() : process.getuid() + ':' + process.getgid());
      const run = fs.readdirSync(path.join(data.local, 'reports'))[0];
      assert.equal(fs.statSync(path.join(data.local, 'reports', run)).mode & 0o777, imageUser ? 0o770 : 0o700);
      assert.equal(JSON.parse(fs.readFileSync(path.join(data.local, 'reports', run, 'summary.json'))).source.backendCommit, 'a'.repeat(40));
    });
}

test('un usuario de imagen no autorizado se rechaza antes de invocar Docker',
  { skip: process.platform === 'win32' }, t => {
    const data = fixture(t, 'root');
    assert.equal(data.result.status, 3);
    assert.equal(fs.existsSync(data.calls), false);
  });
