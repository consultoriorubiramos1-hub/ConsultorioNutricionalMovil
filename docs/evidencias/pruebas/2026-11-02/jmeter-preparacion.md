# REN01 y EST01: ejecutor JMeter preparado

Fecha local de preparacion: 2 de noviembre de 2026, Ciudad de Mexico.
[Guia y criterios previos](../../../jmeter-local.md).

Se preparo JMeter 5.6.3 con ZIP oficial verificado por SHA-512. El instalador
Windows no instala paquetes globales y reutiliza Java. El ejecutor Node exige
checkout limpio, entorno local, cuentas y perfiles ficticios, y autenticacion
previa. La carga contiene solo lecturas de sesion y Perfil por loopback.

Se fijaron cinco etapas: 1/30 s, 5/60 s, 10/45 s, 20/45 s y recuperacion 1/30 s.
Las metas locales y la detencion del aumento de carga se documentaron antes de
la ejecucion en el entorno del operador. No son SLA de produccion. Los CSV no
incluyen cuerpos, cabeceras ni secretos; el token se transmite al hijo Java por
entorno, no por argumentos o archivos. No se crean registros clinicos ni correos.

## Validacion del ejecutor y del plan

Workspace Linux, Node 24.22.1 y OpenJDK 17.0.20. Los controles de codigo pasaron:

| Control | Resultado |
|---|---|
| Nuevos tests de herramientas JMeter | 12/12 aprobados |
| Suite heredada y herramientas completa | 123/123 aprobados |
| Lint movil | Aprobado |
| TypeScript | Aprobado |
| Sintaxis Node, XML y git diff --check | Aprobados |

Los doce nuevos tests verifican parsing de resultados, percentiles, errores,
limites, criterios por ruta, API fija, identidad ficticia y ausencia de secretos
en argumentos. Las suites Jest del producto no se vuelven a contar por esta
preparacion, que no modifica componentes de la app.

Se ejecuto ademas **el motor real de JMeter 5.6.3** con el JMX preparado contra un
servidor HTTP simulado, local y temporal. Se redujo a doce segundos por escenario
para validar el plan; esos parametros no son los del recorrido REN01/EST01.

| Respuesta del servidor simulado | Muestras | Errores observados |
|---|---:|---:|
| Identidad A correcta en ambas rutas | 10 | 0 |
| Identidad B solo en Perfil, HTTP 200 | 10 | 5, todas de Perfil |
| HTTP 302 con Location hacia una ruta canario | 10 | 10; cero visitas a la ruta canario |

En los tres escenarios se verificaron los ocho campos esperados del CSV y la
ausencia del token sintetico. El analizador del ejecutor pudo leer las muestras
reales de JMeter. Durante esta validacion se corrigio la configuracion vacia de
sample_variables para evitar que JMeter escribiera una columna adicional.

**Esto valida la herramienta, no el rendimiento del backend Docker.** No se
presentan tiempos simulados como metricas de la app ni se declara REN01 o EST01
aprobado. Los resultados reales se incorporaran cuando el operador comparta
summary.json. La ejecucion completa en Windows sigue pendiente; el instalador
PowerShell aun no se ha ejecutado en el equipo del operador.
