# Ejecucion de pruebas de la app: Debug y Release

Base: los veinte casos de `09_Plan_de_pruebas.docx` y los controles tecnicos del Instrumento Integral de Evaluacion Movil. Los pasos y resultados esperados de cada caso estan en la [matriz funcional](matriz-pruebas-funcionales.md). El instrumento no establece una cuota de treinta casos ni de doce pruebas por tipo.

## Estado de partida

Las comprobaciones automatizadas del 2 de noviembre de 2026 estan [ejecutadas y documentadas](evidencias/pruebas/2026-11-02/README.md): tipos, configuracion, lint, 422 tests Jest, 82 de regresion/tooling y 10 de integracion simulada. La evidencia de SAST/DAST previa se conserva separada. Ningun caso manual de esta guia se da por aprobado con esos conteos.

Por instruccion del usuario se empieza por las pruebas y se deja la integracion con el disparador y el tag para despues. Release, distribucion y analisis del binario requieren el AAB generado por ese flujo automatico; se verifican despues de obtenerlo.

## Preparacion para Android

Antes de los casos que consulten o modifiquen informacion:

1. Identificar telefono Android o emulador, modelo, version del sistema y forma de ejecucion de la app. Registrar commit, version de la app y tipo de build. Si se usa Expo Go, identificarlo como tal y no atribuirle evidencia del binario propio ni de controles nativos de Release.
2. Comprobar que la URL de la app conduce a la API y la base exclusivamente de pruebas, con datos sinteticos. El puerto declarado en el Compose base no acredita acceso desde Windows cuando la API solo tiene una red interna. Para el emulador, usar el puente opcional descrito abajo: publica `127.0.0.1:3300` y mantiene API, PostgreSQL y ZAP exclusivamente en su red interna. Comprobar el arranque de Docker y la conectividad del emulador por separado.
3. Preparar dos cuentas ficticias: A con plan y mediciones; B sin registros. El fixture reducido de DAST CI solo prepara autenticacion. No demuestra ni prepara planes, historial o muro. El esquema local exportado tampoco aporta filas de esos modulos.
4. Disponer de variantes controladas para fechas, pesos y porcentajes invalidos, ausencia de datos, sesion vencida y errores de respuesta. No provocar esas condiciones cambiando pacientes reales.
5. Para recuperacion, usar un buzon controlado por el equipo y una configuracion de correo exclusiva de pruebas. Los tests automaticos de contratos no comprueban entrega. Para CP07/CP08, preparar el borrador y cancelar la aplicacion de correo, sin enviarlo al destinatario real.

Si falta un requisito del caso, registrarlo como **bloqueado**, con su causa. Un resultado esperado escrito no es un resultado observado.

### Acceso local desde el emulador

El operador compartio el 2 de noviembre: Node 22.13.0, `emulator-5554 device`, Docker 29.1.3/Linux y API/DB saludables. La salida de `compose ps` solo mostraba `3000/tcp` para la API. Esto acredita preparacion parcial; no demuestra conectividad del emulador ni un caso funcional aprobado.

El complemento `tools/dast/compose-emulator.yml` agrega un puente HTTP que reutiliza la imagen Node ya construida. Solo este servicio tiene una red de entrada normal y el puerto `127.0.0.1:3300:3300`. API, DB y scanner conservan `isolated`; el puente no recibe sus variables o claves. Su destino es fijo (`api:3000`), solo reenvia rutas `/api/` y no registra peticiones, tokens ni cuerpos. No es un proxy abierto ni una configuracion de produccion.

Con los servicios existentes y saludables, iniciar el complemento sin reconstruir imagenes:

```powershell
docker compose --env-file tools/dast/.local/config.env -f tools/dast/compose.yml -f tools/dast/compose-emulator.yml up --no-build -d --wait api emulator-proxy
```

Comprobar primero en Windows:

```powershell
curl.exe --silent --show-error --max-time 20 --output NUL --write-out "HTTP %{http_code}\n" http://127.0.0.1:3300/api/mobile/auth/me
```

Se espera `HTTP 401` sin token; no 200. Luego comprobar la misma ruta en el navegador del emulador mediante `http://10.0.2.2:3300/api/mobile/auth/me`. Ese alias permite llegar al loopback del host desde Android Emulator. Verificar la respuesta antes de configurar la URL de la app. Para las operaciones posteriores que deban conservar este acceso, incluir ambos archivos Compose. El DAST base se ejecuta sin este complemento.

La [evidencia PREP-01](evidencias/pruebas/2026-11-02/prep-01-conectividad-emulador.md) ya registra el arranque saludable del puente, `HTTP 401` desde Windows y el JSON de rechazo recibido en Chrome del emulador. Se acredita la conectividad del entorno; los recorridos de la app conservan su estado separado. No cambia las credenciales, el esquema, la imagen de la API ni el disparador AAB.

