# DAST local tras actualizar dependencias del backend

Ejecucion del operador: 2026-11-01, 20:59:04 de Ciudad de Mexico; 2026-11-02T02:59:04 UTC.

El operador compartio la salida de PowerShell de la reconstruccion y del scanner. Se conserva el resumen recibido y los controles agregados; no se recibieron los archivos brutos ni se verifico independientemente su hash.

- [Resumen ZAP](dast-zap-auth-dependencias-2026-11-01.json).
- [Reconstruccion, auditoria y comprobaciones](dast-validacion-dependencias-2026-11-01.json).

## Resultado

| Comprobacion | Resultado compartido |
|---|---|
| API reconstruida | Servicio saludable |
| Cabeceras HTTP | 4/4; respuestas 401, 400 y 405 con nosniff |
| Autenticacion previa | 8/8; solo se recibio el conteo agregado |
| ZAP | Ejecutado; salida 0 |
| Altos / medios / bajos de ZAP | 0 / 0 / 0 |
| Informativos de ZAP | 2 |
| Compuerta de riesgo alto | Aprobada para este alcance |
| Auditoria npm completa en la imagen | 21: 4 bajos, 14 moderados, 3 altos, 0 criticos |

Backend escaneado: `cf48d07d0c0042608f3a9b3f776c371f27fa7241`, rama `feature/seguridad-dependencias-web`. Ejecutor movil: `e2b4db45aeaf7e888544a115955fc653f09f3fa5`. El resumen conserva hashes de esquema, plan, imagen ZAP y reporte bruto.

El nuevo lockfile pudo instalarse con npm ci y superar las comprobaciones locales de cabeceras, autenticacion y scanner. Se utilizo el actualizador exclusivo de API que conserva base y claves locales. Es evidencia de regresion satisfactoria en los controles ejecutados; no acredita todos los flujos del backend.

## Comparacion conservando las ejecuciones anteriores

| Ejecucion | Backend | Criticos / altos SCA completos | Altos / medios / bajos ZAP |
|---|---|---|---|
| Antes de actualizar dependencias | b546782 | 3 / 12 | 0 / 0 / 0 |
| Con dependencias actualizadas | cf48d07 | 0 / 3 | 0 / 0 / 0 |

La auditoria SCA considera dependencias; el DAST considera respuestas de las rutas HTTP escaneadas. La compuerta aprobada del scanner no cierra los hallazgos de dependencias. El resumen npm de esta reconstruccion incluye desarrollo; no se ejecuto ni se recibio una nueva auditoria omit=dev como parte de esta salida.

## Estado de alertas y limites

- 10021, cabecera ausente: no reaparece. Se conserva la correccion local previamente revalidada.
- 10111, Authentication Request Identified: una instancia informativa; se mantiene la clasificacion registrada.
- 10104, User Agent Fuzzer: tres instancias informativas. Continuan pendientes los intercambios HTTP del reporte local para la revision contextual; no se declara falso positivo ni explotacion.

El alcance sigue limitado a POST /api/mobile/auth/login y GET /api/mobile/auth/me, en modo desarrollo y HTTP local, con cuentas sinteticas y fase activa acotada a cinco minutos. El resto de modulos, CI/CD DAST, TLS nativo, pinning, OAST externo, pruebas en dispositivo y pendientes SCA/SAST conservan su seguimiento separado.

La evidencia no acredita una correccion desplegada en produccion ni un cierre general de seguridad. Neon no fue objetivo del scanner. El AAB movil mantiene su disparador automatico.
