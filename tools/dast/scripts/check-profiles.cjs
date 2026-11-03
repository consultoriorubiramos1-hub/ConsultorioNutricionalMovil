const { localConnection, profiles } = require('./seed-profiles.cjs');

async function main() {
  localConnection(process.env);
  const password = process.env.AUTH_FIXTURE_PASSWORD;
  if (!password || password.length < 20) throw new Error('Falta la clave sintetica.');
  const results = [];
  async function request(path, options = {}) {
    return fetch('http://127.0.0.1:3000' + path, { ...options, redirect: 'error', signal: AbortSignal.timeout(60000) });
  }
  const anonymous = await request('/api/mobile/perfil');
  results.push({ name: 'perfil sin token', expected: 401, actual: anonymous.status, passed: anonymous.status === 401 });
  for (const profile of profiles) {
    const login = await request('/api/mobile/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: profile.username, password }),
    });
    const loggedIn = await login.json();
    if (login.status !== 200 || loggedIn?.ok !== true || typeof loggedIn.data?.token !== 'string') throw new Error('No se pudo autenticar la cuenta sintetica.');
    const response = await request('/api/mobile/perfil', { headers: { Authorization: `Bearer ${loggedIn.data.token}` } });
    results.push({ name: `perfil de cuenta ${profile.surname}`, expected: 200, actual: response.status, passed: response.status === 200 });
    const body = await response.json();
    const data = body?.data;
    const identity = body?.ok === true && data?.username === profile.username &&
      data?.first_lastname === 'Paciente' && data?.second_lastname === profile.surname &&
      typeof data?.email === 'string' && data.email.endsWith('@example.test') &&
      !Object.hasOwn(data, 'password_hash') && !Object.hasOwn(data, 'notes');
    results.push({ name: `identidad sintetica ${profile.surname} y contrato publico`, passed: identity });
  }
  console.log(JSON.stringify({ executedAt: new Date().toISOString(), scope: 'local-profile-http-smoke', scannerExecuted: false, results }, null, 2));
  if (results.some(result => !result.passed)) process.exitCode = 1;
}

main().catch(() => {
  console.error('La comprobacion de perfiles no termino. Revisa el backend actualizado y el sembrado; no compartas claves ni tokens.');
  process.exitCode = 1;
});
