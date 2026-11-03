# Verificacion HTTP local de autenticacion

Fecha y hora: 2026-11-01, 16:54:49 en Ciudad de Mexico (22:54:49 UTC).

Esta evidencia transcribe la salida que proporciono el operador desde Windows PowerShell. El operador confirmo Docker Engine 29.1.3 con motor Linux, Docker Compose v5.0.1 y los servicios `cnm-dast-local-api-1` y `cnm-dast-local-db-1` saludables. El preparador habia registrado el checkout web local limpio y creado claves independientes. El commit exacto de ese checkout y el hash de su estructura permanecen en el archivo local `source.json`, aun no adjuntado a esta evidencia.

El operador ejecuto el sembrado de cuatro cuentas sinteticas y despues `dast-tools/check-auth.cjs` contra la API local. Los ocho controles devolvieron `passed: true`: sesion sin token, token invalido, JSON mal formado, cuenta inactiva, rol distinto de paciente, login valido, sesion con token emitido por la API e identidad sintetica.

Salida conservada: [auth-http-smoke-2026-11-01.json](auth-http-smoke-2026-11-01.json).

El resultado demuestra esos ocho comportamientos observados por HTTP en ese entorno. No es una certificacion de todos los endpoints o de las politicas JWT; el propio reporte indica `scannerExecuted: false`. No se contabiliza como un escaneo ZAP ni como ejecucion de los casos Debug/Release del plan.

## Preparacion del scanner posterior

Se agrego un servicio ZAP 2.17.0 en el perfil `scan` de la misma red interna. Su OpenAPI y contexto se limitan a login y consulta de sesion, con cuenta sintetica y sin parametro de destino externo. El ejecutor conserva reportes HTML/JSON completos localmente y genera un resumen con conteos y hashes. Riesgo alto o fallo de ejecucion no produce un resultado aprobado.

El plan y el wrapper fueron ejecutados con el binario oficial ZAP 2.17.0 contra un servidor sintetico independiente: 607 solicitudes HTTP, autenticacion observada y generacion de ambos reportes. El SHA-256 del paquete Linux utilizado fue `efe799aaa3627db683b43f00c9c210aea0b75c00cc8f0a0f0434d12bb3ddde5a`, verificado contra la publicacion oficial. Ese ensayo valida el ejecutor y no sus resultados sobre la API del consultorio.

La preparacion tambien paso lint, TypeScript, verificacion de configuracion, sintaxis Python/Node y la suite heredada de 74 pruebas Node. Esa suite incluye una invocacion a seis pruebas Python del resumen, para comprobar clasificacion de riesgos, rechazo de reportes vacios o de otro sitio y exclusion de payloads sensibles. Estas regresiones no se contabilizan como ejecuciones adicionales de los ocho casos HTTP del operador.

Pendiente: ejecutar ZAP contra la API Docker del operador, revisar hallazgos, ampliar alcance y configurar el workflow CI/CD. No se generaron AAB, tags o despliegues.
