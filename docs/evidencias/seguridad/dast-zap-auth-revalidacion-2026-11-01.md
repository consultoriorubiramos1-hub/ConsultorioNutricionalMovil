# DAST de autenticacion: revalidacion local

Ejecucion del operador: 2026-11-01 a las 20:14:37 en Ciudad de Mexico; 2026-11-02T02:14:37 UTC.

Se conserva el resumen y la salida de cabeceras compartidos por el operador en Windows. No se recibieron los reportes brutos; sus hashes son los declarados por el ejecutor, sin verificacion independiente de esos archivos.

- [Resumen ZAP](dast-zap-auth-revalidacion-2026-11-01.json).
- [Cuatro comprobaciones de cabeceras](dast-cabeceras-revalidacion-2026-11-01.json).
- [Primera ejecucion conservada](dast-zap-auth-inicial-2026-11-01.md).

## Resultado y trazabilidad

| Dato | Primera ejecucion | Revalidacion |
|---|---|---|
| Backend | da349c00641cb9e4599f8089d3db1db56c281ec3 | b546782418a51f71637ad0cb8e1ad0951d24a883 |
| Altos / medios / bajos | 0 / 0 / 1 | 0 / 0 / 0 |
| Informativos | 1 | 2 |
| Scanner | OWASP ZAP 2.17.0 | OWASP ZAP 2.17.0 |
| Salida del scanner | 0 | 0 |

Ambas ejecuciones usan las mismas dos rutas, esquema e identificador de imagen ZAP y el mismo hash del plan. La API fue reconstruida desde la rama del backend `feature/cabeceras-api-movil`. La salida confirma servicio saludable, cuatro comprobaciones HTTP de cabeceras aprobadas y ocho comprobaciones previas de autenticacion aprobadas. El actualizador conserva base y claves locales.

**10021, cabecera ausente: corregido y revalidado en el entorno local.** Las respuestas 401, 400 y 405 incluyen `X-Content-Type-Options: nosniff`; el nuevo scanner ya no reporta esta alerta. El cierre se limita al commit y entorno indicados. No acredita una correccion desplegada en produccion.

**10111, Authentication Request Identified: informativo.** ZAP identifico una solicitud de autenticacion. Su documentacion clasifica esta deteccion como informacion, sin correccion de vulnerabilidad requerida.

**10104, User Agent Fuzzer: revision contextual pendiente.** Tres instancias, como en la primera ejecucion. El resumen no incluye los intercambios HTTP necesarios para explicar las diferencias de respuesta. No se declara explotacion ni falso positivo; la regla permanece activa.

## Hallazgo separado: dependencias del backend

Durante `npm ci`, la imagen del backend informo 24 hallazgos de dependencias: cuatro bajos, cinco moderados, doce altos y tres criticos. Es una auditoria SCA distinta del resultado DAST y distinta de la auditoria del proyecto movil. La revision aislada del lockfile reprodujo estos totales; al omitir desarrollo resultaron 16: cuatro bajos, tres moderados, siete altos y dos criticos.

Este documento no cierra esos hallazgos. La propuesta de actualizacion, sus reportes y validaciones se revisan en el repositorio privado del backend.

Actualizacion posterior: la [ejecucion de las 20:59 con dependencias actualizadas](dast-zap-auth-dependencias-2026-11-01.md) confirma instalacion y controles locales satisfactorios, 0 criticos y 3 altos SCA restantes, y ZAP con 0 altos, medios y bajos. Se conserva este documento como evidencia anterior.

## Limites y pendientes

El scanner cubrio exclusivamente `POST /api/mobile/auth/login` y `GET /api/mobile/auth/me` en HTTP local, modo desarrollo, cuentas sinteticas y fase activa limitada a cinco minutos. No prueba todos los modulos, TLS nativo, pinning, OAST externo ni dispositivos. La integracion DAST en CI/CD y los pendientes SCA/SAST siguen abiertos.

La base de pruebas se conserva aislada en Docker; Neon no fue objetivo del scanner. Esta revalidacion no genero AAB, tags ni despliegues.

Referencias:

- [ZAP 10021](https://www.zaproxy.org/docs/alerts/10021/).
- [ZAP 10111](https://www.zaproxy.org/docs/alerts/10111/).
- [ZAP 10104](https://www.zaproxy.org/docs/alerts/10104/).
