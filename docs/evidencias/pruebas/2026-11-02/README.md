# Pruebas automatizadas ejecutadas el 2 de noviembre de 2026

Version probada: `6a83f257f1a870e6a0468aad20bd785bf9dd1fb7`, rama `feature/seguridad-sast-dast`. Ejecutor: Codex en workspace Linux, Node 22.13.0 y npm 10.9.9. Las comprobaciones empezaron a las 12:59:09 y terminaron a las 12:59:33 de Ciudad de Mexico (18:59 UTC).

## Resultado observado

| Comprobacion ejecutada | Resultado | Evidencia |
|---|---|---|
| `npm run typecheck` | Salida 0 | [typecheck.txt](typecheck.txt) |
| `npm run verify:config` | Salida 0; 23 archivos Jest de unidades y uno de integracion descubiertos | [config.txt](config.txt) |
| `npm run lint` | Salida 0 con `--max-warnings=0` | [lint.txt](lint.txt) |
| `npm run test:unit:jest -- --ci --coverage --json --outputFile=test-results/validacion-2026-11-02/unit.json` | 23 suites, 422 tests aprobados; cero fallidos, pendientes o todo | [unit.txt](unit.txt) |
| `npm run test:legacy` | 82 tests aprobados; cero fallidos, cancelados u omitidos | [legacy.txt](legacy.txt) |
| `npm run test:integration:mock -- --ci --coverage --json --outputFile=test-results/validacion-2026-11-02/integration.json` | Una suite, 10 tests aprobados; cero fallidos, pendientes o todo | [integration.txt](integration.txt) |

El [resumen estructurado](resumen.json) conserva commit, arbol, hash del lockfile, versiones del runtime, comandos exactos, horas UTC, codigos de salida, conteos por archivo y hashes SHA-256 de los seis logs. Estos conteos describen tests automatizados; no sustituyen los casos funcionales manuales de la matriz.

## Preparacion y alcance

Se reinstalaron las dependencias exactas del lockfile mediante `npm ci --ignore-scripts --no-audit --no-fund` (salida 0). Se deshabilitaron carga de dotenv y telemetria de Expo; `EXPO_PUBLIC_API_URL` se fijo en `https://api.example.test`. El transporte de Jest esta simulado por `tests/jest.setup.ts`. Las suites heredadas usan sus arneses controlados; los comandos Docker/pg_dump del tooling se sustituyen en sus pruebas.

No se contacto la API del consultorio ni PostgreSQL, no se enviaron correos y no se usaron datos de pacientes. La instalacion no ejecuta scripts de dependencias y esta validacion no demuestra una compilacion nativa.

La cobertura de lineas fue **83.82%** para los adapters/utils incluidos por la configuracion de unidades y **45.83%** para los services incluidos por la configuracion de integracion. Son denominadores distintos: no se suman ni se presentan como cobertura de toda la aplicacion. Los componentes, hooks y modulos nativos quedan fuera de esos glob de cobertura, aunque algunas suites los ejerciten con mocks.

## Trazabilidad de caja blanca

