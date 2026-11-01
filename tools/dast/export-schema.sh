#!/bin/sh
set -eu

: "${DAST_SCHEMA_SOURCE_URI:?Falta la conexion de origen; no se intentara una conexion local.}"
case "$DAST_SCHEMA_SOURCE_URI" in
    postgres://*|postgresql://*) ;;
    *) printf '%s\n' 'La conexion de origen debe ser una URI PostgreSQL.' >&2; exit 2 ;;
esac

export PGCONNECT_TIMEOUT=15
# La URI se expande dentro del contenedor como un solo argumento, sin eval.
exec pg_dump --dbname="$DAST_SCHEMA_SOURCE_URI" --no-password \
    --schema-only --no-owner --no-privileges --no-comments --clean --if-exists \
    --lock-wait-timeout=5s --file=/out/schema.partial.sql
