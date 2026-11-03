# JMeter: correccion del plan para Java 22

Fecha local: 2 de noviembre de 2026, Ciudad de Mexico. Evidencia del operador:
resumen de las 2026-11-03T01:10:35.292Z, commit movil
`e414b1083659e582f6b581bed02e7d159f09f52f`.

La preparacion de la cuenta ficticia y del token ya paso. La etapa REN01-base
finalizo sin muestras: `performanceExecuted: false`, `passed: false`,
`stages: []`, `failedAt: REN01-base`, `errorCode: results-empty`.
El resumen conserva el backend declarado
`367c4bbfb595d7b8765c017a37d9ff7c78113400`, JMeter 5.6.3 y Java 22.
No se interpreta como rendimiento aprobado ni como fallo demostrado de la API.

## Reproduccion y causa

Se descargo Eclipse Temurin OpenJDK 22.0.2+9 de Adoptium y se verifico su
SHA-256 publicado. Con el ZIP oficial de JMeter 5.6.3 ya verificado, se ejecuto
el JMX anterior contra un servidor HTTP simulado local. Se reprodujeron cero
muestras y `Unsupported class file major version 66` al compilar Groovy.
El motor sale con codigo cero aunque el hilo no consiga ejecutar consultas.
Esto explica por que verificar solo version y codigo de salida no bastaba.

La distribucion contiene Groovy 3.0.20. El plan anterior lo usaba para obtener
el token y comprobar JSON. No se solicitan claves ni logs privados del operador
para este diagnostico. La reproduccion usa un token sintetico sin validez real.

## Correccion

- El token se obtiene una vez al preparar las variables del plan mediante la
  funcion BeanShell de JMeter y se reutiliza como variable. No se escribe en
  archivos ni argumentos ni se reevalua un script por cada consulta.
- Las comprobaciones HTTP y de identidad se realizan con ResponseAssertion y
  JSON JMESPath nativos, sin compilacion Groovy.
- Se conservan HTTP 200, JSON ok true, identidad A, rol paciente, apellidos,
  correo ficticio y ausencia de campos privados. Las expresiones comparan tipos
  y valores para no aceptar listas donde el contrato exige un dato escalar.
- Si una ruta no genera muestras, el ejecutor agrega incompleteStage con los
  conteos por ruta y conserva el fallo. No inventa tiempos ni percentiles.

No cambian cuentas, destino, concurrencia, pausas, duraciones ni criterios.
No se requiere reinstalar JMeter ni cambiar el Java del operador para probar
este plan corregido.

## Validacion real de la herramienta

Workspace Linux, JMeter 5.6.3 y Temurin 22.0.2+9; tambien se verifico el caso
valido con OpenJDK 17.0.20. Servidor HTTP simulado, no backend Docker del operador.

| Escenario | Java | Muestras | Errores esperados y observados |
|---|---|---:|---:|
| original-groovy | 22.0.2 | 0 | 0 |
| valid-22 | 22.0.2 | 3 | 0 |
| valid-17 | 17.0.20 | 3 | 0 |
| wrong-profile | 22.0.2 | 3 | 1 |
| wrong-role | 22.0.2 | 3 | 2 |
| username-array | 22.0.2 | 3 | 3 |
| email-array | 22.0.2 | 3 | 1 |
| private-null | 22.0.2 | 3 | 1 |
| redirect | 22.0.2 | 3 | 3 |
| http201 | 22.0.2 | 3 | 3 |
| not-json | 22.0.2 | 3 | 3 |
| ok-false | 22.0.2 | 3 | 3 |
| baseline-30s | 22.0.2 | 29 | 0 |
| concurrency-20 | 22.0.2 | 140 | 0 |

El caso original-groovy reproduce la averia: cero muestras no equivale a cero
fallos. Los casos de respuestas incorrectas deben producir errores; todos
coincidieron con la ruta y resultado esperados. No hubo visitas a la ruta
canario de redireccion ni cabeceras de autenticacion incorrectas. Ningun CSV
incluyo el token y todos conservaron exactamente los ocho campos permitidos.

La etapa simulada de treinta segundos produjo 15 consultas de sesion y 14 de
Perfil; el analizador real del ejecutor pudo leerlas y aplicar los criterios
previamente fijados. El caso concurrente uso veinte hilos durante ocho segundos.
Los demas controles fueron breves para comprobar contratos, no capacidad.

Validacion de codigo: 16/16 tests del ejecutor, 127/127 de la suite heredada y
herramientas, lint, TypeScript, sintaxis Node, XML y git diff --check aprobados.
Las suites del producto no se vuelven a contar por esta correccion de herramientas.

El recorrido completo REN01/EST01 en Windows sigue pendiente del nuevo resumen
del operador. Los resultados simulados anteriores no son metricas de la app.

Fuentes primarias:
[incidencia Apache sobre Groovy y Java 22](https://github.com/apache/jmeter/issues/6114),
[funciones y variables de JMeter](https://jmeter.apache.org/usermanual/functions.html),
[asercion JMESPath de JMeter 5.6.3](https://github.com/apache/jmeter/blob/rel/v5.6.3/src/components/src/main/java/org/apache/jmeter/assertions/jmespath/JMESPathAssertion.java).
