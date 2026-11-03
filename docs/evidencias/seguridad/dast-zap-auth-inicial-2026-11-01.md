# DAST local inicial de autenticacion

Ejecucion del operador: 2026-11-01, 17:59:55 de Ciudad de Mexico (23:59:55 UTC).

Se conserva el resumen compartido por el operador tras ejecutar `tools/dast/run-zap.cjs` en su equipo Windows con API y PostgreSQL aislados en Docker. Los reportes completos permanecen en su carpeta local de ejecucion. Los hashes de este documento provienen del resumen; no se recibio ni verifico independientemente el archivo bruto.

Resumen: [dast-zap-auth-inicial-2026-11-01.json](dast-zap-auth-inicial-2026-11-01.json).

| Dato | Resultado |
|---|---|
| Scanner | OWASP ZAP 2.17.0 |
| Rutas | POST /api/mobile/auth/login; GET /api/mobile/auth/me |
| Objetivo | http://api:3000, red interna de Docker |
| Estado del proceso | scannerExecuted=true; scannerExitCode=0 |
| Hallazgos altos / medios | 0 / 0 |
| Hallazgos bajos / informativos | 1 / 1 |
| Compuerta de riesgo alto | Aprobada en este alcance |
| Backend registrado | da349c00641cb9e4599f8089d3db1db56c281ec3 |
| Commit movil del ejecutor | cadf9dd44e117e3a156bef82c83ac8afabd82e08 |

## Revision de hallazgos

**10021, bajo, una instancia.** ZAP observo la ausencia de `X-Content-Type-Options: nosniff`. La configuracion revisada del backend no fija esa cabecera para la API movil. Se prepara una regla de Next.js limitada a `/api/mobile/:path*`, aplicable tambien a respuestas de error. El hallazgo se mantiene abierto hasta reconstruir la API local y repetir el scanner.

La correccion esta preparada en la rama del backend `feature/cabeceras-api-movil`, commit `b546782418a51f71637ad0cb8e1ad0951d24a883`, partiendo del commit escaneado. Solo agrega la cabecera a ese prefijo; conserva la regla existente del service worker. Se valido con Next.js 16.1.6, Node 22.13.0 y rutas sinteticas: cuatro comprobaciones HTTP de cabeceras aprobadas, respuestas ajenas al prefijo sin cambios, regla de `/sw.js` conservada y TypeScript aprobado. No se ejecuto la suite completa del backend ni se desplego esta rama a produccion como parte de la revision.

El repositorio movil incorpora `tools/dast/rebuild-api.cjs` para reconstruir exclusivamente `api` con `--no-deps`, comprobar las cabeceras y actualizar los metadatos del commit conservando esquema y claves. El Dockerfile evita el cambio recursivo de propietario sobre todas las dependencias: instala y copia con el usuario `node`. Su reconstruccion real en Docker queda pendiente del operador.

La preparacion movil paso lint, TypeScript, configuracion, sintaxis de scripts, comprobacion de espacios y 77 pruebas de la suite heredada. Tres regresiones nuevas comprueban que el actualizador solo opere sobre `api`, conserve claves y esquema, registre el nuevo commit despues del exito y mantenga metadatos anteriores ante un fallo o checkout con cambios. Los casos del actualizador usan Docker simulado; no sustituyen su ejecucion real en Windows.

**10104, informativo, tres instancias.** El User Agent Fuzzer compara estado y hash del cuerpo al cambiar User-Agent. El resumen informa diferencias, pero no contiene las solicitudes y respuestas necesarias para determinar su causa. No se declara una explotacion, un falso positivo ni una correccion; sigue pendiente la revision contextual. La regla no se deshabilita ni se excluye del reporte.

## Limites del resultado

El resultado corresponde a dos rutas en modo desarrollo y HTTP local, con cuentas sinteticas y fase activa acotada a cinco minutos. No acredita cero vulnerabilidades en toda la app, transporte TLS nativo, pinning, OAST externo, todos los controles JWT o pruebas en dispositivo. La integracion como workflow DAST de CI/CD, los otros modulos y los hallazgos SCA/SAST conservan su estado pendiente.

Se conserva este primer resultado aunque una repeticion posterior mejore los hallazgos. La base Neon no fue objetivo del scanner; no se generaron AAB, tags o despliegues durante esta ejecucion local.

Actualizacion: la [revalidacion del 2026-11-01 a las 20:14 de Ciudad de Mexico](dast-zap-auth-revalidacion-2026-11-01.md) confirma la reconstruccion real en Windows, cuatro comprobaciones de cabeceras aprobadas y ausencia del hallazgo 10021 en ZAP. Las notas anteriores conservan el estado de la primera ejecucion.

Referencias de clasificacion y tratamiento:

- [ZAP 10021](https://www.zaproxy.org/docs/alerts/10021/).
- [ZAP 10104](https://www.zaproxy.org/docs/alerts/10104/).
- [Next.js: headers](https://nextjs.org/docs/app/api-reference/config/next-config-js/headers).
