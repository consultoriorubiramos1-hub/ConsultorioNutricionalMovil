# Autenticación y recuperación: correcciones del cliente

Fecha: 2026-11-01. Rama: `feature/seguridad-sast-dast`. Base: `6f942c64ef1293fe5134b44a50333ce30fb78b34`.

## Problemas revisados

- Login y recuperación podían interpretar un cuerpo de éxito sin exigir una respuesta HTTP exitosa.
- La consulta de sesión intentaba leer JSON antes de invalidar el token ante 401/403: una respuesta HTML impedía esa limpieza.
- Estos servicios no validaban el origen de la API ni limitaban la espera del transporte y del cuerpo JSON.
- El login podía mostrar texto de error proporcionado directamente por el servidor.

Son defectos del tratamiento de respuestas en el cliente. No demuestran que el backend permita autenticación no autorizada.

## Cambios

- Transporte compartido para login, consulta de sesión y las cuatro operaciones de recuperación. Solo HTTP 2xx permite interpretar un resultado como exitoso.
- Los rechazos HTTP se resuelven por estado sin leer su cuerpo; 401/403 de sesión intentan eliminar el token almacenado antes de devolver una sesión inválida.
- Se exige un origen HTTPS sin credenciales, ruta adicional, query ni fragmento. HTTP local o privado se admite únicamente con `__DEV__=true`; en Release se rechaza.
- Límite de 20 segundos para petición y lectura del cuerpo, con aborto y limpieza del temporizador. No se reintentan automáticamente cambios de contraseña.
- Validación en ejecución de banderas booleanas, token sin espacios ni controles y campos de identidad previstos. Se exige el rol de paciente definido por el contrato actual y se seleccionan únicamente id, username, email y rol_id.
- Mensajes públicos controlados por la aplicación; los detalles del servidor y del transporte no se propagan a la interfaz de acceso o recuperación.
- Las rutas, campos enviados y contratos válidos existentes se conservan. El mock del login en la prueba de documentos legales ahora incluye `Response.ok`.
- El arnés opcional de integración Node declara explícitamente `__DEV__=true`; su validación de entorno sigue limitando HTTP a localhost.

## Verificación ejecutada

Node 22.13.0, instalación con `npm ci` y dependencias del lockfile de la rama.

| Comprobación | Resultado |
|---|---|
| `npm run typecheck` | Aprobado |
| `npm run lint` | Aprobado, máximo de avisos permitido: 0 |
| `npm run verify:config` | Aprobado; no ejecuta suites ni construcciones |
| `git diff --check` | Aprobado |
| `npm test`: Jest unitario | 422/422, 23 suites |
| `npm test`: pruebas heredadas Node | 67/67 |
| `npm test`: integración con transporte simulado | 10/10, 1 suite |
| Total automatizado | 499/499: 468 existentes y 31 regresiones nuevas |
| Comprobación del arnés con servidor HTTP efímero en 127.0.0.1 | Login sintético aprobado; no se contactó el backend externo |

La nueva suite `tests/unit/auth-security.test.ts` cubre errores HTTP con éxito aparente, 401/403 con cuerpo no JSON, rechazo de HTTP público y URLs inválidas, ocultación de detalles internos, contratos positivos y negativos de recuperación, tipos de respuesta inválidos, selección de identidad, rol incorrecto y espera indefinida tanto de fetch como de JSON.

La salida completa de `npm test` está en [auth-pruebas-2026-11-01.txt](auth-pruebas-2026-11-01.txt). Los casos utilizan identidades y tokens sintéticos.

## Alcance pendiente

- Esta revisión abarca el cliente de autenticación y recuperación; no convierte todos los servicios de la app al transporte compartido.
- La comprobación de URL valida la configuración inicial. No constituye pinning de certificados ni una comprobación del transporte nativo, redirecciones o TLS del servidor.
- No se ejecutaron DAST contra el backend externo, pruebas con pacientes, verificación real de JWT ni controles de autorización del servidor. La integración real App–API–BD sigue pendiente de su entorno aislado.
- No se verificaron Debug/Release en dispositivo ni los casos funcionales, de caja blanca y caja negra del plan. Las 31 regresiones nuevas no sustituyen esos casos.
- Los hallazgos SCA residuales y los dos hallazgos CodeQL contextuales documentados en `sast-codeql-5642a32.md` no se cierran con este cambio. CodeQL debe analizar el nuevo commit.
- No se generaron builds, AAB, tags ni despliegues. La liberación conserva el disparador automático acordado.
