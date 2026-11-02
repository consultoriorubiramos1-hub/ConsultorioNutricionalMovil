# PREP-02: cuentas sinteticas y autenticacion HTTP local

**Resultado: aprobado, 8/8 comprobaciones HTTP.** Ejecucion reportada: `2026-11-02T19:54:04.965Z`, equivalente al 2 de noviembre de 2026, 13:54:04.965 de Ciudad de Mexico.

El operador ejecuto `seed-auth.cjs` y, al terminar correctamente, `check-auth.cjs` dentro del servicio `api`, utilizando Compose base y su complemento para el emulador. Se conserva la [salida JSON compartida](prep-02-auth-http.json), sin tokens ni contrasenas. Codex documenta el resultado aportado; no presenta esta ejecucion como realizada en su propio workspace.

## Preparacion observada

El sembrado informo: **cuatro cuentas sinteticas creadas para autenticacion; sin historias clinicas ni envio de correos**. El script limita la escritura a `db/cnm_dast` con usuario `dast`, verifica la marca `cnm-local-dast` y rechaza usuarios ajenos a sus fixtures. No prepara planes alimenticios, mediciones ni los otros modulos de la app.

## Resultados recibidos

| Comprobacion | Esperado | Observado | Resultado |
|---|---|---|---|
| Sesion sin token | 401 | 401 | Aprobado |
| Token invalido | 401 | 401 | Aprobado |
| Login con JSON mal formado | 400 | 400 | Aprobado |
| Cuenta inactiva | 401 | 401 | Aprobado |
| Rol distinto de paciente | 403 | 403 | Aprobado |
| Paciente sintetico | 200 | 200 | Aprobado |
| Sesion con token emitido por la API | 200 | 200 | Aprobado |
| Identidad sintetica del paciente | Identidad y rol previstos por el fixture | `passed: true` | Aprobado |

El ejecutor utiliza `http://127.0.0.1:3000` dentro del contenedor. Esta ejecucion acredita HTTP real y el contrato de autenticacion del backend local con fixtures. La conectividad desde Chrome del emulador se acredita por separado en [PREP-01](prep-01-conectividad-emulador.md).

## Alcance y siguiente paso

La salida declara `scannerExecuted: false`: no es un nuevo escaneo ZAP ni SAST. No acredita aun el formulario de login, SecureStore o navegacion en la app, ni los casos funcionales CP01 a CP20. Los reportes de scanners y automatizados anteriores conservan su propia fecha y alcance.

Sigue abrir la app en Android Emulator con Expo Go, fijando la API local solo para la sesion PowerShell. Registrar el tipo de ejecucion como **Expo Go, desarrollo**, separado de la futura compilacion Release. El primer paso visual de CP01 comprueba el intento de acceso con campos vacios; su estado permanece pendiente hasta recibir la evidencia del operador.
