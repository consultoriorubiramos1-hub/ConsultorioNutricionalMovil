# Integración real App–API–BD

## Alcance y endpoints existentes

El repositorio contiene el cliente móvil. Las rutas se obtuvieron de sus servicios, sin inventar endpoints del backend:

| Caso | Rutas |
|---|---|
| PI-01 | POST /api/mobile/auth/login |
| PI-02 | GET /api/mobile/citas/disponibilidad?date=YYYY-MM-DD, POST /api/mobile/citas multipart, GET /api/mobile/citas, PATCH /api/mobile/citas/:id/cancelar |

Jest integra servicios/adapters con fetch simulado; no comprueba HTTP ni BD. La suite real carga los servicios/adapters TS de src y utiliza fetch real. Solo Platform.OS=web se sustituye para enviar Blob/FormData desde Node; no simula respuestas HTTP ni certifica transporte nativo Android.

## Backend externo pendiente

Identificar el repositorio Express real y provisionar API/BD exclusivamente de pruebas, con migraciones y schema reales. No usar producción, pacientes reales ni una copia con datos médicos.

CI descarga ese backend en .test-backend usando TEST_BACKEND_REPOSITORY y **TEST_BACKEND_REF, SHA completo de 40 caracteres revisado**. El deploy de pruebas debe corresponder a ese commit. Instala mediante su propio npm ci y carga TEST_BACKEND_DRIVER, ruta .cjs dentro del checkout. No se crearon fuentes ficticias del backend en esta app.

Para ejecución local, obtener el checkout real en .test-backend, instalar con `npm ci --prefix .test-backend` y completar .env.test.local desde .env.test.example. Solo después de preparar/revisar el driver:

```bash
node --env-file=.env.test.local scripts/run-node-tests.cjs live
```

## Contrato obligatorio del driver

El backend debe implementar estas funciones en su propio repositorio. No se incluye una implementación que devuelva éxito constante.

### prepare({ runId, apiUrl })

**Antes de escribir**, verificar TEST_DATABASE_URL, origen API y aislamiento real de base/branch/schema. TEST_DATABASE_ALLOWED_HOST rechaza otro host; es un control adicional y no demuestra por sí solo que la BD sea de pruebas. El backend debe verificar su identidad contra producción antes de sembrar datos.

Provisionar un paciente sintético, credenciales, disponibilidad futura y PNG de comprobante válido. Asociar cuentas, citas, pagos y archivos a runId para poder limpiar una preparación parcial o un POST cuya respuesta se pierda. Devolver:

```ts
{
  isolation: { kind: "test", apiUrl: string, databaseId: string },
  credentials: { username: string, password: string },
  appointmentDate: string, // YYYY-MM-DD futuro con disponibilidad
  receiptPath: string     // PNG sintético válido, sin datos personales
}
```

databaseId identifica BD/branch/schema sin secretos; nunca colocar el connection string allí. No imprimir credenciales ni datos del fixture en logs.

### readAppointment({ appointmentId, runId, fixture })

Consultar **directamente PostgreSQL**, con schema real y parámetros SQL. Verificar pertenencia al fixture/runId. Devolver valores persistidos normalizados:

```ts
{ appointmentId: number, appointmentDate: string, startTime: string, notes: string }
```

No reutilizar respuestas HTTP, valores de entrada ni un mapa en memoria. El GET del cliente no sustituye la lectura directa de BD. La suite compara ID, fecha, horario y marcador runId.

### cleanup({ runId, fixture, apiUrl })

Ser idempotente, admitir fixture indefinido y eliminar **únicamente** los datos de ese runId, incluidos archivos/comprobantes y filas relacionadas. No hacer truncates globales ni tocar registros médicos ajenos. La suite cancela la cita conocida con el endpoint existente; cancelar no sustituye eliminar fixtures.

Después, consultar filas/almacenamiento y devolver conteos reales:

```ts
{ remainingFixtureRecords: 0, remainingReceiptFiles: 0 }
```

Si quedan datos o falla la limpieza, lanzar error o devolver conteos distintos de cero: CI falla. Configurar timeouts de conexión y consultas. Una cancelación abrupta del runner puede impedir hooks; el backend requiere recolección de fixtures caducados por runId exclusivamente en el entorno aislado.

## Variables y autorizaciones

Completar las variables/Secrets del README. PRODUCTION_API_URL se usa solo para rechazar coincidencia de origen; no se contacta aquí. Se rechazan redirects, URLs con credenciales/query/fragmento y HTTP fuera de localhost. No existe fallback al .env.local o a producción.

El token del backend debe ser solo de lectura; TEST_DATABASE_URL se entrega al paso de pruebas, no al de instalación. Revisar código del PR y SHA del backend antes de autorizar integration-test. No usar pull_request_target con código no confiable y Secrets.

Los jobs reales se serializan. Falta de configuración, driver, disponibilidad, autenticación, consulta, lectura de BD o limpieza produce error. ci-required rechaza también omisiones/cancelaciones. **PI-01/PI-02 están preparadas pero no se ejecutaron contra Render/Neon.**
