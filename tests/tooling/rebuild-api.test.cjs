const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { spawnSync, execFileSync } = require('node:child_process');
const { test } = require('node:test');

function fixture(run) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'cnm-api-rebuild-'));
  const backend = path.join(directory, 'backend directory');
  const tools = path.join(directory, 'tools/dast');
  const local = path.join(tools, '.local');
  const bin = path.join(directory, 'bin');
  for (const folder of [backend, local, bin]) fs.mkdirSync(folder, { recursive: true });
  const packagePath = path.join(backend, 'package.json');
  fs.writeFileSync(packagePath, JSON.stringify({ dependencies: { next: '16.1.6', pg: '8.16.0' } }));
  const git = args => execFileSync('git', ['-C', backend, ...args], { encoding: 'utf8' }).trim();
  git(['init', '-q']);
  git(['add', '.']);
  const commit = () => git(['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.test', 'commit', '-qm', 'fixture']);
  commit();
  const previousRef = git(['rev-parse', 'HEAD']);
  fs.writeFileSync(path.join(backend, 'change.txt'), 'fixture\n');
  git(['add', '.']); commit();
  const nextRef = git(['rev-parse', 'HEAD']);
  const schema = '-- fixture schema\n';
  fs.writeFileSync(path.join(local, 'schema.sql'), schema);
  const metadata = { backendCommit: previousRef, schemaSha256: createHash('sha256').update(schema).digest('hex') };
  const sourcePath = path.join(local, 'source.json');
  fs.writeFileSync(sourcePath, JSON.stringify(metadata));
  const config = 'DAST_BACKEND_PATH=' + JSON.stringify(backend) + '\nDAST_DB_PASSWORD=fixture-only\n';
  fs.writeFileSync(path.join(local, 'config.env'), config);
  fs.copyFileSync(path.join(__dirname, '../../tools/dast/rebuild-api.cjs'), path.join(tools, 'rebuild-api.cjs'));
  const log = path.join(directory, 'docker-calls.jsonl');
  const stub = `#!${process.execPath}\nconst fs=require('node:fs');const args=process.argv.slice(2);fs.appendFileSync(process.env.DAST_MOCK_LOG,JSON.stringify(args)+'\\n');if(args.includes('down')||args.at(-1)==='db')process.exit(9);if(args.includes('up')){if(!args.includes('--no-deps')||args.at(-1)!=='api')process.exit(8);process.exit(process.env.DAST_MOCK_FAIL==='1'?1:0);}console.log(JSON.stringify({results:Array.from({length:4},()=>({passed:true}))}));\n`;
  fs.writeFileSync(path.join(bin, 'docker'), stub, { mode: 0o755 });
  const invoke = (env = {}, args = []) => spawnSync(process.execPath, [path.join(tools, 'rebuild-api.cjs'), ...args], {
    encoding: 'utf8', env: { ...process.env, PATH: bin + path.delimiter + process.env.PATH, DAST_MOCK_LOG: log, ...env },
  });
  try { run({ invoke, sourcePath, nextRef, metadata, local, config, log, packagePath }); }
  finally { fs.rmSync(directory, { recursive: true, force: true }); }
}

test('reconstruye solo api y conserva esquema y claves al registrar el nuevo commit', { skip: process.platform === 'win32' }, () => fixture(data => {
  const result = data.invoke();
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(fs.readFileSync(data.sourcePath)).backendCommit, data.nextRef);
  assert.equal(fs.readFileSync(path.join(data.local, 'config.env'), 'utf8'), data.config);
  const calls = fs.readFileSync(data.log, 'utf8').trim().split('\n').map(JSON.parse);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].at(-1), 'api');
  assert.ok(calls[1].includes('exec'));
}));

test('un fallo al reconstruir conserva los metadatos anteriores y evita la comprobacion posterior', { skip: process.platform === 'win32' }, () => fixture(data => {
  const result = data.invoke({ DAST_MOCK_FAIL: '1' });
  assert.notEqual(result.status, 0);
  assert.deepEqual(JSON.parse(fs.readFileSync(data.sourcePath)), data.metadata);
  assert.equal(fs.readFileSync(data.log, 'utf8').trim().split('\n').length, 1);
}));

test('rechaza un checkout con cambios antes de ejecutar Docker', { skip: process.platform === 'win32' }, () => fixture(data => {
  fs.appendFileSync(data.packagePath, '\n');
  const result = data.invoke();
  assert.notEqual(result.status, 0);
  assert.ok(!fs.existsSync(data.log));
  assert.deepEqual(JSON.parse(fs.readFileSync(data.sourcePath)), data.metadata);
}));

test('la reconstruccion para emulador conserva el override en todas las llamadas', { skip: process.platform === 'win32' }, () => fixture(data => {
  const result = data.invoke({}, ['--emulator']);
  assert.equal(result.status, 0, result.stderr);
  const calls = fs.readFileSync(data.log, 'utf8').trim().split('\n').map(JSON.parse);
  assert.equal(calls.length, 2);
  for (const args of calls) assert.ok(args.includes('tools/dast/compose-emulator.yml'));
  assert.ok(!calls.some(args => args.includes('down')));
  assert.equal(fs.readFileSync(path.join(data.local, 'config.env'), 'utf8'), data.config);
}));
