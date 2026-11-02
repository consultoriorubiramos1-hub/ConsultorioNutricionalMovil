# Seguimiento SAST del commit 4fcd103

Se reviso el SARIF de [CodeQL 41385266227](https://github.com/consultoriorubiramos1-hub/ConsultorioNutricionalMovil/actions/runs/41385266227), finalizado correctamente sobre `4fcd103a95512f89fb058c8ba94d75ee61befa41`. La revision incluye el contenido del artefacto, no solo el estado del job.

El ZIP del artefacto 13115132050 tiene SHA-256 `5ace2ecc0fc481cf9d880c46d45a1e54b970153533f27bd05b0e88342919c441`, coincidente con el digest de GitHub. El SARIF tiene SHA-256 `c1665f145f4fe77ce02c727a5e051c2bfa535f9143c791a68325be224f8c3601`. Motor: CodeQL 2.27.3; 103 reglas. [Resumen estructurado](sast-codeql-4fcd103.json).

## Resultado de esa ejecucion

| Regla | Ubicacion | Nivel SARIF | Puntuacion de seguridad |
|---|---|---|---:|
| js/file-system-race | tools/dast/prepare-local.cjs:42 | warning | 7.7 |
| js/file-access-to-http | scripts/protect-main.cjs:10 | warning | 6.5 |
| js/http-to-file-access | scripts/promote-google-play.cjs:50 | warning | 6.3 |

No hay resultados ubicados en src/ en ese SARIF. Las puntuaciones describen las reglas y no acreditan por si solas explotacion.

## Creacion de la configuracion local

CodeQL senala la comprobacion previa de existencia y la escritura posterior de config.env. La escritura ya utilizaba la opcion exclusiva wx, que evita sobrescribir un archivo creado antes o durante esa comprobacion.

Se elimina la comprobacion previa del archivo y se maneja EEXIST desde la creacion exclusiva. La operacion atomica decide si puede crear el archivo y, si ya existe, conserva el mensaje para reutilizar las claves anteriores. Las pruebas reales de filesystem confirman que un entorno existente conserva claves y metadatos y que dos preparaciones concurrentes producen exactamente una creacion y un rechazo, sin sobrescritura.

Lint, TypeScript, verificacion de configuracion y las 79 pruebas de la suite heredada pasaron. El cambio no ejecuta Docker ni toca los entornos ya preparados.

Estado del seguimiento: patron ajustado y regresiones aprobadas; falta confirmar el resultado del nuevo analisis CodeQL. No se declara aun ausente la alerta en el scanner.

## Dos flujos administrativos

Se conserva la [revision contextual anterior](sast-codeql-5642a32.md): protect-main envia la politica publica versionada a un destino fijo de GitHub mediante la operacion prevista; promote-google-play guarda un comprobante JSON en una ruta fija. No se confirmaron divulgacion no autorizada, seleccion de rutas por el dato remoto ni ejecucion de ese dato en el uso revisado.

Esas herramientas no se ejecutaron durante esta revision. Las advertencias siguen documentadas y no se suprimen ni se cierran automaticamente en GitHub.

## Alcance y pendientes

El DAST local de login/me ya tiene revalidacion documentada sobre el backend 8b1d670. Se prepara por separado su workflow en el repositorio privado del backend, con una estructura sintetica de autenticacion para CI. No se equipara esa estructura con el esquema exportado usado por el operador. El AAB conserva su disparador automatico.
