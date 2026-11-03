# Rendimiento y esfuerzo con JMeter en la API local

REN01 y EST01 usan JMeter 5.6.3 por consola y el puente Docker existente en
127.0.0.1:3300. No necesitan Appium, Expo Go ni un emulador. Docker y los tres
servicios locales deben permanecer disponibles. Citas queda fuera.

Estado: ejecutor preparado; pendiente de resultados en la API Docker del operador.
La comprobacion del plan con respuestas simuladas no se declara REN01 ni EST01.

## Alcance y criterios fijados antes de ejecutar

Solo GET /api/mobile/auth/me y GET /api/mobile/perfil. Se prepara un unico login
fuera de la medicion y se comparte el token ficticio entre los usuarios virtuales.
Cada respuesta debe ser HTTP 200, JSON ok true e identidad A; Perfil ademas exige
apellido Paciente A y correo example.test. Esto mide consultas autenticadas, no
el coste del login ni veinte pacientes diferentes.

| Etapa | Usuarios virtuales | Duracion de carga |
|---|---:|---:|
| REN01-base | 1 | 30 s |
| REN01-carga | 5 | 60 s |
| EST01-10 | 10 | 45 s |
| EST01-20 | 20 | 45 s |
| EST01-recuperacion | 1 | 30 s |

El recorrido dura unos cuatro o cinco minutos, ademas de la descarga inicial.
Hay una pausa de un segundo antes de cada consulta, rampa de cinco segundos,
timeout de conexion de tres segundos y de respuesta de cinco segundos.
No se busca carga masiva ni se garantiza alcanzar el limite de saturacion.

Criterios locales de este experimento, no SLA de produccion:

- Al menos diez muestras de cada ruta por etapa.
- Errores como maximo del 1% en cada ruta y etapa.
- p95 como maximo de 2000 ms en cada ruta durante base, carga normal y recuperacion.
- Durante los dos escalones de esfuerzo se registra p95 sin imponerle ese limite.
- Si una ruta supera el 5% de errores o alcanza p95 de 5000 ms, no se aumenta
  mas la carga y se pasa a recuperacion. El resumen no presenta el recorrido
  completo como aprobado si quedaron escalones sin ejecutar.

Se calcula p50, p90, p95, p99, media, maximo, errores y consultas por segundo,
tanto por ruta como en conjunto. Los percentiles usan rango mas cercano.
Los errores de contrato con HTTP 200 tambien cuentan como errores. No se
infiere capacidad maxima cuando veinte usuarios no provocan degradacion.

## Preparacion en Windows

Desde el proyecto movil actualizado y sin cambios versionados pendientes:

```powershell
powershell -NoProfile -File .\tools\performance\install-jmeter.ps1
```

El instalador reutiliza Java, descarga el ZIP oficial de Apache solo cuando
falta, verifica su SHA-512 publicado y extrae JMeter bajo tools/dast/.local/jmeter.
No cambia PATH ni instala paquetes globales. El ejecutor requiere Java 17 o
posterior y Node 22.13 o posterior de la linea 22, disponibles en el entorno
preparado para estas pruebas. No se necesita abrir la interfaz de JMeter.

## Ejecucion

```powershell
node .\tools\performance\run-jmeter.cjs
```

El ejecutor no acepta argumentos de URL, carga, contrasena o token. Valida la
procedencia declarada y el checkout; reutiliza los sembradores existentes con
sus guardas de aislamiento y conserva las ediciones de perfiles ficticios.
Se verifica el login y las dos consultas antes de iniciar JMeter. El token se
trata como un valor Bearer opaco, compatible con el JWE emitido por NextAuth;
no se exige que tenga tres segmentos. Se rechazan valores vacios, caracteres
no validos para la cabecera y mas de 8192 caracteres. La API valida el token y
la identidad antes de iniciar la carga. No se crean
planes, mediciones ni correos. La carga se dirige al puente local fijo; no se
siguen redirecciones HTTP. No se consulta la base original.

Cada etapa inicia un proceso Java acotado, sin shell ni claves en argumentos.
El token solo se entrega al proceso hijo mediante una variable de entorno y
no se escribe en el JMX ni en archivos de propiedades. Se lee una vez al preparar
las variables del plan con BeanShell. Las comprobaciones HTTP/JSON se ejecutan
con ResponseAssertion y JMESPath nativos. El plan no ejecuta scripts Groovy,
para evitar la incompatibilidad de Groovy 3.0.20 con Java 22. Se muestran avances
por etapa. No ejecutar simultaneamente otra carga o ZAP sobre el mismo entorno.

## Evidencia

JMX versionado: tools/performance/local-read.jmx.
Configuracion de resultados: tools/performance/results.properties.
Los CSV, logs y summary.json quedan en tools/dast/.local/reports/jmeter-IDENTIFICADOR,
excluido de Git. Los CSV solo incluyen ocho campos numericos o etiquetas fijas;
no guardan cuerpos, cabeceras, tokens, mensajes de error ni datos del perfil.
Los logs de JMeter se deshabilitan para este recorrido.

Compartir **solo summary.json**. Los logs de otros procesos y config.env siguen
siendo privados. El resumen conserva commits declarados, hashes, limites y
resultados observados. performanceExecuted solo es true tras leer muestras
reales; passed exige las cinco etapas con sus criterios aprobados. Si falla la
preparacion, no se inventan mediciones. No se acredita el rendimiento de la app
Android instalada, TLS, red movil ni infraestructura de produccion.

Codigos de preparacion: jmeter-install pide instalar con el script; java-version
requiere JDK 17 o posterior; dirty-source exige revisar y conservar los cambios;
fixture-identity o fixture-profile detienen la carga antes de usar otra cuenta;
results-fields rechaza una salida con campos inesperados. results-empty indica
que no se obtuvieron muestras para alguna ruta, no una aprobacion con cero
errores. En ese caso incompleteStage conserva los conteos por ruta sin datos
privados. Se corrigio el plan anterior que, con Java 22 y Groovy, podia terminar
con un CSV que solo contenia cabecera. Si falla, conservar
el resumen y revisar el codigo antes de repetir.

Referencias primarias consultadas el 2 de noviembre de 2026:
[JMeter 5.6.3 y requisitos](https://jmeter.apache.org/download_jmeter.cgi),
[ejecucion CLI](https://jmeter.apache.org/usermanual/get-started.html),
[propiedades de resultados](https://jmeter.apache.org/usermanual/properties_reference.html),
[SHA-512 del ZIP](https://downloads.apache.org/jmeter/binaries/apache-jmeter-5.6.3.zip.sha512).
