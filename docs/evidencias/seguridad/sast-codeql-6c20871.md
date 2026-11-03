# SAST: reanalisis de la preparacion atomica

[CodeQL 41386601910](https://github.com/consultoriorubiramos1-hub/ConsultorioNutricionalMovil/actions/runs/41386601910) termino correctamente sobre `6c20871b32033c2ba77e0d72ecfad89d98d1cf54`. Se descargo y reviso el SARIF del artefacto 13115264059.

El digest del ZIP coincide con GitHub: `3338176d9946ac762cadef4967500f1961f89d5a20d3d67cf9bcf3e4d3de7db1`. SHA-256 del SARIF: `8faab21071a61d8a69be7093f71a8e66ce3008fdd0961d9d4df05e761b493ae5`. Motor 2.27.3; 103 reglas. [Resumen](sast-codeql-6c20871.json).

## Resultado y tratamiento

El reporte contiene dos resultados: js/file-access-to-http en scripts/protect-main.cjs:10, puntuacion 6.5, y js/http-to-file-access en scripts/promote-google-play.cjs:50, puntuacion 6.3. Se conserva su revision contextual en [la evidencia inicial](sast-codeql-5642a32.md). Los destinos y rutas son fijos y los flujos son operaciones previstas. No se confirmo un uso no autorizado en la revision; las advertencias no se suprimen ni se cierran automaticamente en GitHub.

El resultado js/file-system-race de la [ejecucion anterior](sast-codeql-4fcd103.md) ya no aparece. La creacion exclusiva de config.env decide atomicamente si puede crear el archivo y maneja EEXIST sin comprobacion previa. Pasaron dos regresiones de filesystem, incluida la preparacion concurrente, y las 79 pruebas de la suite heredada. Lint, TypeScript y configuracion tambien pasaron.

Estado: patron ajustado y reanalisis confirmado. No se declara un reporte con cero resultados ni una certificacion de ausencia de vulnerabilidades. Las herramientas de administracion y promocion no se ejecutaron durante la revision; el AAB mantiene su disparador automatico.
