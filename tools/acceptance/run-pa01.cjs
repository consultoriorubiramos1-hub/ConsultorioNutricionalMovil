const fs = require('node:fs');
const path = require('node:path');
const { randomBytes } = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { selectEmulator, supportedNode } = require('./preflight.cjs');

const ELEMENT = 'element-6066-11e4-a52e-4f735466cecf';
const API = 'http://127.0.0.1:3300';
const SERVER = 'http://127.0.0.1:4723';
const USER = 'dast_patient_a';
class PaError extends Error {
  constructor(code) { super(code); this.code = code; }
}
const requireCheck = (value, code) => { if (!value) throw new PaError(code); };
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

function fixturePassword(text) {
  const matches = [...text.replace(/^\uFEFF/, '').matchAll(/^DAST_FIXTURE_PASSWORD=([a-f0-9]{40})\r?$/gm)];
  requireCheck(matches.length === 1, 'fixture-config');
  return matches[0][1];
}

function profileName(body) {
  const d = body?.data;
  requireCheck(body?.ok === true && d?.username === USER && d.first_lastname === 'Paciente' &&
    d.second_lastname === 'A' && typeof d.email === 'string' && d.email.endsWith('@example.test') &&
    !Object.hasOwn(d, 'password_hash') && !Object.hasOwn(d, 'notes'), 'fixture-profile');
  const name = typeof d.nombre_completo === 'string' && d.nombre_completo.trim() ||
    [d.first_name, d.second_name, d.first_lastname, d.second_lastname].filter(x => typeof x === 'string' && x.trim()).map(x => x.trim()).join(' ');
  requireCheck(name.startsWith('Prueba ') && name.endsWith(' Paciente A'), 'fixture-name');
  return name;
}

function sessionCapabilities(serial) {
  requireCheck(/^emulator-\d+$/.test(serial), 'emulator-selection');
  return { platformName: 'Android', 'appium:automationName': 'UiAutomator2',
    'appium:udid': serial, 'appium:appPackage': 'host.exp.exponent',
    'appium:autoLaunch': false, 'appium:noReset': true, 'appium:fullReset': false,
    'appium:printPageSourceOnFindFailure': false, 'appium:newCommandTimeout': 120,
    'appium:uiautomator2ServerInstallTimeout': 120000 };
}

async function appiumRequest(route, method = 'GET', body, fetcher = fetch) {
  requireCheck(/^\/(?:status|session(?:\/[A-Za-z0-9._~%\/-]+)?)$/.test(route), 'appium-route');
  try {
    const r = await fetcher(SERVER + route, { method, redirect: 'error', signal: AbortSignal.timeout(150000),
      ...(body === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }) });
    const j = await r.json();
    requireCheck(r.ok && !j.value?.error, 'appium-command');
    return j.value;
  } catch (e) { throw e instanceof PaError ? e : new PaError('appium-connection'); }
}

function appiumVersion(status) {
  const version = status?.build?.version;
  if (status?.ready !== true || typeof version !== 'string' || version.length > 32) throw new PaError('appium-status');
  const match = /^3\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.exec(version);
  if (!match || match[0] !== version) throw new PaError('appium-status');
  const minor = Number(match[1]); const patch = Number(match[2]);
  if (!Number.isSafeInteger(minor) || !Number.isSafeInteger(patch)) throw new PaError('appium-status');
  // Unico dato Appium que se persiste: reconstruir solo la version numerica validada.
  return `3.${minor}.${patch}`;
}

function createUi(sessionId, request = appiumRequest, timeout = 30000) {
  requireCheck(typeof sessionId === 'string' && /^[A-Za-z0-9-]+$/.test(sessionId), 'appium-session');
  const base = '/session/' + sessionId;
  async function find(label, strategy = 'accessibility id') {
    const value = strategy === '-android uiautomator' ? `new UiSelector().text(${JSON.stringify(label)})` : label;
    const items = await request(base + '/elements', 'POST', { using: strategy, value });
    requireCheck(Array.isArray(items), 'appium-contract');
    return items[0]?.[ELEMENT] || null;
  }
  async function wait(label, accessibilityOnly = false) {
    const end = Date.now() + timeout;
    do {
      const id = await find(label) || (!accessibilityOnly && await find(label, '-android uiautomator'));
      if (id && await request(`${base}/element/${encodeURIComponent(id)}/displayed`)) return id;
      await delay(350);
    } while (Date.now() < end);
    throw new PaError('ui-element');
  }
  const attr = (id, key) => request(`${base}/element/${encodeURIComponent(id)}/attribute/${key}`);
  const clear = id => request(`${base}/element/${encodeURIComponent(id)}/clear`, 'POST', {});
  return {
    wait, attr, clear,
    async input(label, value) {
      const id = await wait(label, true);
      await clear(id);
      await request(`${base}/element/${encodeURIComponent(id)}/click`, 'POST', {});
      await request(`${base}/element/${encodeURIComponent(id)}/value`, 'POST', { text: value });
    },
    async click(label) { const id = await wait(label); await request(`${base}/element/${encodeURIComponent(id)}/click`, 'POST', {}); },
    async hideKeyboard() {
      if (await request(base + '/appium/device/is_keyboard_shown')) {
        await request(base + '/appium/device/hide_keyboard', 'POST', {});
      }
    },
  };
}

