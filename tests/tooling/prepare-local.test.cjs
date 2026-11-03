const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, spawn } = require('node:child_process');
const { test } = require('node:test');

function fixture(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'cnm-prepare-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const backend = path.join(directory, 'backend');
  const tools = path.join(directory, 'tools/dast');
  const local = path.join(tools, '.local');
  fs.mkdirSync(backend);
  fs.mkdirSync(local, { recursive: true });
  for (const name of ['src/lib/db.ts', 'src/app/api/mobile/auth/login/route.ts', 'src/app/api/mobile/auth/me/route.ts']) {
    const file = path.join(backend, name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, '// fixture\n');
  }
  fs.writeFileSync(path.join(backend, 'package.json'), JSON.stringify({ dependencies: { next: '16.4.3', pg: '8.16.0' } }));
  fs.writeFileSync(path.join(backend, 'package-lock.json'), '{}');
  const git = args => execFileSync('git', ['-C', backend, ...args], { encoding: 'utf8' }).trim();
  git(['init', '-q']); git(['add', '.']);
  git(['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.test', 'commit', '-qm', 'fixture']);
  fs.writeFileSync(path.join(local, 'schema.sql'), '-- PostgreSQL database dump\nCREATE TABLE public.tblusers (id integer);\n');
  const script = path.join(tools, 'prepare-local.cjs');
  fs.copyFileSync(path.join(__dirname, '../../tools/dast/prepare-local.cjs'), script);
  return { backend, local, invoke: () => new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script, backend]);
    let stdout = '', stderr = '';
    child.stdout.on('data', value => { stdout += value; });
    child.stderr.on('data', value => { stderr += value; });
    child.on('error', reject);
    child.on('close', status => resolve({ status, stdout, stderr }));
  }) };
}

test('preparar un entorno existente conserva sus claves y metadatos', async t => {
  const data = fixture(t);
  const config = 'DAST_DB_PASSWORD=existing-synthetic-secret\n';
  const source = '{"existing":true}\n';
  fs.writeFileSync(path.join(data.local, 'config.env'), config);
  fs.writeFileSync(path.join(data.local, 'source.json'), source);
  const result = await data.invoke();
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Ya existe/);
  assert.equal(fs.readFileSync(path.join(data.local, 'config.env'), 'utf8'), config);
  assert.equal(fs.readFileSync(path.join(data.local, 'source.json'), 'utf8'), source);
});

test('dos preparaciones concurrentes crean un solo entorno sin sobrescribir claves', async t => {
  const data = fixture(t);
  const results = await Promise.all([data.invoke(), data.invoke()]);
  assert.deepEqual(results.map(value => value.status).sort(), [0, 1]);
  assert.match(results.find(value => value.status === 1).stderr, /Ya existe/);
  const config = fs.readFileSync(path.join(data.local, 'config.env'), 'utf8');
  assert.match(config, /^DAST_DB_PASSWORD=[a-f0-9]{48}$/m);
  assert.match(config, /^DAST_AUTH_SECRET=[a-f0-9]{64}$/m);
  assert.match(config, /^DAST_FIXTURE_PASSWORD=[a-f0-9]{40}$/m);
  const source = JSON.parse(fs.readFileSync(path.join(data.local, 'source.json'), 'utf8'));
  assert.match(source.backendCommit, /^[a-f0-9]{40}$/);
  assert.equal(source.dastExecuted, false);
  if (process.platform !== 'win32') assert.equal(fs.statSync(path.join(data.local, 'config.env')).mode & 0o777, 0o600);
});
