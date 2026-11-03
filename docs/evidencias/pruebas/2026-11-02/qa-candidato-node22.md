# Controles finales del codigo candidato y cierre de pruebas locales

Fecha local: 2 de noviembre de 2026, Ciudad de Mexico. Ejecucion automatica de
codigo: 2026-11-03T01:37:06Z. Resumen verificable en
[qa-candidato-node22.json](qa-candidato-node22.json).

Se verifico un snapshot limpio descargado de GitHub por SHA:
`4f376bf71c0347c3f36e1fc93e274ad7e356b760`.
Entorno Linux, Node 22.13.0 y TZ America/Mexico_City. Se comprobo el SHA-256
publicado de la distribucion Node descargada. El package-lock del snapshot
coincide byte por byte con el de las dependencias instaladas reutilizadas.
No se ejecuto una descarga nueva de npm ci en este cierre.

## Controles del codigo ejecutados

| Control | Resultado |
|---|---|
| Jest unitarias | 422/422 aprobadas, 23 suites |
| Regresion heredada y herramientas | 127/127 aprobadas |
| Integracion con API simulada | 10/10 aprobadas, 1 suite |
| Lint | Aprobado, salida cero |
| TypeScript | Aprobado, salida cero |
| verify:config | Aprobado, salida cero |

Son 559 comprobaciones automaticas de codigo distintas dentro de este corte.
Las repeticiones de suites en preparaciones anteriores no se suman como pruebas
nuevas. Las pruebas de herramientas Appium/JMeter incluidas en las 127 no se
presentan como ejecuciones de aceptacion ni de rendimiento. La suite heredada
mantiene cobertura historica; Citas no se reincorpora al alcance visible.

## Recorridos recibidos del operador

| Caso | Entorno y resultado | Evidencia |
|---|---|---|
| PA01 Appium | Android 15, Expo Go en desarrollo; 6/6 pasos aprobados, sesion eliminada | [Appium](appium-pa01-resultados.md) |
| REN01 JMeter | Base y carga normal aprobadas | [JMeter](jmeter-ren01-est01-resultados.md) |
| EST01 JMeter | Escalones de 10 y 20 usuarios y recuperacion aprobados | [JMeter JSON](jmeter-ren01-est01-resultados.json) |

JMeter recibio 1566 respuestas HTTP 200, cero errores y cinco etapas aprobadas.
Las dos consultas son sesion y Perfil de la cuenta ficticia; el login se
prepara fuera de la carga. No se alcanzo un limite de saturacion. Los resultados
originales se recibieron mediante consola del operador, no se ejecutaron desde
este workspace ni se sustituyeron por respuestas simuladas.

El recorrido de Appium corresponde al commit movil
`a560a5503b0b6e2d5126c2d76ef35c7ddf9353a8` y el de JMeter al commit candidato
`4f376bf71c0347c3f36e1fc93e274ad7e356b760`. Los commits intermedios de este
bloque agregaron evidencias y herramientas de rendimiento; no cambiaron los
componentes de la app probados en PA01. Los intentos previos fallidos se
conservan en sus registros.

## Paso siguiente y limites

El bloque local de aceptacion y rendimiento queda registrado como aprobado
para su alcance. SAST y DAST conservan sus evidencias separadas; estos controles
no son un nuevo escaneo ni sustituyen sus resultados. Tampoco son CI de GitHub:
las comprobaciones formales se ejecutaran sobre la rama release y su integracion.

Se pasa a preparar release y revisar el disparador: el orden solicitado es
release, integracion en main y generacion automatica de AAB y tag. El workflow
actual usa tag como entrada y debe ajustarse antes de utilizar ese orden.
No se declara creado ni publicado un AAB, tag o Release mediante este cierre.

Instalacion, smoke y validacion del binario Release se registraran cuando ese
artefacto exista. Este cierre de desarrollo no acredita TLS ni red movil de
produccion, todos los modulos o aprobacion de Google Play. Las veinte pruebas
funcionales anteriores conservan su confirmacion del operador en su propio
[registro](cierre-cp01-cp20.md).