Referencias: [redes internas de Compose](https://docs.docker.com/compose/how-tos/networking/#internal-networks), [publicacion en loopback](https://docs.docker.com/engine/network/port-publishing/) y [direccion del host en Android Emulator](https://developer.android.com/studio/run/emulator-networking-address).

### Inicio de la app para CP01

[PREP-02](evidencias/pruebas/2026-11-02/prep-02-autenticacion-local.md) registra cuatro cuentas sinteticas y 8/8 comprobaciones HTTP de autenticacion, reportadas por el operador. Con Docker y el emulador abiertos, ejecutar en PowerShell desde la carpeta del proyecto movil:

```powershell
git log -1 --oneline
$env:EXPO_NO_DOTENV = "1"
$env:EXPO_PUBLIC_API_URL = "http://10.0.2.2:3300"
npm run android -- --go --clear
```

Las variables se fijan para esa sesion y sus procesos; no se modifica `.env` ni la configuracion de liberacion. `--go` selecciona Expo Go. Registrar esta modalidad como desarrollo en Expo Go; no acredita un binario propio Debug o Release. Ya se recibieron las capturas de la app abierta para CP01-A, CP01-B y CP01-C; la salida de Expo y el commit exacto del cliente siguen pendientes de confirmar en el registro.

Referencias de Expo: [CLI y destino de apertura](https://docs.expo.dev/more/expo-cli/#launch-target), [variables y desactivacion de dotenv](https://docs.expo.dev/guides/environment-variables/#disabling-environment-variables).

## Orden de ejecucion funcional

| Bloque | Casos de la matriz | Comprobacion |
|---|---|---|
| 1. Acceso y documentos | CP01, CP05 | Campos vacios, login invalido/valido; ambos documentos y retorno al acceso. |
| 2. Recuperacion y sesion | CP02, CP03, CP04 | Codigos y contrasenas, sesion vencida, cierre y reentrada. |
| 3. Perfil y correo ARCO | CP06, CP07, CP08 | Datos/cuenta, guardado aceptado, campos del borrador y cancelacion del correo. |
| 4. Inicio y progreso | CP09, CP10, CP11, CP12, CP13 | Cuentas con/sin datos, fechas propias de indicadores, historial, objetivos y grafica. |
| 5. Alimentacion | CP14, CP15 | Plan/no plan, horarios incompletos, menus, detalle y regreso. |
| 6. Muro | CP16, CP17, CP18 | Contenido, imagen/enlaces, busqueda y likes, incluido fallo del servidor. |
| 7. Privacidad, red y accesibilidad | CP19, CP20 | Citas fuera de la interfaz, separacion de cuentas, desconexion/reintento, respuestas durante navegacion y texto ampliado. |

Cada caso conserva todos sus pasos y variantes de la matriz; agruparlo en esta tabla no reduce lo que debe comprobarse. Ejecutar primero en Debug y registrar por separado la repeticion en Release. Un fallo de acceso, privacidad o recorrido principal se corrige y se repite antes de cerrar la validacion.

### Primer caso: CP01

Con el entorno de pruebas confirmado y la app sin sesion:

1. Intentar entrar con los dos campos vacios. Registrar los mensajes y comprobar que se permanece en Login.
2. Usar una cuenta ficticia con contrasena incorrecta. Registrar el error y comprobar que no se abre Inicio ni se crea una sesion utilizable.
3. Usar las credenciales correctas de la misma cuenta. Comprobar que se abre Inicio y corresponde a esa identidad sintetica.
4. Guardar evidencia de las tres variantes sin mostrar contrasenas, tokens, datos reales o datos de contacto personales.

Las [variantes CP01-A a CP01-D](evidencias/pruebas/2026-11-02/cp01-inicio-sesion.md) ya tienen evidencia y confirmacion del operador: **CP01 aprobado para acceso y validaciones en desarrollo**. El [primer bloque recibido](evidencias/pruebas/2026-11-02/bloque-01-resultados.md) acredita ademas CP04 y CP05; CP02 queda parcial. La pantalla Inicio muestra avisos de datos no encontrados: INC-ENT-01 requiere revisar la estructura/configuracion local y preparar pacientes ficticios antes de los modulos siguientes. Se continua en bloques de cinco, con resultados individuales y sin aprobar por adelantado los recorridos de datos.

## Controles tecnicos adicionales

El [bloque 02 de Perfil](pruebas-bloque-02.md) conserva cinco comprobaciones manuales
pendientes. Antes requiere completar [PREP-03](evidencias/pruebas/2026-11-02/prep-03-perfiles.md)
y recibir el resultado HTTP de ambos perfiles ficticios.

CP21 a CP26 complementan el Word para comprobar requisitos del instrumento. CP27, CP28 y CP30 agregan regresiones de privacidad, respuestas y acceso externo. CP29 comprueba la instalacion/actualizacion de la distribucion prevista. Sus pasos se mantienen en la matriz, con este seguimiento de preparacion:

| Control | Estado de preparacion | Evidencia que falta |
|---|---|---|
| CP21: consentimiento explicito | Bloqueado: no se localizo un flujo Opt-In implementado en el acceso revisado. | Rechazo/aceptacion, sin seleccion inicial, y decision aplicada conforme al flujo definido. Abrir el aviso no lo acredita. |
| CP22/CP23: pinning valido/invalido | Bloqueado: no se localizaron configuracion o dependencia de pinning en los archivos revisados. | Conexion nativa autorizada y rechazo controlado de la identidad incorrecta. HTTP local de ZAP no lo prueba. |
| CP24: eliminacion de cuenta | Bloqueado: el flujo movil revisado prepara un correo. | Operacion autenticada sobre cuenta sintetica, resultado aplicado y estado posterior; falta verificar o completar el contrato del backend. |
| CP25: Opt-Out | Bloqueado: el flujo de oposicion revisado prepara un correo; no contiene switches persistentes. | Guardar, recargar, cambio de sesion/dispositivo y fallo de guardado de las preferencias. |
| CP26: permisos | No ejecutado; identificar los permisos de las funciones activas. | Solicitud a demanda, justificacion y denegacion controlada. No solicitar camara/GPS por funciones retiradas. |
| SN01: almacenamiento del token | No ejecutado en Android; `auth-storage.service.ts` ya usa SecureStore. | Guardado y recuperacion nativos, retiro al salir/rechazo de sesion y ausencia de token en logs o almacenamiento comun. La persistencia por si sola no demuestra cifrado. |
| SN02: tratamiento de 401 | Invalidez de sesion probada con mocks; refresco pendiente de contrato. | El servicio actual retira token y pide nuevo acceso. El instrumento menciona refresco 401: no atribuirle un refresh token inexistente. Revisar el contrato antes de acreditar ese criterio. |
| CP27/CP28/CP30 | No ejecutados en dispositivo; existe apoyo parcial automatizado. | Respuesta tardia de cuenta A tras cambiar a B, HTML/JSON invalido y enlace directo sin sesion. |
| CP29: instalar/actualizar | Pendiente de AAB del disparador. | Instalacion real de la distribucion interna, version, arranque y actualizacion. |

Estos estados describen bloqueos detectados por revision de codigo y prerrequisitos. No son resultados de una prueba manual ejecutada. Resolverlos no forma parte de una aprobacion automatica de esta guia ni autoriza cambios sobre datos reales.

## Despues del disparador automatico

1. Identificar el AAB firmado, su commit, version y versionCode; conservar el hash y la evidencia del job que lo produjo.
2. Instalar la version distribuida a partir de ese AAB y ejecutar la matriz Release con registros nuevos. Incluir navegacion, red, errores, almacenamiento, permisos y controles nativos implementados.
3. Verificar minificacion y reduccion de recursos sobre la compilacion generada. Analizar el binario correspondiente con JADX/MobSF y conservar reporte, herramienta, version y hash del artefacto. No acreditar resistencia absoluta a descompilacion.
4. Registrar incidencias, corregirlas y comprobar nuevamente la version afectada. La publicacion o envio a revision se acredita con el estado real de Play Console; una prueba interna por si sola no sustituye ese criterio del instrumento.

## Registro de cada ejecucion

Guardar una copia del siguiente bloque por caso y variante. Usar identificadores ficticios para las cuentas; no registrar sus contrasenas ni tokens.

```text
Caso e historia:
Fecha y hora (America/Mexico_City):
Persona que ejecuta:
Commit, version y build (Debug/Release/Expo Go):
Dispositivo, modelo y version Android:
Entorno de API y referencia del fixture sintetico:
Pasos y datos ficticios:
Resultado esperado:
Resultado observado:
Estado (aprobado/fallido/bloqueado/no ejecutado):
Referencia de evidencia:
Si falla: incidencia, severidad, responsable y pasos para reproducir:
Repeticion tras corregir: version, fecha y resultado:
```

Los campos sin observacion se conservan vacios y el caso sigue no ejecutado o bloqueado. El responsable por modulo se confirma contra Trello antes de asignar la ejecucion; esta guia no reasigna integrantes.