async function guardLocalLogin(ui) {
  const username = await ui.wait('Correo electrónico o usuario', true);
  const password = await ui.wait('Contraseña', true);
  for (const [id, expected] of [[username, 'pa01-local-username'], [password, 'pa01-local-password']]) {
    const actual = await ui.attr(id, 'resource-id');
    requireCheck(actual === expected || actual === `host.exp.exponent:id/${expected}`, 'app-local-api');
  }
  requireCheck(String(await ui.attr(password, 'password')) === 'true', 'password-visible');
  return { username, password };
}

async function runScenario(ui, password, name, record) {
  await record('PA01-01', 'Login de desarrollo conectado a API local', async () => {
    const fields = await guardLocalLogin(ui);
    await ui.clear(fields.username); await ui.clear(fields.password); await ui.hideKeyboard();
    await ui.wait('Bienvenido de nuevo');
  });
  await record('PA01-02', 'Campos vacios rechazados', async () => {
    await ui.click('Iniciar sesión'); await ui.wait('Ingresa tu usuario.');
  });
  await record('PA01-03', 'Credenciales incorrectas rechazadas', async () => {
    await guardLocalLogin(ui);
    await ui.input('Correo electrónico o usuario', USER);
    await ui.input('Contraseña', 'Incorrecta123!');
    await ui.hideKeyboard(); await ui.click('Iniciar sesión');
    await ui.wait('Usuario o contraseña incorrectos.');
  });
  await record('PA01-04', 'Cuenta ficticia accede a Inicio', async () => {
    await guardLocalLogin(ui);
    await ui.input('Contraseña', password);
    await ui.hideKeyboard(); await ui.click('Iniciar sesión');
    await ui.wait('Tu bienestar es un proceso, y vas por muy buen camino.');
  });
  await record('PA01-05', 'Perfil muestra la identidad ficticia A', async () => {
    await ui.click('Abrir menú de navegación'); await ui.click('Mi perfil');
    await ui.wait('Gestiona tu información personal y preferencias.'); await ui.wait(name);
  });
  await record('PA01-06', 'Cierre de sesion regresa a Login', async () => {
    await ui.click('Abrir menú de navegación'); await ui.click('Cerrar sesión');
    await guardLocalLogin(ui); await ui.wait('Bienvenido de nuevo');
  });
}

function command(file, args) {
  const r = spawnSync(file, args, { encoding: 'utf8', shell: false, windowsHide: true, timeout: 90000 });
  requireCheck(!r.error && r.status === 0, 'local-command');
  return r.stdout.trim();
}

async function apiRequest(route, options = {}) {
  requireCheck(['/api/mobile/auth/me', '/api/mobile/auth/login', '/api/mobile/perfil'].includes(route), 'api-route');
  try {
    const r = await fetch(API + route, { ...options, redirect: 'error', signal: AbortSignal.timeout(60000) });
    requireCheck(r.ok, 'fixture-http'); return await r.json();
  } catch (e) { throw e instanceof PaError ? e : new PaError('fixture-http'); }
}

