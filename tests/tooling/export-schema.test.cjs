const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { test } = require('node:test');

const root = path.resolve(__dirname, '../..');
const wrapper = path.join(root, 'tools/dast/export-schema.sh');

function runWrapper(uri) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'cnm-schema-export-'));
  const log = path.join(directory, 'arguments.json');
  const stub = `#!${process.execPath}\nrequire('node:fs').writeFileSync(process.env.DAST_ARGUMENT_LOG, JSON.stringify(process.argv.slice(2)));\n`;
  fs.writeFileSync(path.join(directory, 'pg_dump'), stub, { mode: 0o755 });
  const env = { ...process.env, PATH: directory + path.delimiter + process.env.PATH, DAST_ARGUMENT_LOG: log };
  delete env.DAST_SCHEMA_SOURCE_URI;
  if (uri !== undefined) env.DAST_SCHEMA_SOURCE_URI = uri;
  try {
    const result = spawnSync('sh', [wrapper], { env, encoding: 'utf8' });
    if (result.error) throw result.error;
    return { ...result, arguments: fs.existsSync(log) ? JSON.parse(fs.readFileSync(log, 'utf8')) : null };
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

test('el wrapper transmite una URI literal como --dbname y solo solicita estructura', { skip: process.platform === 'win32' }, () => {
  const uri = "postgresql://fixture:pa'ss%24@db.example.test/fixture?sslmode=require&application_name=fixture%20value";
  const result = runWrapper(uri);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.arguments[0], '--dbname=' + uri);
  for (const option of ['--no-password', '--schema-only', '--no-owner', '--no-privileges', '--no-comments']) {
    assert.ok(result.arguments.includes(option), 'Falta ' + option);
  }
  assert.ok(!result.stdout.includes(uri) && !result.stderr.includes(uri));
});

test('sin URI se detiene antes de invocar pg_dump o usar una conexión local por defecto', { skip: process.platform === 'win32' }, () => {
  for (const uri of [undefined, '']) {
    const result = runWrapper(uri);
    assert.notEqual(result.status, 0);
    assert.equal(result.arguments, null);
  }
});

test('rechaza un origen no PostgreSQL sin imprimir su contenido', { skip: process.platform === 'win32' }, () => {
  const uri = 'https://fixture:private-fixture@api.example.test';
  const result = runWrapper(uri);
  assert.notEqual(result.status, 0);
  assert.equal(result.arguments, null);
  assert.ok(!result.stderr.includes(uri));
});

test('el script Windows conserva BOM y el wrapper Linux conserva LF', () => {
  const windows = fs.readFileSync(path.join(root, 'tools/dast/export-schema.ps1'));
  assert.deepEqual([...windows.subarray(0, 3)], [0xef, 0xbb, 0xbf]);
  assert.ok(!fs.readFileSync(wrapper, 'utf8').includes('\r'));
});
