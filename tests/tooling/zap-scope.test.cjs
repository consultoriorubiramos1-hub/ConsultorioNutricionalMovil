const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { test } = require('node:test');
const yaml = require('yaml');

const root = path.resolve(__dirname, '../..');
const read = file => yaml.parse(fs.readFileSync(path.join(root, file), 'utf8'));

test('el scanner solo tiene red interna y las dos rutas de autenticacion', () => {
  const compose = read('tools/dast/compose.yml');
  assert.equal(compose.networks.isolated.internal, true);
  assert.deepEqual(compose.services.zap.networks, ['isolated']);
  assert.equal(compose.services.zap.ports, undefined);
  assert.deepEqual(Object.keys(compose.services.zap.environment), ['AUTH_FIXTURE_PASSWORD']);
  const api = read('tools/dast/zap/auth.openapi.yml');
  assert.deepEqual(api.servers, [{ url: 'http://api:3000' }]);
  assert.deepEqual(Object.keys(api.paths).sort(), ['/api/mobile/auth/login', '/api/mobile/auth/me']);
  const plan = read('tools/dast/zap/auth.plan.yml');
  const allowed = new RegExp(plan.env.contexts[0].includePaths[0]);
  for (const url of ['http://api:3000/api/mobile/auth/login', 'http://api:3000/api/mobile/auth/me?test=1']) assert.ok(allowed.test(url));
  for (const url of ['https://outside.example.test/api/mobile/auth/me', 'http://api:3000/api/enviar-codigo', 'http://api:3000/api/mobile/auth/me/other']) assert.ok(!allowed.test(url));
  assert.equal(plan.env.parameters.failOnError, true);
  assert.equal(plan.env.parameters.failOnWarning, true);
  assert.ok(plan.jobs.some(job => job.type === 'activeScan'));
});

test('el ejecutor rechaza una URL externa antes de invocar Docker', () => {
  const result = spawnSync(process.execPath, [path.join(root, 'tools/dast/run-zap.cjs'), 'https://outside.example.test'], { encoding: 'utf8' });
  assert.equal(result.status, 3);
  assert.match(result.stderr, /no admite una URL externa/);
});

test('el resumen conserva riesgos y omite payloads sensibles', { skip: process.platform !== 'linux' }, () => {
  const result = spawnSync('python3', ['-B', path.join(__dirname, 'zap-summary_test.py')], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.error?.message || result.stderr);
});
