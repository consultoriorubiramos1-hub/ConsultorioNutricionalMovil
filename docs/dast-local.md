# Preparación local para DAST

Esta configuración prepara la API real con PostgreSQL temporal, claves nuevas y cuentas sintéticas. Es una preparación del entorno: no constituye un escaneo DAST ejecutado ni una validación Debug/Release de la app.

## Requisitos

- Docker Desktop funcionando con contenedores Linux y Docker Compose v2.
- Node 22 y una copia local limpia del repositorio web que contiene la API Next.js/PostgreSQL.
- Una exportación actual de la estructura de la base, sin filas. Los respaldos antiguos del repositorio no acreditan el esquema completo actual.

Los comandos siguientes se ejecutan desde la carpeta del repositorio móvil en PowerShell. No se necesita EAS ni compilar el AAB.

### 1. Comprobar Docker

```powershell
docker --version
docker compose version
docker version --format '{{.Server.Version}}'
```

### 2. Obtener exclusivamente la estructura actual

```powershell
powershell -NoProfile -File .\tools\dast\export-schema.ps1
```

El script pide la conexión PostgreSQL con entrada oculta. No la pegues en el chat. Solo este comando conecta a la base de origen para ejecutar `pg_dump --schema-only`; no importa registros ni ejecuta DAST contra ese servidor. Necesita una conexión que permita leer el esquema y una versión de pg_dump compatible con el servidor. Usa PostgreSQL 18; si el servidor es más reciente, detén esta preparación y revisa la versión.

El SQL se escribe directamente desde el contenedor, evitando conversiones de codificación de PowerShell. Queda en `tools/dast/.local/schema.sql`, fuera de Git. No se modifica ni sobrescribe un esquema ya existente.

La URI se transmite mediante una variable temporal y el wrapper `export-schema.sh` la pasa explícitamente a `pg_dump --dbname` dentro del contenedor. Si falta, el wrapper falla antes de intentar una conexión por defecto. El `.ps1` utiliza UTF-8 con BOM para Windows PowerShell 5.1; `.gitattributes` conserva LF en el wrapper Linux.

### 3. Preparar la configuración

Reemplaza la ruta del ejemplo por la carpeta local de tu repositorio web:

```powershell
node .\tools\dast\prepare-local.cjs '..\RubiRamos'
```

El preparador registra el commit local del backend y el hash de la estructura; genera claves independientes y nunca carga sus archivos `.env`. Una configuración existente se conserva y no se regenera automáticamente.

### 4. Arrancar API y base temporal

```powershell
docker compose --env-file tools/dast/.local/config.env -f tools/dast/compose.yml up --build -d --wait
docker compose --env-file tools/dast/.local/config.env -f tools/dast/compose.yml ps
```

La API utiliza el código y lockfile del checkout web, en modo desarrollo. Solo se copian al build los archivos necesarios para sus rutas; no se copian `.env`, respaldos, credenciales ni el historial Git. PostgreSQL no publica puertos. La API publica `http://127.0.0.1:3300` exclusivamente en el equipo local.

La red de ejecución es interna: no hay salida hacia Neon, Gmail, Cloudinary u otros proveedores. La descarga de imágenes y la instalación de dependencias durante el build sí requieren Internet. El correo no está habilitado en este primer entorno: el flujo de recuperación con envío real o buzón de pruebas continúa pendiente.

### 5. Crear cuentas sintéticas y comprobar HTTP real

```powershell
docker compose --env-file tools/dast/.local/config.env -f tools/dast/compose.yml exec -T api node dast-tools/seed-auth.cjs
docker compose --env-file tools/dast/.local/config.env -f tools/dast/compose.yml exec -T api node dast-tools/check-auth.cjs
```

El sembrado comprueba la base `cnm_dast`, su marca de aislamiento y la ausencia de cuentas ajenas a los fixtures. Solo crea dos pacientes de autenticación, una cuenta de otro rol y otra inactiva. Usa los nombres de tablas y columnas del backend revisado; si el esquema actual no es compatible, falla y debe revisarse antes de continuar. No siembra datos clínicos ni confirma que el resto de módulos tenga sus fixtures completos.

La comprobación HTTP prueba rechazo sin token, token inválido, JSON mal formado, cuenta inactiva, rol incorrecto, login sintético e identidad de sesión. No escribe contraseñas ni tokens en el reporte. Es una comprobación previa al scanner, no un informe de ZAP/MobSF ni evidencia de seguridad completa.

