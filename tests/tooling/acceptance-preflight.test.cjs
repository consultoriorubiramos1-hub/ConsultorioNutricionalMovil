const assert = require('node:assert/strict');
const { test } = require('node:test');
const { devicesFrom, selectEmulator, supportedNode, javaMajor, localApiReady } = require('../../tools/acceptance/preflight.cjs');

test('respeta el rango Node 22 del proyecto y su minimo 22.13', () => {
  for (const v of ['22.13.0', 'v22.13.0', '22.20.1']) assert.equal(supportedNode(v), true);
  for (const v of ['22.12.0', '24.0.0', '20.19.0', 'bad', '22.13.0-beta']) assert.equal(supportedNode(v), false);
});

test('distingue un emulador disponible de un dispositivo fisico o no autorizado', () => {
  const s = 'List of devices attached\r\nemulator-5554\tdevice\r\nphysical-serial\tdevice\r\n';
  assert.deepEqual(devicesFrom(s), [{ serial: 'emulator-5554', state: 'device' }]);
  assert.equal(selectEmulator(s), 'emulator-5554');
  assert.equal(selectEmulator('emulator-5554\tunauthorized'), null);
  assert.equal(selectEmulator('emulator-5554\toffline'), null);
});

test('no selecciona arbitrariamente entre varios emuladores', () => {
  assert.equal(selectEmulator('emulator-5554\tdevice\nemulator-5556\tdevice'), null);
  assert.equal(selectEmulator('List of devices attached'), null);
});

test('reconoce OpenJDK y Java sin confundir Java 8 con Java 17', () => {
  assert.equal(javaMajor('openjdk version "17.0.20"'), 17);
  assert.equal(javaMajor('java version "21.0.1"'), 21);
  assert.equal(javaMajor('java version "1.8.0_342"'), 8);
  assert.equal(javaMajor('unrelated 21.0.1'), 0);
});

test('comprueba solo loopback sin credenciales ni seguimiento de redirecciones', async () => {
  let call;
  const passed = await localApiReady(async (url, options) => {
    call = { url, options };
    return new Response('{"ok":false,"message":"Token requerido"}', { status: 401, headers: { 'Content-Type': 'application/json' } });
  });
  assert.equal(passed, true);
  assert.equal(call.url, 'http://127.0.0.1:3300/api/mobile/auth/me');
  assert.equal(call.options.redirect, 'error');
  assert.equal(call.options.headers, undefined);
  assert.equal(call.options.body, undefined);
  assert.ok(call.options.signal instanceof AbortSignal);
});

test('rechaza HTTP exitoso aparente y cuerpos que aparentan una sesion', async () => {
  for (const [status, body] of [[200, '{"ok":true}'], [401, '{"ok":true,"message":"error"}'], [401, '{"ok":false,"message":"error","data":{"token":"fixture"}}']]) {
    assert.equal(await localApiReady(async () => new Response(body, { status, headers: { 'Content-Type': 'application/json' } })), false);
  }
});

test('rechaza HTML o JSON roto aunque el servidor responda 401', async () => {
  for (const [type, body] of [['text/html', '<html>error</html>'], ['application/json', '{']]) {
    assert.equal(await localApiReady(async () => new Response(body, { status: 401, headers: { 'Content-Type': type } })), false);
  }
});

test('un fallo de red produce requisito pendiente sin revelar el error recibido', async () => {
  assert.equal(await localApiReady(async () => { throw new Error('private-server-detail'); }), false);
});
