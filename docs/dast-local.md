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

### 6. Detener

```powershell
docker compose --env-file tools/dast/.local/config.env -f tools/dast/compose.yml down
```

La base vive en memoria y pierde sus fixtures al detenerse. Al arrancar nuevamente se restaura solo la estructura; repite el sembrado. El código y las bases externas no se modifican.

## Estado de validación

Preparación creada el 2026-11-01. Se revisaron las rutas y contratos de autenticación del backend; el entorno Docker y los dos comandos dentro de la API todavía deben ejecutarse en el equipo de pruebas. No se presenta un resultado DAST aprobado.

Después de comprobar este entorno se podrá definir el alcance del scanner, agregar los fixtures restantes y automatizar su ejecución en CI. El AAB conserva su disparador automático acordado.

## Referencias

- [PostgreSQL: pg_dump](https://www.postgresql.org/docs/18/app-pgdump.html).
- [Docker: redes internas de Compose](https://docs.docker.com/reference/compose-file/networks/).
- [Docker: orden de arranque y healthchecks](https://docs.docker.com/compose/how-tos/startup-order/).
- [Imagen oficial PostgreSQL](https://hub.docker.com/_/postgres).
