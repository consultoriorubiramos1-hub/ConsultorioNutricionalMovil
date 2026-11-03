# Preparacion de aceptacion y carga

Fecha: 2 de noviembre de 2026. Base de documentacion movil:
`84f06a6e162d8c512a9d16a3742c88c5452d2920`.

Se adaptaron los escenarios pendientes al alcance actual, sin Citas, en
`docs/qa-antes-release.md`. Se agrego un diagnostico de requisitos para el
emulador y el backend local ya preparado. Docker es el entorno de API elegido,
no un requisito de Google Play o de Appium. JMeter no requiere un emulador.

Validacion de preparacion ejecutada en el workspace con Node 24.22.1:

| Comprobacion | Resultado |
|---|---|
| `node --test tests/tooling/acceptance-preflight.test.cjs` | 8 aprobadas, 0 fallidas |
| `npm run lint` | Aprobado |
| `npm run typecheck` | Aprobado |
| `npm run verify:config` | Aprobado |
| Sintaxis Node y `git diff --check` | Aprobados |

Las ocho pruebas usan dobles de respuesta HTTP y entradas sinteticas. Cubren
version de Node, reconocimiento de Java, seleccion no ambigua de emulador,
destino loopback fijo, ausencia de credenciales, rechazo de redirecciones y
respuestas no validas. No se presentan como aceptacion Android ejecutada.

El diagnostico exige Node 22.13 o posterior de la serie 22, conforme al proyecto.
En el equipo del operador se habia registrado Node 22.13.0. No se ejecuto el
diagnostico contra su equipo ni se inspecciono su configuracion privada.

Estado: PA01 Appium, REN01 JMeter y EST01 JMeter siguen sin ejecucion registrada.
No se modifico la app, su backend, las cuentas, el workflow, el tag ni la
distribucion. Los 648 casos del inventario anterior conservan la fecha y el
alcance de ese corte; las ocho comprobaciones de esta preparacion son nuevas.
