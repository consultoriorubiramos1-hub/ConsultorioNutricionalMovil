# PREP-03: preparacion de perfiles ficticios

Fecha de registro: 2 de noviembre de 2026. **Estado: codigo preparado y comprobado;
reconstruccion, sembrado y comprobacion HTTP del operador pendientes.**

## Diagnostico recibido

El operador consulto metadatos de `public.tblpatients` en el servicio `db` local.
Se confirmaron las columnas de perfil, incluida `fecha_nacimiento`, `estado_civil`
y `ocupacion`, y la relacion de `user_id` con `tblusers`. La inspeccion de presencia
de variables dentro de `api` devolvio `DATABASE_URL_configurada: true` y
`POSTGRES_URL_configurada: false`. No se compartieron valores de conexion.

El sembrado anterior solo creo usuarios y roles, sin pacientes. Ademas, los cuatro
servicios heredados requieren `POSTGRES_URL` con TLS, incompatible con la
configuracion anterior del PostgreSQL local. La preparacion nueva aborda ambas
condiciones; el resultado real de los endpoints aun debe recibirse.

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

INC-ENT-01 permanece abierta hasta recibir los resultados de preparacion y luego
acreditar los recorridos correspondientes. El siguiente bloque esta definido en
[cinco comprobaciones de Perfil](../../../pruebas-bloque-02.md).