async function main() {
  const root = path.resolve(__dirname, '../..');
  const report = { executedAt: new Date().toISOString(), scope: 'PA01-appium-local',
    runtime: 'Expo Go development', acceptanceExecuted: false, scannerExecuted: false,
    appiumVersion: null, backendCommitDeclared: null, mobileCommit: null,
    fixturesPrepared: false, results: [], passed: false, cleanup: 'not-needed',
    limitations: ['Un recorrido Android en Expo Go; no acredita Release ni todas las funciones.', 'Procedencia del backend leida de source.json, no verificada contra la imagen.'] };
  let sessionId; let ui;
  let phase = 'preparation';
  async function record(id, name, task) {
    phase = id;
    try { await task(); report.results.push({ id, name, passed: true }); }
    catch (e) { report.results.push({ id, name, passed: false }); throw e; }
  }
  try {
    requireCheck(process.argv.length === 2, 'arguments');
    requireCheck(supportedNode(process.version), 'node-version');
    const password = fixturePassword(fs.readFileSync(path.join(root, 'tools/dast/.local/config.env'), 'utf8'));
    const source = JSON.parse(fs.readFileSync(path.join(root, 'tools/dast/.local/source.json'), 'utf8'));
    requireCheck(/^[a-f0-9]{40}$/.test(source.backendCommit), 'source-metadata');
    report.backendCommitDeclared = source.backendCommit;
    report.mobileCommit = command('git', ['-C', root, 'rev-parse', 'HEAD']);
    requireCheck(/^[a-f0-9]{40}$/.test(report.mobileCommit), 'source-metadata');
    requireCheck(!command('git', ['-C', root, 'status', '--porcelain', '--untracked-files=no']), 'dirty-source');
    const sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || path.join(process.env.LOCALAPPDATA || '', 'Android', 'Sdk');
    const adb = path.join(sdk, 'platform-tools', process.platform === 'win32' ? 'adb.exe' : 'adb');
    const serial = selectEmulator(command(adb, ['devices']));
    requireCheck(serial, 'emulator-selection');
    report.androidVersion = command(adb, ['-s', serial, 'shell', 'getprop', 'ro.build.version.release']);
    report.appiumVersion = appiumVersion(await appiumRequest('/status'));
    phase = 'fixtures';
    const compose = ['compose', '--env-file', path.join(root, 'tools/dast/.local/config.env'), '-f', path.join(root, 'tools/dast/compose.yml'), '-f', path.join(root, 'tools/dast/compose-emulator.yml')];
    for (const script of ['seed-auth.cjs', 'seed-profiles.cjs']) {
      command('docker', [...compose, 'exec', '-T', 'api', 'node', `dast-tools/${script}`]);
    }
    report.fixturesPrepared = true;
    const login = await apiRequest('/api/mobile/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: USER, password }) });
    requireCheck(login?.ok === true && typeof login.data?.token === 'string' && login.data.token.length > 0, 'fixture-login');
    const profile = await apiRequest('/api/mobile/perfil', { headers: { Authorization: `Bearer ${login.data.token}` } });
    const name = profileName(profile);
    phase = 'appium-session';
    const session = await appiumRequest('/session', 'POST', { capabilities: { alwaysMatch: sessionCapabilities(serial), firstMatch: [{}] } });
    requireCheck(typeof session?.sessionId === 'string', 'appium-session');
    sessionId = session.sessionId; report.acceptanceExecuted = true;
    ui = createUi(sessionId);
    await runScenario(ui, password, name, record);
    report.passed = report.results.length === 6 && report.results.every(r => r.passed);
  } catch (e) {
    report.failedAt = phase;
    report.errorCode = e instanceof PaError ? e.code : 'preparation-error';
  } finally {
    if (sessionId) {
      report.cleanup = 'session-delete-pending';
      // Si fallo tras el login, intentar salir sin borrar datos de Expo Go.
      if (!report.passed && ui) {
        const cleanupUi = createUi(sessionId, appiumRequest, 1500);
        try { await cleanupUi.click('Abrir menú de navegación'); await cleanupUi.click('Cerrar sesión'); } catch { /* El resumen conserva el fallo; no se vuelcan errores del servidor. */ }
        try { const f = await guardLocalLogin(cleanupUi); await cleanupUi.clear(f.password); } catch { /* No editar otra pantalla si la guarda no coincide. */ }
      }
      try { await appiumRequest('/session/' + sessionId, 'DELETE'); report.cleanup = 'session-deleted'; }
      catch { report.cleanup = 'session-delete-failed'; report.passed = false; }
    }
    const runId = new Date().toISOString().replace(/[:.]/g, '-') + '-' + randomBytes(3).toString('hex');
    const dir = path.join(root, 'tools/dast/.local/reports', 'appium-pa01-' + runId);
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    fs.writeFileSync(path.join(dir, 'summary.json'), JSON.stringify(report, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
    console.log(JSON.stringify(report, null, 2));
    console.log('Resumen local: ' + path.relative(root, path.join(dir, 'summary.json')));
    if (!report.passed) process.exitCode = 1;
  }
}

module.exports = { PaError, fixturePassword, profileName, sessionCapabilities, appiumRequest, appiumVersion, createUi, guardLocalLogin, runScenario };
if (require.main === module) main().catch(() => {
  console.error('No se pudo guardar el resumen. No compartas logs completos de Appium ni configuracion privada.');
  process.exitCode = 1;
});
