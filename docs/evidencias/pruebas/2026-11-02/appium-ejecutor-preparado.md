# Ejecutor de aceptacion PA01 preparado

Fecha de registro: 2 de noviembre de 2026, Ciudad de Mexico. Base:
`7ec8f17ef88e9dd10e01c83ccc70500f7da667d9`.

El operador compartio la instalacion de Appium 3.9.0 y UiAutomator2 8.7.3.
Doctor informo cero correcciones obligatorias pendientes y tres opcionales:
bundletool, ffmpeg y GStreamer. No se requieren para este recorrido sin
instalacion de AAB, captura de video ni streaming. El entorno base habia
devuelto baseEnvironmentReady true a las 2026-11-03T00:00:36.764Z.
La evidencia sanitizada se conserva en appium-preparacion.json; no se copia el
PATH ni las rutas personales que aparecian en la consola.

Se preparo run-pa01.cjs con seis comprobaciones de interfaz. El acceso al
servidor Appium y a la API es exclusivamente por loopback. La sesion utiliza
Expo Go existente, sin borrar sus datos. La clave ficticia se lee localmente,
los tokens no se escriben y las respuestas de error del servidor se reducen a
codigos. No se generan capturas ni se publica configuracion privada.

Antes del recorrido se reutilizan los sembradores de autenticacion y perfiles
con sus guardas de aislamiento. Los perfiles existentes conservan sus cambios.
Dos testID del Login solo aparecen en desarrollo con la URL exacta de la API
del emulador; el ejecutor los verifica antes de escribir credenciales. En otras
configuraciones no se presentan esos identificadores. No se cambia el flujo
funcional de Login.

## Validacion del codigo ejecutada

Entorno: workspace Linux, Node 24.22.1. Los resultados siguientes corresponden
a las suites y controles del codigo preparado, no a Android real.

| Comando | Resultado |
|---|---|
| `npm run test:unit:jest -- --ci` | 23 suites y 422 pruebas aprobadas |
| `npm run test:legacy` | 111 aprobadas, 0 fallidas |
| `npm run test:integration:mock -- --ci` | 1 suite y 10 aprobadas |
| `npm run lint` | Aprobado |
| `npm run typecheck` | Aprobado |
| `npm run verify:config` | Aprobado |
| Sintaxis Node y `git diff --check` | Aprobados |

Las 111 pruebas heredadas incluyen las 93 anteriores, las ocho del diagnostico
ya preparado y diez nuevas del ejecutor. Los tests nuevos utilizan dobles del
transporte y de la interfaz. Cubren ausencia de exito falso, bloqueo por API
incorrecta, contrasena visible, otra identidad, destinos ajenos y errores con
datos privados. Este cambio integra ambas suites de herramientas en la
regresion requerida por CI.

## Estado del recorrido real

PA01 sigue pendiente de ejecucion en el emulador del operador. No se presenta
la simulacion del ejecutor como resultado de aceptacion Android. Los seis
resultados reales y la version observada se recibiran mediante summary.json.
No se modificaron el disparador, main, tag, AAB ni la distribucion.
