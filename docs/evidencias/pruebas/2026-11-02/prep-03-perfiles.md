# PREP-03: preparacion de perfiles ficticios

Fecha de registro: 2 de noviembre de 2026. **Estado: preparacion de perfiles
aprobada en el alcance HTTP local; 5/5 comprobaciones reales del operador.**

## Diagnostico recibido

El operador consulto metadatos de `public.tblpatients` en el servicio `db` local.
Se confirmaron las columnas de perfil, incluida `fecha_nacimiento`, `estado_civil`
y `ocupacion`, y la relacion de `user_id` con `tblusers`. La inspeccion de presencia
de variables dentro de `api` devolvio `DATABASE_URL_configurada: true` y
`POSTGRES_URL_configurada: false`. No se compartieron valores de conexion.

El sembrado anterior solo creo usuarios y roles, sin pacientes. Ademas, los cuatro
servicios heredados requieren `POSTGRES_URL` con TLS, incompatible con la
configuracion anterior del PostgreSQL local. La preparacion nueva aborda ambas
condiciones; el resultado real de los endpoints se recibio y se registra abajo.

## Cambios preparados

Backend preparado: commit `367c4bbfb595d7b8765c017a37d9ff7c78113400` de
`feature/seguridad-dependencias-web`. No se fusiono ni desplego.

- El override de emulador configura las dos variables hacia la misma base Docker
  y activa el modo de fixtures estricto del backend, solo en desarrollo.
- `rebuild-api.cjs --emulator` reconstruye solo `api` utilizando ambos Compose.
  No reinicia/elimina `db`, ni regenera claves o esquema.
- `seed-profiles.cjs` crea perfiles A y B. Exige host/base/usuario locales, marca de
  aislamiento y exclusivamente las cuatro cuentas conocidas. Rechaza pacientes
  ajenos. Usa transaccion y conserva perfiles existentes, incluidos cambios del
  bloque manual. No crea historias, mediciones, planes ni correos.
- `check-profiles.cjs` comprueba perfil sin token (401), perfil A (200), identidad
  publica A, perfil B (200) e identidad publica B. No imprime cuerpos, tokens ni
  claves. Esto no constituye un escaneo SAST/DAST ni una prueba manual de CP06.

## Validacion

Regresion movil `npm run test:legacy`: **93/93 aprobadas**, incluidas las nueve
comprobaciones de reconstruccion y sembrado. `npm run typecheck`, `npm run lint`,
`npm run verify:config` y comprobaciones de sintaxis/diff: correctas. Entorno de
esta validacion: Node v24.22.1; el equipo del operador utiliza Node v22.13.0.
Los dobles de Docker y cliente SQL prueban argumentos,
conservacion, guardas y rollback; no sustituyen PostgreSQL real. El backend cuenta
con 14 pruebas de configuracion y consumidores, sin acceso a bases externas.

## Resultado real recibido

El operador compartio el resultado de `check-profiles.cjs`, ejecutado el
`2026-11-02T21:22:30.448Z`. Se conserva sin agregar campos en
[prep-03-perfiles-http.json](prep-03-perfiles-http.json).

| Comprobacion | Resultado |
|---|---|
| Perfil sin token | HTTP 401 esperado y recibido; aprobado. |
| Perfil de cuenta A | HTTP 200 esperado y recibido; aprobado. |
| Identidad sintetica A y contrato publico | `passed: true`. |
| Perfil de cuenta B | HTTP 200 esperado y recibido; aprobado. |
| Identidad sintetica B y contrato publico | `passed: true`. |

La salida confirma disponibilidad y contrato de los perfiles de ambas cuentas.
No muestra el commit efectivo de los contenedores ni del cliente; los hashes
previstos de preparacion no se convierten en metadatos verificados de ejecucion.
El fragmento de sembrado recibido no incluye su conteo completo de creados y
conservados, por lo que no se atribuye un numero a cada categoria.

El requisito HTTP para comenzar CP06 queda satisfecho. Los recorridos manuales
de Perfil siguen no ejecutados; el guardado y la persistencia se prueban en el
siguiente bloque. No se prepararon mediciones, planes ni correo.
`scannerExecuted: false`: no corresponde a una nueva ejecucion SAST/DAST.

INC-ENT-01 queda atendida para la disponibilidad HTTP del perfil, con el resto de
recorridos de datos aun pendientes. El siguiente bloque esta definido en
[cinco comprobaciones de Perfil](../../../pruebas-bloque-02.md).
