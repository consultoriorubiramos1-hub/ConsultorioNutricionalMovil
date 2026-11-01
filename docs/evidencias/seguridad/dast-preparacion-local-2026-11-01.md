# Preparación del entorno local para DAST

Fecha: 2026-11-01. Base del repositorio móvil: `fc41820ac17ac1e858ddc89782d8efe44e0b1359`.

## Alcance realizado

- Se revisaron las rutas reales de autenticación y recuperación del backend Next.js/PostgreSQL y sus contratos con el cliente móvil.
- Los respaldos antiguos conservados en el repositorio web contienen un esquema parcial; no se utilizaron para poblar la base de pruebas ni se conservaron sus archivos de filas.
- Se preparó un exportador PowerShell con entrada oculta y `pg_dump --schema-only`, sin propietarios, ACL ni comentarios. La conexión de origen se utiliza únicamente para leer estructura; la API de pruebas no recibe esa conexión.
- Se añadió Docker Compose con PostgreSQL temporal, API limitada a localhost, red interna, claves independientes, healthchecks y exclusión de los `.env` y respaldos del contexto de build.
- Se prepararon cuatro cuentas sintéticas de autenticación y una comprobación HTTP previa al scanner. Estos comandos todavía no se ejecutaron contra la API en Docker.
- El esquema exportado, las claves locales y los metadatos de preparación quedan excluidos de Git en `tools/dast/.local/`.

## Comprobaciones ejecutadas en la preparación

| Comprobación | Resultado |
|---|---|
| Sintaxis Node de los tres scripts `.cjs` | Aprobada con Node 22.13.0 |
| Análisis del YAML con el parser del proyecto | Aprobado |
| Revisión de puertos, red interna y conexión exclusiva a `db/cnm_dast` | Aprobada sobre la configuración |
| Preparador sin esquema | Rechazo esperado |
| Preparador con fixture de estructura y checkout temporal | Configuración creada |
| Exclusión de variables centinela de un `.env.local` del checkout temporal | Aprobada; no se copiaron |
| Segunda preparación con claves existentes | Rechazo esperado; archivo conservado |
| SQL de fixture con `COPY ... FROM stdin` | Rechazo esperado |
| `git check-ignore` para esquema, claves y metadatos locales | Aprobado |
| `npm run lint`, `npm run typecheck`, `npm run verify:config`, `git diff --check` | Aprobados |

Las comprobaciones del preparador utilizaron archivos sintéticos en un directorio temporal; no se presentan como resultados de la API real. Las 499 pruebas automatizadas documentadas en la corrección anterior no se vuelven a contabilizar como nuevas pruebas DAST.

## Pendiente de ejecución

El ejecutor de esta revisión no dispone de Docker. No se construyeron ni arrancaron contenedores, no se ejecutó el script PowerShell en Windows, no se conectó a Neon y no se ejecutó un scanner DAST. La validación del YAML no sustituye `docker compose config` ni el arranque real.

En el equipo de pruebas falta comprobar Docker Desktop, exportar la estructura vigente, preparar la configuración con la ruta real del backend, arrancar los servicios y ejecutar el sembrado y la comprobación HTTP. Si el esquema actual no coincide con los campos revisados, se debe corregir esa compatibilidad antes de escanear.

El envío de correo, los fixtures del resto de módulos, el scanner y su integración en CI siguen pendientes. No se acredita pinning, TLS nativo, pruebas de dispositivo, autorización completa del backend ni cumplimiento completo del instrumento de evaluación.

Guía de ejecución: [dast-local.md](../../dast-local.md).

No se generaron AAB, tags ni despliegues; se conserva el disparador automático de liberación.
