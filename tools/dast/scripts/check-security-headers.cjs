async function main() {
  const cases = [
    { name: 'sesion sin token', path: '/api/mobile/auth/me', expected: 401 },
    { name: 'JSON de login invalido', path: '/api/mobile/auth/login', expected: 400,
      options: { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' } },
    { name: 'metodo no soportado', path: '/api/mobile/auth/login', expected: 405 },
    { name: 'campos de login ausentes', path: '/api/mobile/auth/login', expected: 400,
      options: { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' } },
  ];
  const results = [];
  for (const item of cases) {
    const response = await fetch('http://127.0.0.1:3000' + item.path, {
      ...item.options, redirect: 'error', signal: AbortSignal.timeout(20000),
    });
    const header = response.headers.get('x-content-type-options');
    results.push({ name: item.name, expected: item.expected, actual: response.status,
      xContentTypeOptions: header, passed: response.status === item.expected && header === 'nosniff' });
    await response.body?.cancel();
  }
  console.log(JSON.stringify({ executedAt: new Date().toISOString(), scope: 'local-mobile-security-headers', results }, null, 2));
  if (results.some(result => !result.passed)) process.exitCode = 1;
}

main().catch(() => {
  console.error('No se pudo completar la comprobacion local de cabeceras.');
  process.exitCode = 1;
});
