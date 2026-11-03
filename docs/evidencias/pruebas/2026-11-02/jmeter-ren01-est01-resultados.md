# REN01 y EST01: rendimiento y esfuerzo local aprobados

Fecha local: 2 de noviembre de 2026, Ciudad de Mexico. Inicio declarado:
2026-11-03T01:26:12.520Z, equivalente a 19:26:12 del 2 de noviembre.
Origen: resumen completo de consola compartido por el operador, transcrito en
[JSON](jmeter-ren01-est01-resultados.json). Los CSV originales permanecen en
su equipo; no se recibieron ni se reconstruyen a partir de estadisticas.

**Resultado: cinco etapas aprobadas, 1566 consultas y cero errores.** Todas las
respuestas medidas fueron HTTP 200 y pasaron las comprobaciones de contrato e
identidad ficticia. El recorrido usa Apache JMeter 5.6.3, Java 22, Windows y la
API aislada de Docker, por HTTP local y una cuenta ficticia compartida.

## Resultado por etapa

| Etapa | Usuarios virtuales | Duracion configurada | Consultas | Errores | p95 de la etapa | Resultado |
|---|---:|---:|---:|---:|---:|---|
| REN01-base | 1 | 30 s | 28 | 0 | 56 ms | Aprobada |
| REN01-carga | 5 | 60 s | 280 | 0 | 34 ms | Aprobada |
| EST01-10 | 10 | 45 s | 410 | 0 | 30 ms | Aprobada |
| EST01-20 | 20 | 45 s | 820 | 0 | 35 ms | Aprobada |
| EST01-recuperacion | 1 | 30 s | 28 | 0 | 30 ms | Aprobada |

El percentil de esta tabla corresponde a cada etapa. No se calcula un p95
global combinando los percentiles de etapas; harian falta las muestras.

## Comprobaciones por ruta

| Etapa | Consultas auth/me | p95 auth/me | Consultas Perfil | p95 Perfil |
|---|---:|---:|---:|---:|
| REN01-base | 14 | 81 ms | 14 | 56 ms |
| REN01-carga | 141 | 29 ms | 139 | 45 ms |
| EST01-10 | 208 | 28 ms | 202 | 30 ms |
| EST01-20 | 416 | 31 ms | 404 | 38 ms |
| EST01-recuperacion | 14 | 80 ms | 14 | 27 ms |

Totales: 793 consultas de sesion y 773 de Perfil, todas con cero errores.
Cada ruta produjo al menos diez muestras en cada etapa. Las tres etapas con
limite de tiempo exigido cumplieron p95 <= 2000 ms y todas cumplieron errores
<= 1%, criterios fijados antes del recorrido. No se activo el freno de carga.

Con veinte usuarios virtuales se midieron 18.707 consultas por segundo, p95
conjunto de 35 ms y maximo de 138 ms. La etapa posterior de un usuario produjo
28 consultas, cero errores y p95 conjunto de 30 ms: la recuperacion cumplio su
criterio. Los escalones de esfuerzo de diez y veinte usuarios tampoco
presentaron degradacion que activara el freno, por lo que no se determino un
limite de saturacion ni una capacidad maxima del sistema.

## Trazabilidad

- Commit movil probado: `4f376bf71c0347c3f36e1fc93e274ad7e356b760`.
- Commit backend declarado: `367c4bbfb595d7b8765c017a37d9ff7c78113400`.
- JMX SHA-256: `8ecd917127e0678116d4a47316b0965da77d61b7a0d17d22b70afca4015dc68d`.
- Propiedades SHA-256: `77c972702f5af92825d6259f39db31796da14190778213e253fcff77bf1d6af8`.
- Los hashes de JMX y propiedades recibidos coinciden con los archivos
  versionados revisados al usar los finales de linea CRLF del checkout Windows.
  El backend se declara desde source.json; no se
  verifica su commit contra la imagen en ejecucion.

Se conservan los intentos previos fallidos de preparacion en
[jmeter-token-correccion.md](jmeter-token-correccion.md) y
[jmeter-java22-correccion.md](jmeter-java22-correccion.md). No se convierten en
mediciones aprobadas ni se suman los reintentos como casos nuevos.

## Alcance del cierre

REN01 y EST01 quedan aprobados para estas dos consultas autenticadas en el
entorno local. Son dos casos con cinco etapas de medicion, no 1566 pruebas
funcionales diferentes. El login se preparo fuera de la carga. No se miden
otros modulos, el binario Android, TLS, dispositivos ni la red de produccion.
Citas queda fuera del alcance. La validacion de Release permanece separada.

El conjunto no demuestra por si solo capacidad de produccion ni aprobacion de
Google Play. No se publican tokens, claves, cuerpos JSON de pacientes, logs ni
configuracion privada. No se crean planes, mediciones clinicas ni correos.
