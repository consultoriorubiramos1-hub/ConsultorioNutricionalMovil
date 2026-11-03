const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function command(file, args) {
  const r = spawnSync(file, args, { encoding: 'utf8', timeout: 8000, windowsHide: true, shell: false });
  return { ok: !r.error && r.status === 0, text: `${r.stdout || ''}\n${r.stderr || ''}`.trim() };
}

function devicesFrom(output) {
  return String(output).split(/\r?\n/).flatMap(line => {
    const match = line.trim().match(/^(emulator-\d+)\s+(device|offline|unauthorized)(?:\s|$)/);
    return match ? [{ serial: match[1], state: match[2] }] : [];
  });
}

function selectEmulator(output) {
  const devices = devicesFrom(output);
  return devices.length === 1 && devices[0].state === 'device' ? devices[0].serial : null;
}

function supportedNode(version) {
  const m = String(version).match(/^v?(\d+)\.(\d+)\.(\d+)$/);
  return Boolean(m && Number(m[1]) === 22 && Number(m[2]) >= 13);
}

function javaMajor(output) {
  const m = String(output).match(/(?:openjdk|java) version "(\d+)(?:\.(\d+))?/);
  return m ? Number(m[1] === '1' ? m[2] : m[1]) : 0;
}

async function localApiReady(fetcher = fetch) {
  try {
    const r = await fetcher('http://127.0.0.1:3300/api/mobile/auth/me', {
      redirect: 'error', signal: AbortSignal.timeout(6000),
    });
    if (r.status !== 401 || !/^application\/json\b/i.test(r.headers.get('content-type') || '')) return false;
    const body = await r.json();
    return body?.ok === false && typeof body.message === 'string' && !Object.hasOwn(body, 'data');
  } catch { return false; }
}

async function main() {
  if (process.argv.length !== 2) throw new Error('Uso: node tools/acceptance/preflight.cjs (sin URL ni credenciales).');
  const root = path.resolve(__dirname, '../..');
  const sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT ||
    (process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk') : '');
  const adb = sdk && path.join(sdk, 'platform-tools', process.platform === 'win32' ? 'adb.exe' : 'adb');
  const adbPresent = Boolean(adb && fs.existsSync(adb));
  const listed = adbPresent ? command(adb, ['devices']) : { ok: false, text: '' };
  const serial = listed.ok ? selectEmulator(listed.text) : null;
  const boot = serial ? command(adb, ['-s', serial, 'shell', 'getprop', 'sys.boot_completed']) : { ok: false, text: '' };
  const java = command('java', ['-version']);
  const docker = command('docker', ['info', '--format', '{{.OSType}}']);
  const appium = process.platform === 'win32' ? command('where.exe', ['appium.cmd']) : command('which', ['appium']);
  const revision = command('git', ['-C', root, 'rev-parse', 'HEAD']);
  const checks = [
    { name: 'Node compatible con el proyecto', required: true, passed: supportedNode(process.version), observed: process.version },
    { name: 'Java 17 o posterior para preparar Android', required: true, passed: java.ok && javaMajor(java.text) >= 17 },
    { name: 'Android SDK y adb disponibles', required: true, passed: adbPresent },
    { name: 'Un emulador Android conectado y terminado de arrancar', required: true, passed: Boolean(serial && boot.ok && boot.text === '1') },
    { name: 'API local rechaza acceso anonimo con JSON 401', required: true, passed: await localApiReady() },
    { name: 'Configuracion y procedencia del entorno local presentes', required: true, passed: ['config.env', 'source.json'].every(f => fs.existsSync(path.join(root, 'tools/dast/.local', f))) },
    { name: 'Docker Linux en ejecucion para el backend local elegido', required: false, passed: docker.ok && docker.text === 'linux' },
    { name: 'Appium disponible en PATH', required: false, passed: appium.ok },
    { name: 'Java utilizado por Android Studio disponible', required: false, passed: Boolean(process.env.JAVA_HOME && fs.existsSync(path.join(process.env.JAVA_HOME, 'bin', process.platform === 'win32' ? 'java.exe' : 'java'))) },
  ];
  const ready = checks.filter(c => c.required).every(c => c.passed);
  console.log(JSON.stringify({
    executedAt: new Date().toISOString(), scope: 'acceptance-environment-preflight',
    mobileCommit: revision.ok && /^[a-f0-9]{40}$/.test(revision.text) ? revision.text : null,
    acceptanceExecuted: false, scannerExecuted: false, baseEnvironmentReady: ready,
    appiumAvailable: appium.ok, appiumDriverVerified: false,
    platform: os.platform(), checks,
    next: ready ? 'Revisar o instalar Appium y su driver; despues ejecutar PA-01.' : 'Atender los requisitos con passed false antes de PA-01.',
  }, null, 2));
  if (!ready) process.exitCode = 1;
}

module.exports = { devicesFrom, selectEmulator, supportedNode, javaMajor, localApiReady };
if (require.main === module) main().catch(() => {
  console.error('No se pudo completar el diagnostico. No compartas archivos de configuracion, claves o tokens.');
  process.exitCode = 1;
});
