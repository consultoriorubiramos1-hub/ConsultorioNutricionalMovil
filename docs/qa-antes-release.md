# Pruebas pendientes de la version candidata

Fecha de preparacion: 2 de noviembre de 2026. Alcance actual: autenticacion,
Perfil, Inicio, Progreso, Plan alimenticio y Muro. Citas no forma parte del
recorrido visible. Los veinte casos funcionales originales conservan su cierre
por confirmacion del operador; los resultados nuevos se registran aparte.

## Entorno elegido

Appium necesita un dispositivo Android o un emulador Android. En este proyecto
se reutiliza el emulador API 35 porque el telefono del operador es iOS.
Docker no es un requisito de Appium ni de Google Play: aloja la API y PostgreSQL
de pruebas que ya se prepararon con cuentas ficticias. JMeter se comunica con
esa API y no necesita el emulador. No se requiere exportar de nuevo el esquema
ni regenerar claves para continuar las pruebas.

Un telefono Android y otro backend de pruebas podrian utilizarse con una
configuracion revisada. Esta preparacion concreta usa el entorno Docker ya
aislado, sin dirigirse a la base de pacientes.

## Primer paso de preparacion

Con el emulador y Docker Desktop abiertos, ejecutar en PowerShell desde la
carpeta del proyecto movil:

```powershell
node .\tools\acceptance\preflight.cjs
```

El comando lee versiones y disponibilidad, consulta adb y hace un GET anonimo
exclusivamente a `http://127.0.0.1:3300/api/mobile/auth/me`. Espera JSON 401.
No inicia contenedores, no instala Appium, no envia credenciales ni modifica
cuentas. Solo comprueba presencia de los archivos del entorno; no lee ni
imprime las claves. La salida puede compartirse para preparar el paso siguiente.
Un `passed: false` identifica preparacion pendiente, no un fallo funcional de
la app. Appium detectado en PATH todavia requiere verificar version y driver.

Si API y base ya estan creadas, puede recuperarse su arranque con el puente:

```powershell
docker compose --env-file tools/dast/.local/config.env -f tools/dast/compose.yml -f tools/dast/compose-emulator.yml up --no-build -d --wait api emulator-proxy
```

La base local usa tmpfs y puede quedar vacia tras detenerla. Si el control de
autenticacion indica ausencia de fixtures, revisar y ejecutar los sembradores
existentes siguiendo la guia; no asumir persistencia de los datos de pruebas.

## PA01 de aceptacion con Appium

Recorrido adaptado al alcance actual:

1. Abrir el proyecto movil conectado a la API aislada y comenzar sin sesion.
2. Intentar login con campos vacios y confirmar que permanece en Login.
3. Usar `dast_patient_a` con clave incorrecta y comprobar el rechazo.
4. Usar la clave ficticia local correcta y esperar el acceso a Inicio.
5. Abrir el menu y Mi perfil; confirmar la identidad ficticia A y ausencia de B.
6. Cerrar sesion desde el menu y comprobar el regreso a Login.

La automatizacion conserva version, commit, emulador y resultados por paso.
El ejecutor ya esta preparado en `tools/acceptance/run-pa01.cjs`, conforme a la
[guia de Appium local](appium-local.md). La clave se obtiene de la configuracion
local y no se incluye en argumentos, logs ni capturas. Se preparan las cuentas
y perfiles ficticios que falten sin sobrescribir ediciones; no se editan campos
del perfil durante el recorrido ni se envian correos.
Las pruebas en Expo Go se identifican como desarrollo; Release se revalida
despues sobre la distribucion del AAB. Estado: **PA01 aprobado, 6/6**, segun
[resultado del operador](evidencias/pruebas/2026-11-02/appium-pa01-resultados.md).
Se conservan los intentos anteriores y el reintento exitoso del mismo commit.

## REN01 de rendimiento y EST01 de esfuerzo con JMeter

Ejecutor preparado en `tools/performance/run-jmeter.cjs`; seguir la
[guia local y sus criterios previos](jmeter-local.md). Se ejecutaran contra
consultas autenticadas de la API aislada, sin Citas.
El escenario propuesto consulta la sesion y el perfil de cuentas ficticias.
La autenticacion se prepara fuera de la repeticion de consultas para distinguir
su coste de la carga de lectura.

REN01 medira tiempos de respuesta, percentiles, volumen atendido y errores
con carga pequena y acotada. EST01 aumentara concurrencia por etapas y despues
la reducira para observar recuperacion. La guia fija de antemano limites,
duracion y criterios del entorno; no se atribuye un SLA ni un limite de
capacidad a priori. Se conservaran `.jmx`, resultados y observaciones sin tokens.
Estado: **REN01 y EST01 no ejecutados**.

## Cierre posterior

Tras ejecutar y documentar las pruebas, se corregiran fallos y se repetiran los
controles del commit candidato. Se preparara la rama release y se verificara el
workflow antes de integrar en main: el orden solicitado es release, integracion
en main y disparador automatico para generar AAB y tag. El workflow existente
usa un tag como entrada; su ajuste corresponde a una etapa posterior y no se
declara realizado en esta preparacion. No se creo release, tag ni AAB.

Despues del AAB se documentaran instalacion, smoke, matriz Release y revision
JADX o MobSF. La revision de requisitos del instrumento y de Play Console tiene
su propio seguimiento; estas pruebas no constituyen una aprobacion de la tienda.

Referencias tecnicas: [Appium y requisitos](https://appium.io/docs/en/latest/quickstart/requirements/),
[UiAutomator2](https://github.com/appium/appium-uiautomator2-driver),
[JMeter en linea de comandos](https://jmeter.apache.org/usermanual/get-started.html).