| Casos funcionales relacionados | Archivos automatizados ejecutados | Lo que aportan |
|---|---|---|
| CP01, CP03, CP04, CP28 | `tests/unit/auth.test.ts`, `auth-security.test.ts` e integracion mock | Validaciones, contrato de login, estado HTTP, rechazo de respuestas invalidas y retirada de token. No prueba el recorrido completo en Android. |
| CP02 | `tests/unit/auth-security.test.ts` | Contratos de recuperacion, errores y tiempos de espera; no entrega real de correo ni recorrido visual. |
| CP05 | `tests/unit/login-legal-documents.test.ts` | Apertura de documentos y preservacion del estado del login con modulos simulados. |
| CP06 | `tests/unit/perfil.test.ts` e integracion mock | Normalizacion, validaciones y cambios enviados; no persistencia real. |
| CP07, CP08 | `tests/unit/cancelacion*.test.ts`, `oposicion*.test.ts` | Preparacion de correo, campos, errores y comportamiento UI simulado; no eliminacion ni Opt-Out persistente. |
| CP09 | Integracion mock y `tests/unit/bienestar-ui.test.ts` | Composicion de progreso/plan, fallos parciales y rutas visibles; falta recorrido en dispositivo. |
| CP10 a CP13 | `tests/unit/nutrition-measurements.test.ts`, `evaluation-weight-progress.test.ts`, `weight-goal.test.ts`, `bmi-weight-reference.test.ts`, `historial*.test.ts` y `tests/historial.test.cjs` | Medidas validas, fechas, referencias por objetivo y adaptacion de historial. |
| CP14, CP15 | `tests/unit/plan-alimenticio.test.ts`, `tests/plan-alimenticio.test.cjs` e integracion mock | Contratos, horarios, ausencia de plan y errores; falta navegacion visual real. |
| CP16 a CP18 | `tests/unit/muro.test.ts`, `tests/muro.test.cjs` | Adaptacion, enlaces, busqueda, concurrencia y likes con servicios simulados. |
| CP19, CP20, CP27, CP30 | `tests/unit/perfil-citas-ui.test.ts`, `redesign-ui.test.ts` y suites heredadas de historial/muro | Controles parciales de interfaz, rutas y respuestas tardias; no acreditan aislamiento real entre cuentas ni accesibilidad en Android. |

Las suites historicas de citas y comprobantes permanecen como regresion interna. Su aprobacion no habilita citas en el producto movil ni cuenta como funcionalidad visible entregada. Las comprobaciones Python anidadas dentro de un test Node no se suman por separado a los 82 tests.

## Pendientes de ejecucion

Los recorridos manuales ya comenzaron: [CP01-A esta aprobada con captura](cp01-inicio-sesion.md), mientras CP01 completo queda parcial. CP02 a CP20 permanecen no ejecutados. La [guia de ejecucion](../../../guia-pruebas-dispositivo.md) identifica el entorno, los datos necesarios y el registro de cada caso.

Tampoco se ejecutaron la suite opcional `test:integration:live`, pruebas nativas de almacenamiento/pinning, comunicaciones SMTP externas, una compilacion Release o analisis JADX/MobSF. Los mocks no acreditan esos resultados. No se repitieron scanners SAST/DAST en esta sesion.

La integracion del disparador se pospone por instruccion del usuario. No se modificaron workflows, version, configuracion del producto ni backend; no se creo tag, build o envio a Play. La evidencia de Release se obtendra sobre el artefacto que genere posteriormente el flujo automatico.

## Preparacion posterior del acceso del emulador

Se agrega un [registro separado del puente local](puente-emulador.json): cinco comprobaciones nuevas y 87 tests de regresion aprobados, con tipos, lint y configuracion correctos. La guia distingue el puerto declarado de la conectividad efectiva: la salida del operador aun mostraba solo `3000/tcp`. El puente opcional mantiene API/DB/ZAP en la red interna y utiliza un servicio separado con entrada de loopback. Sus comprobaciones HTTP se ejecutaron contra servidores sinteticos en el workspace; el arranque Docker y la conexion del emulador quedan pendientes de la evidencia del operador. Los conteos originales de esta pagina conservan el commit y la hora de su primera ejecucion.

Actualizacion posterior del operador: [PREP-01, conectividad del emulador](prep-01-conectividad-emulador.md), **aprobada para el entorno**. Se recibieron servicios saludables, `HTTP 401` desde Windows y captura de Chrome en Android con el rechazo por token ausente. Esta evidencia posterior completa la conectividad pendiente; no aprueba automaticamente ningun caso funcional de la app.

[PREP-02, autenticacion HTTP local](prep-02-autenticacion-local.md): el operador repuso las cuatro cuentas sinteticas y compartio ocho comprobaciones aprobadas a las 13:54:04 de Ciudad de Mexico. La ejecucion real dentro de Docker se distingue de los mocks, la conectividad de Chrome y el login visual pendiente de la app.
