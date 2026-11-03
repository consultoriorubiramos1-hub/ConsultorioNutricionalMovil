const assert = require('node:assert/strict');
const { test } = require('node:test');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const yaml = require('yaml');
const { createEmulatorProxy } = require('../../tools/dast/scripts/emulator-proxy.cjs');

async function listen(t, server) {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => { server.closeAllConnections(); server.close(); });
  return server.address().port;
}

test('el puente conserva metodo, cuerpo, Bearer y estado HTTP de la API local', async t => {
  let received;
  const targetPort = await listen(t, http.createServer(async (request, response) => {
    let body = '';
    for await (const chunk of request) body += chunk;
    received = { method: request.method, url: request.url, token: request.headers.authorization, body };
    response.writeHead(401, { 'Content-Type': 'application/json', 'X-Content-Type-Options': 'nosniff' });
    response.end('{"ok":false}');
  }));
  const proxyPort = await listen(t, createEmulatorProxy({ hostname: '127.0.0.1', port: targetPort }));
  const response = await fetch(`http://127.0.0.1:${proxyPort}/api/mobile/auth/login?fixture=1`, {
    method: 'POST', headers: { Authorization: 'Bearer fixture-token', 'Content-Type': 'application/json' }, body: '{"username":"fixture"}',
  });
  assert.equal(response.status, 401);
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.deepEqual(await response.json(), { ok: false });
  assert.deepEqual(received, { method: 'POST', url: '/api/mobile/auth/login?fixture=1', token: 'Bearer fixture-token', body: '{"username":"fixture"}' });
});

test('una ruta ajena a /api/ no llega al servidor destino', async t => {
  let requests = 0;
  const targetPort = await listen(t, http.createServer((_request, response) => { requests++; response.end(); }));
  const proxyPort = await listen(t, createEmulatorProxy({ hostname: '127.0.0.1', port: targetPort }));
  const response = await fetch(`http://127.0.0.1:${proxyPort}/fuera`);
  assert.equal(response.status, 404);
  await response.text();
  assert.equal(requests, 0);
});

test('una URL absoluta de proxy no se reenvia a ningun destino', async t => {
  let requests = 0;
  const targetPort = await listen(t, http.createServer((_request, response) => { requests++; response.end(); }));
  const proxyPort = await listen(t, createEmulatorProxy({ hostname: '127.0.0.1', port: targetPort }));
  const status = await new Promise((resolve, reject) => {
    const request = http.request({ hostname: '127.0.0.1', port: proxyPort, path: 'http://outside.example.test/api/mobile/auth/me' }, response => { response.resume(); resolve(response.statusCode); });
    request.on('error', reject); request.end();
  });
  assert.equal(status, 404);
  assert.equal(requests, 0);
});

test('el puente devuelve un error seguro si la API corta la conexion', async t => {
  const targetPort = await listen(t, http.createServer(request => request.socket.destroy()));
  const proxyPort = await listen(t, createEmulatorProxy({ hostname: '127.0.0.1', port: targetPort }));
  const response = await fetch(`http://127.0.0.1:${proxyPort}/api/mobile/auth/me`);
  assert.equal(response.status, 502);
  assert.deepEqual(await response.json(), { ok: false, message: 'API local de pruebas no disponible.' });
});

test('solo el puente opcional tiene la red de entrada y el puerto de loopback', () => {
  const root = path.resolve(__dirname, '../..');
  const base = yaml.parse(fs.readFileSync(path.join(root, 'tools/dast/compose.yml'), 'utf8'));
  // Resolver la etiqueta de Compose como secuencia vacia para inspeccionar el documento.
  const extra = yaml.parse(fs.readFileSync(path.join(root, 'tools/dast/compose-emulator.yml'), 'utf8').replace('ports: !reset []', 'ports: []'));
  assert.equal(base.networks.isolated.internal, true);
  assert.deepEqual(base.services.api.networks, ['isolated']);
  assert.deepEqual(base.services.db.networks, ['isolated']);
  assert.deepEqual(base.services.zap.networks, ['isolated']);
  assert.deepEqual(Object.keys(extra.services).sort(), ['api', 'emulator-proxy']);
  assert.deepEqual(extra.services.api.ports, []);
  assert.equal(extra.services.api.networks, undefined);
  assert.deepEqual(extra.services['emulator-proxy'].networks, ['isolated', 'emulator_host']);
  assert.deepEqual(extra.services['emulator-proxy'].ports, ['127.0.0.1:3300:3300']);
  assert.equal(extra.services['emulator-proxy'].environment, undefined);
  assert.equal(extra.services['emulator-proxy'].read_only, true);
  assert.equal(extra.services['emulator-proxy'].volumes[0].read_only, true);
  assert.deepEqual(extra.services['emulator-proxy'].command, []);
});
