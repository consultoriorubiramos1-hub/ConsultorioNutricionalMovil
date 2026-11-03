# PA01: aceptacion Android con Appium

Fecha local: 2 de noviembre de 2026, Ciudad de Mexico. Evidencia: salida de
consola compartida por el operador, conservada en [JSON](appium-pa01-resultados.json).

**Ultimo recorrido aprobado: 6/6**, con cierre de sesion WebDriver confirmado.
Appium 3.9.0, UiAutomator2 8.7.3 instalado previamente y Android 15 en emulador.
Runtime: Expo Go en desarrollo, conectado a la API aislada con cuentas ficticias.

| Paso | Comprobacion | Ultimo resultado |
|---|---|---|
| PA01-01 | Login de desarrollo conectado a API local | Aprobado |
| PA01-02 | Campos vacios rechazados | Aprobado |
| PA01-03 | Credenciales incorrectas rechazadas | Aprobado |
| PA01-04 | Cuenta ficticia accede a Inicio | Aprobado |
| PA01-05 | Perfil muestra la identidad ficticia A | Aprobado |
| PA01-06 | Cierre de sesion regresa a Login | Aprobado |

## Intentos y trazabilidad

1. 00:20:34.996 UTC: no se creo sesion Appium; `appium-command`. El operador
   compartio posteriormente un error de ADB, `device still authorizing`.
   Tras reiniciar ADB, `emulator-5554` volvio al estado `device`.
2. 00:28:09.551 UTC: se ejecuto el recorrido; cuatro pasos aprobados y fallo en
   PA01-05, `ui-element`. La sesion WebDriver se elimino. PA01-06 no se ejecuto.
3. 00:30:36.501 UTC: reintento con el mismo commit; seis pasos aprobados,
   `passed: true` y `cleanup: session-deleted`.

Los timestamps UTC anteriores corresponden al 2 de noviembre en Ciudad de Mexico.
El reintento exitoso no demuestra la causa del fallo previo de Perfil. No se
publico una correccion del ejecutor entre esos intentos ni se borra su resultado.

Commit movil: `a560a5503b0b6e2d5126c2d76ef35c7ddf9353a8`.
Commit backend declarado: `367c4bbfb595d7b8765c017a37d9ff7c78113400`.
El segundo se lee de source.json y no se verifico contra la imagen en ejecucion.
Los resumenes originales permanecen en el directorio local ignorado por Git.

## Alcance

Esta es una prueba de aceptacion con seis comprobaciones. Los reintentos no se
cuentan como pruebas nuevas. No acredita Release, la totalidad de modulos,
rendimiento, JMeter ni aprobacion de Google Play. Citas queda fuera del recorrido.
No se publican claves, tokens, capturas ni configuracion privada.
