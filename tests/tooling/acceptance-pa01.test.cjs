const assert = require('node:assert/strict');
const { test } = require('node:test');
const { fixturePassword, profileName, sessionCapabilities, appiumRequest, appiumVersion, guardLocalLogin, runScenario } = require('../../tools/acceptance/run-pa01.cjs');

const password = 'a'.repeat(40);
const profile = () => ({ ok: true, data: { username: 'dast_patient_a', first_name: 'Prueba', second_name: 'validacion', first_lastname: 'Paciente', second_lastname: 'A', email: 'dast_patient_a.validado@example.test' } });

function fakeUi(options = {}) {
  const state = { screen: 'login', username: '', password: '', inputs: [], menu: false };
  const ui = {
    async wait(label) {
      const available = state.screen === 'login' ? ['Correo electrónico o usuario', 'Contraseña', 'Bienvenido de nuevo', 'Ingresa tu usuario.', 'Usuario o contraseña incorrectos.']
        : state.screen === 'inicio' ? ['Tu bienestar es un proceso, y vas por muy buen camino.']
          : ['Gestiona tu información personal y preferencias.', 'Prueba validacion Paciente A'];
      assert.ok(available.includes(label), 'Pantalla o etiqueta inesperada en simulacion');
      return label;
    },
    async attr(id, name) {
      if (name === 'password') return options.passwordVisible ? 'false' : 'true';
      return options.foreignApp ? 'production-login' : id === 'Contraseña' ? 'pa01-local-password' : 'pa01-local-username';
    },
    async clear(id) { state[id === 'Contraseña' ? 'password' : 'username'] = ''; },
    async hideKeyboard() {},
    async input(label, value) { state.inputs.push(label); state[label === 'Contraseña' ? 'password' : 'username'] = value; },
    async click(label) {
      if (label === 'Iniciar sesión') {
        if (state.username && state.password === password && !options.rejectValid) state.screen = 'inicio';
      } else if (label === 'Abrir menú de navegación') state.menu = true;
      else if (label === 'Mi perfil') { assert.ok(state.menu); state.screen = 'perfil'; state.menu = false; }
      else if (label === 'Cerrar sesión') { assert.ok(state.menu); state.screen = 'login'; state.menu = false; }
      else assert.fail('Accion fuera del recorrido');
    },
  };
  return { ui, state };
}

test('lee una sola clave ficticia hex sin ejecutar valores del archivo env', () => {
  assert.equal(fixturePassword('\uFEFFDAST_FIXTURE_PASSWORD=' + password + '\r\n'), password);
  for (const text of ['DAST_FIXTURE_PASSWORD=$(secret)', 'DAST_FIXTURE_PASSWORD=short', `DAST_FIXTURE_PASSWORD=${password}\nDAST_FIXTURE_PASSWORD=${password}\n`]) {
    assert.throws(() => fixturePassword(text), { code: 'fixture-config' });
  }
});

test('conserva cambios ficticios del perfil A para comparar la identidad visual', () => {
  assert.equal(profileName(profile()), 'Prueba validacion Paciente A');
});

test('rechaza otra cuenta, correo real o datos privados en el perfil de preparacion', () => {
  for (const change of [{ username: 'dast_patient_b' }, { second_lastname: 'B' }, { email: 'real@example.com' }, { notes: 'private' }, { password_hash: 'private' }]) {
    const body = profile(); Object.assign(body.data, change);
    assert.throws(() => profileName(body), { code: 'fixture-profile' });
  }
});

test('la sesion no borra Expo Go ni vuelca su arbol de interfaz en errores', () => {
  const caps = sessionCapabilities('emulator-5554');
  assert.equal(caps['appium:noReset'], true);
  assert.equal(caps['appium:fullReset'], false);
  assert.equal(caps['appium:autoLaunch'], false);
  assert.equal(caps['appium:printPageSourceOnFindFailure'], false);
  assert.equal(caps['appium:appPackage'], 'host.exp.exponent');
  assert.throws(() => sessionCapabilities('physical-device'), { code: 'emulator-selection' });
});

test('WebDriver solo usa loopback y rechaza redirecciones', async () => {
  let request;
  const result = await appiumRequest('/status', 'GET', undefined, async (url, options) => {
    request = { url, options };
    return new Response('{"value":{"ready":true}}', { status: 200 });
  });
  assert.equal(result.ready, true);
  assert.equal(request.url, 'http://127.0.0.1:4723/status');
  assert.equal(request.options.redirect, 'error');
  assert.ok(request.options.signal instanceof AbortSignal);
  await assert.rejects(appiumRequest('https://outside.example.test/status'), { code: 'appium-route' });
});

