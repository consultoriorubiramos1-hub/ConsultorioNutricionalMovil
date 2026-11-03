async function main() {
  const base = 'http://127.0.0.1:3000';
  const password = process.env.AUTH_FIXTURE_PASSWORD;
  if (!password) throw new Error('Faltan fixtures de autenticación.');
  const results = [];
  async function check(name, path, options, expected) {
    const response = await fetch(base + path, { ...options, redirect: 'error', signal: AbortSignal.timeout(15000) });
    results.push({ name, expected, actual: response.status, passed: response.status === expected });
    return response;
  }
  const credentials = username => ({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
  await check('sesión sin token', '/api/mobile/auth/me', {}, 401);
  await check('token inválido', '/api/mobile/auth/me', { headers: { Authorization: 'Bearer dast-invalid' } }, 401);
  await check('login: JSON mal formado', '/api/mobile/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' }, 400);
  await check('cuenta inactiva', '/api/mobile/auth/login', credentials('dast_inactive'), 401);
  await check('rol no paciente', '/api/mobile/auth/login', credentials('dast_other_role'), 403);
  const login = await check('paciente sintético', '/api/mobile/auth/login', credentials('dast_patient_a'), 200);
  const body = await login.json();
  if (body?.ok !== true || typeof body.data?.token !== 'string') throw new Error('El login no devolvió el contrato esperado.');
  const me = await check('sesión con token emitido por la API', '/api/mobile/auth/me', { headers: { Authorization: `Bearer ${body.data.token}` } }, 200);
  const session = await me.json();
  const identityValid = session?.ok === true && session.data?.username === 'dast_patient_a' && session.data?.rol_id === 2;
  results.push({ name: 'identidad sintética del paciente', passed: identityValid });
  console.log(JSON.stringify({ executedAt: new Date().toISOString(), scope: 'auth-http-smoke', scannerExecuted: false, results }, null, 2));
  if (results.some(result => !result.passed)) process.exitCode = 1;
}

main().catch(() => {
  console.error('La comprobación HTTP local no pudo completarse. Revisa el arranque de la API y el sembrado de fixtures.');
  process.exitCode = 1;
});
