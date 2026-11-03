# Aceptacion Android con Appium en el entorno local

PA01 automatiza login, consulta de Perfil y cierre de sesion. Se reutiliza
Android Emulator API 35 con Expo Go y la API aislada de Docker. Citas queda
fuera. No hace falta bundletool, ffmpeg ni GStreamer para este recorrido.

Versiones preparadas: Appium 3.9.0 y UiAutomator2 8.7.3, compatibles con Node
22.13.0. La instalacion global no agrega dependencias al package.json movil.
El operador compartio el doctor con cero correcciones obligatorias pendientes.
El operador compartio un recorrido real aprobado con seis comprobaciones:
[PA01 y sus intentos](evidencias/pruebas/2026-11-02/appium-pa01-resultados.md).

## Terminal de Appium

Usar la terminal donde se configuraron JAVA_HOME y ANDROID_HOME. Mantenerla
abierta durante la ejecucion:

```powershell
$appiumCmd = Join-Path ((npm prefix -g).Trim()) "appium.cmd"
& $appiumCmd server --address 127.0.0.1 --port 4723 --log-level warn
```

El servidor queda esperando conexiones. Con el nivel warn puede no imprimir
mensajes mientras espera; no es un bloqueo. No habilitar relaxed security ni
volcado del arbol de pantallas. No compartir el log completo del servidor.

## Terminal de Expo

Actualizar primero la rama de pruebas para obtener el ejecutor y sus guardas.
Desde otra terminal, dentro de la carpeta del proyecto movil:

```powershell
$env:EXPO_NO_DOTENV = "1"
$env:EXPO_PUBLIC_API_URL = "http://10.0.2.2:3300"
npm run android -- --go --clear
```

Dejar Expo abierto. Cuando cargue la app, debe verse Login con la contrasena
oculta. Si restaura una sesion anterior, salir desde el menu. No escribir claves
manualmente ni operar el emulador mientras el ejecutor controle el recorrido.

## Terminal de la prueba

Desde una tercera terminal, dentro de la misma carpeta del proyecto:

```powershell
node .\tools\acceptance\run-pa01.cjs
```

El ejecutor exige un checkout sin cambios en archivos versionados y un unico
emulador. Usa Appium exclusivamente por loopback. Antes de la interfaz ejecuta
los sembradores existentes sobre el contenedor API: crean las cuentas y perfiles
ficticios si faltan y conservan las ediciones existentes del perfil. Sus guardas
rechazan destinos o pacientes ajenos al entorno de prueba. No crea planes,
mediciones ni correos.

La clave ficticia se lee de config.env; los tokens se mantienen en memoria.
Se verifica por HTTP que el perfil sea la identidad A con correo example.test.
El ejecutor no acepta URLs ni credenciales como argumentos. Antes de escribir
en Login, exige dos marcadores nativos que solo existen en desarrollo cuando
EXPO_PUBLIC_API_URL coincide exactamente con la API local del emulador. Si la
guarda no coincide, se detiene antes de escribir credenciales.

## Comprobaciones del recorrido

| Paso | Resultado esperado |
|---|---|
| PA01 01 | Login de desarrollo conectado a la API local, con clave oculta. |
| PA01 02 | Campos vacios muestran Ingresa tu usuario. |
| PA01 03 | Clave incorrecta muestra Usuario o contrasena incorrectos. |
| PA01 04 | La cuenta ficticia valida accede a Inicio. |
| PA01 05 | Mi perfil muestra el nombre ficticio A devuelto por la API. |
| PA01 06 | Cerrar sesion regresa al Login. |

La ausencia de planes o mediciones en los fixtures no se convierte en un fallo
de este recorrido, cuyo alcance es autenticacion y consulta de Perfil. No
acredita el funcionamiento completo del resto de modulos.

## Resultado y diagnostico

El resultado imprime seis estados y guarda summary.json bajo
tools/dast/.local/reports/appium-pa01 seguido del identificador de ejecucion.
Ese directorio esta excluido de Git. Compartir solo el resumen; no config.env,
claves, tokens ni logs completos de Appium. No se generan capturas o grabaciones
automaticas.

`acceptanceExecuted` indica si se creo una sesion real Appium. `passed` solo
es true cuando los seis pasos completaron correctamente y se cerro la sesion
WebDriver. Si aparece false, conservar failedAt y errorCode; corregir y repetir.
La salida de preparacion no se cuenta como PA01 aprobado.

Codigos frecuentes: appium-connection significa servidor no disponible;
fixture-http o fixture-login requieren revisar la API local y los fixtures;
ui-element requiere comprobar pantalla y carga; app-local-api indica que falta
recargar la version actual con la URL local; password-visible pide ocultar
la contrasena. dirty-source exige revisar y conservar los cambios antes de
documentar un commit. El ejecutor intenta cerrar la sesion sintetica al fallar,
pero si queda abierta debe cerrarse manualmente antes de repetir.

La prueba se registra como Expo Go en desarrollo. La validacion de Release
se realiza posteriormente sobre la version instalada a partir del AAB.

Referencias: [WebDriver Appium](https://appium.io/docs/en/latest/reference/api/webdriver/),
[UiAutomator2 8.7.3](https://github.com/appium/appium-uiautomator2-driver/tree/v8.7.3),
[testID React Native](https://reactnative.dev/docs/view#testid),
[Expo SDK 58](https://docs.expo.dev/versions/v58.0.0/).