test('el informe solo recibe una version Appium 3 estable y no la respuesta de red completa', async () => {
  const status = await appiumRequest('/status', 'GET', undefined, async () => new Response(JSON.stringify({ value: {
    ready: true, build: { version: '3.9.0', token: 'fixture-build-token' },
    message: 'fixture-private-message', credentials: { password },
  } }), { status: 200 }));
  const report = { appiumVersion: appiumVersion(status) };
  assert.deepEqual(JSON.parse(JSON.stringify(report)), { appiumVersion: '3.9.0' });
  for (const version of ['3.0.0', '3.10.21']) {
    assert.equal(appiumVersion({ ready: true, build: { version } }), version);
  }
});

test('rechaza versiones Appium con datos arbitrarios, tipos coercibles o formato incompleto', () => {
  const array = ['3.9.0', { token: 'fixture-not-a-real-token', password }];
  // La guarda anterior por prefijo aceptaba ambos valores y los copiaba al JSON.
  assert.equal(/^3\./.test(array), true);
  assert.equal(/^3\./.test('3.9.0 fixture-not-a-real-token'), true);
  const invalid = [null, undefined, 3.9, true, array, { version: '3.9.0' },
    '', '3.', '3.9', '4.0.0', '3.09.0', '3.9.00', '3.9.0-beta.1', '3.9.0+private',
    '3.9.0 fixture-not-a-real-token', '3.9.0/../../summary.json', '3.9.0\n', '3.9.0\r\n',
    '3.9.0\u0000', '3.9.0<script>fixture</script>', `3.${'9'.repeat(10000)}.0`, '3.9007199254740992.0'];
  for (const version of invalid) {
    assert.throws(() => appiumVersion({ ready: true, build: { version } }), error => {
      assert.equal(error.code, 'appium-status');
      assert.equal(error.message, 'appium-status');
      assert.deepEqual(JSON.parse(JSON.stringify(error)), { code: 'appium-status' });
      return true;
    });
  }
  for (const status of [null, {}, { ready: true }, { ready: false, build: { version: '3.9.0' } }, { ready: 'true', build: { version: '3.9.0' } }]) {
    assert.throws(() => appiumVersion(status), { code: 'appium-status' });
  }
});

test('los errores WebDriver no exponen el mensaje que podria incluir una clave', async () => {
  await assert.rejects(appiumRequest('/session', 'POST', {}, async () => new Response(JSON.stringify({ value: { error: 'unknown error', message: password, stacktrace: 'private detail' } }), { status: 500 })), e => {
    assert.equal(e.code, 'appium-command'); assert.equal(e.message, 'appium-command');
    assert.ok(!JSON.stringify(e).includes(password)); return true;
  });
});

test('bloquea el recorrido antes de escribir credenciales si la app no usa la API local', async () => {
  const { ui, state } = fakeUi({ foreignApp: true });
  await assert.rejects(runScenario(ui, password, 'Prueba validacion Paciente A', async (_id, _name, task) => task()), { code: 'app-local-api' });
  assert.deepEqual(state.inputs, []);
});

test('exige contrasena oculta antes de escribir datos ficticios', async () => {
  const { ui, state } = fakeUi({ passwordVisible: true });
  await assert.rejects(guardLocalLogin(ui), { code: 'password-visible' });
  assert.deepEqual(state.inputs, []);
});

test('el recorrido simulado completa seis comprobaciones y vuelve al login sin editar perfil', async () => {
  const { ui, state } = fakeUi(); const results = [];
  await runScenario(ui, password, 'Prueba validacion Paciente A', async (id, name, task) => { await task(); results.push({ id, name }); });
  assert.deepEqual(results.map(r => r.id), ['PA01-01','PA01-02','PA01-03','PA01-04','PA01-05','PA01-06']);
  assert.equal(state.screen, 'login');
  assert.deepEqual(state.inputs, ['Correo electrónico o usuario','Contraseña','Contraseña']);
  assert.ok(results.every(r => !JSON.stringify(r).includes(password)));
});

test('un login valido que no abre Inicio impide registrar exito y continuar a Perfil', async () => {
  const { ui } = fakeUi({ rejectValid: true }); const completed = [];
  await assert.rejects(runScenario(ui, password, 'Prueba validacion Paciente A', async (id, _name, task) => { await task(); completed.push(id); }));
  assert.deepEqual(completed, ['PA01-01','PA01-02','PA01-03']);
});