### 6. Ejecutar el scanner ZAP local

Con API y base saludables, ejecuta desde la carpeta del movil:

```powershell
node .\tools\dast\run-zap.cjs
```

El comando reutiliza los servicios actuales. Repite los ocho controles HTTP como condicion previa y arranca solo el servicio `zap` del perfil `scan`, con ZAP 2.17.0. La primera ejecucion puede descargar su imagen. No recrea API o base, no vuelve a exportar Neon y no admite una URL externa como argumento.

El alcance inicial es `POST /api/mobile/auth/login` y `GET /api/mobile/auth/me`, definidos desde las rutas reales en `tools/dast/zap/auth.openapi.yml`. Usa la cuenta sintetica para obtener un Bearer temporal dentro del scanner; no se copia el secreto de firma de la API. La red sigue siendo interna. No se ejecuta spider ni se incluyen recuperacion, envios de correo o modificaciones de perfiles.

El plan de Automation Framework ejecuta importacion OpenAPI, verificacion de sesion, scanner activo y espera pasiva, y genera HTML y JSON. La fase activa se limita a cinco minutos, con dos hilos; el ejecutor limita el proceso completo a once minutos. No acredita una revision exhaustiva ni pruebas sobre todos los modulos.

Cada ejecucion tiene una carpeta nueva en `tools/dast/.local/reports/`. Incluye `auth-smoke.json`, `source.json`, `zap-console.log`, `zap-auth.json`, `zap-auth.html` y, si el proceso termino correctamente, `summary.json`. Los archivos completos quedan fuera de Git. Para compartir resultados utiliza `summary.json`: conserva conteos, identificadores de reglas, alcance, versiones y hashes sin copiar payloads, consultas, tokens ni cabeceras de autenticacion del reporte.

| Salida del ejecutor | Interpretacion |
|---|---|
| 0 | El scanner termino y no reporto riesgo alto en este alcance; los demas hallazgos requieren revision |
| 1 | Hay hallazgos altos; la compuerta de riesgo no pasa |
| 3 | Fallo de entorno, autenticacion, scanner, tiempo o reporte; no se acredita un escaneo terminado |

El commit del backend se toma de los metadatos registrados durante la preparacion. La ejecucion tambien registra commit movil, imagen del scanner y hashes del plan y del reporte. Esto permite identificar los insumos; no constituye una atestacion del contenido de la imagen de la API.

### 7. Detener

```powershell
docker compose --env-file tools/dast/.local/config.env -f tools/dast/compose.yml down
```

La base vive en memoria y pierde sus fixtures al detenerse. Al arrancar nuevamente se restaura solo la estructura; repite el sembrado. El código y las bases externas no se modifican.

## Estado de validación

Preparacion creada el 2026-11-01. El operador confirmo ambos contenedores saludables, cuatro cuentas sinteticas y ocho controles HTTP aprobados a las 16:54:49 de Ciudad de Mexico. La evidencia esta en `docs/evidencias/seguridad/auth-http-smoke-2026-11-01.json`; su campo `scannerExecuted` es `false`.

El plan de ZAP y su ejecutor se validaron por separado con ZAP 2.17.0 real y un servidor sintetico local. Esa verificacion no se presenta como un resultado sobre el backend del consultorio. Falta ejecutar el scanner en el entorno Docker del operador y revisar sus hallazgos.

El flujo local de ZAP ya es repetible mediante un comando. Los fixtures de otros modulos y su integracion como workflow CI/CD siguen pendientes; no se considera completado el requisito del pipeline DAST. El AAB conserva su disparador automatico acordado.

## Referencias

- [PostgreSQL: pg_dump](https://www.postgresql.org/docs/18/app-pgdump.html).
- [Docker: redes internas de Compose](https://docs.docker.com/reference/compose-file/networks/).
- [Docker: orden de arranque y healthchecks](https://docs.docker.com/compose/how-tos/startup-order/).
- [Imagen oficial PostgreSQL](https://hub.docker.com/_/postgres).
- [ZAP: Automation Framework](https://www.zaproxy.org/docs/desktop/addons/automation-framework/).
- [ZAP: variables de autenticacion](https://www.zaproxy.org/docs/desktop/start/features/authentication/).
