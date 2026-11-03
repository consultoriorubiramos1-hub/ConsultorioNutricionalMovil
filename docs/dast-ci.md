# DAST de autenticacion en GitHub Actions

El workflow se mantiene en el repositorio privado RubiRamos: `.github/workflows/dast-auth.yml`. Obtiene el backend del commit probado y este tooling publico fijado al SHA completo indicado en el YAML. De ese modo, el token de Actions solo necesita lectura del repositorio que ejecuta la prueba.

## Ejecucion

Se dispara en cambios de autenticacion, dependencias, configuracion y tooling de las ramas develop, main, release/** y la rama de seguridad indicada en el YAML; tambien en pull requests a las ramas de integracion. Existe un disparo manual adicional exclusivo para estas pruebas. No se modifican los workflows del AAB ni los cinco jobs obligatorios del CI movil.

El job crea claves nuevas, PostgreSQL temporal y una API en desarrollo dentro de la red Docker interna. Usa cuatro cuentas sinteticas y una estructura versionada que solo define los campos de autenticacion en tblusers/tblroles. Esta estructura no es el esquema exportado de Neon y no acredita pruebas de los demas modulos. El origen se marca versioned-synthetic-auth-v1 y se conserva su hash.

Se exigen cuatro controles HTTP de cabeceras, ocho de autenticacion y la ejecucion real de OWASP ZAP 2.17.0 contra POST /api/mobile/auth/login y GET /api/mobile/auth/me. La fase activa mantiene el limite de cinco minutos. Los fallos, evidencia incompleta, origen distinto o riesgo alto hacen fallar la compuerta. Otros niveles requieren seguimiento; un job verde no significa cero avisos.

## Reportes y aislamiento

El artefacto privado dast-auth-RUN_ID conserva durante 30 dias una lista explicita de resumen ZAP, controles, origen y evaluacion de CI. No incluye config.env, HTML, JSON bruto de ZAP o logs con intercambios HTTP. La opcion include-hidden-files permite subir esa lista dentro de .local; no habilita la subida completa de la carpeta.

El job no recibe credenciales de Neon, Gmail, EAS o Google Play. La configuracion Compose de la API fija el destino PostgreSQL al servicio db/cnm_dast, y los guardas del sembrador exigen esa base y su marca de aislamiento. Los contenedores y su base en memoria se destruyen al terminar. El checkout no conserva credenciales y el token del job solo tiene contents: read.

## Evidencia y limites

La primera ejecucion del workflow fue [41387127234](https://github.com/consultoriorubiramos1-hub/RubiRamos/actions/runs/41387127234), sobre backend f827f3a10204452941fd9c14c42aa0102aefa992. Construccion, sembrado, cabeceras y autenticacion previa pasaron; el scanner agoto su cota de once minutos y el job fallo. No se acredita un DAST terminado para ese intento. La limpieza de contenedores y la subida de cuatro archivos sanitizados se completaron.

La repeticion utiliza la cuenta zap de la imagen y el grupo del runner, directorio del reporte 0770 y umask 0007 para permitir su escritura entre ambos procesos. El modo local por defecto conserva el UID del operador. Ante un error, scanner-diagnostic.json solo informa categorias conocidas, progreso por jobs y condiciones de usuario/permisos; omite lineas de log, tokens, rutas y payloads. La compuerta sigue rechazando fallos y tiempos agotados.

La [ejecucion 41389516672](evidencias/seguridad/dast-ci-2026-11-01.md) termino correctamente: 4/4 cabeceras, 8/8 autenticacion y ZAP con 0 altos, medios y bajos y 2 informativos. Se descargo y verifico el ZIP sanitizado contra el digest de GitHub. Esta evidencia acredita el workflow en ese alcance; no acredita que el AAB dependa de su resultado remoto.

Las pruebas locales anteriores con esquema exportado permanecen en docs/evidencias/seguridad. Los resultados de CI se distinguen por su esquema sintetico y por los commits de backend/tooling. No cubren TLS o pinning nativos, dispositivo, todos los modulos, SMTP externo ni una version de produccion. El seguimiento SAST, los hallazgos SCA residuales y los casos del Plan de pruebas mantienen su estado separado.

Referencias:

- [Permisos del token de Actions](https://docs.github.com/en/actions/concepts/security/github_token).
- [Checkout de repositorios](https://github.com/actions/checkout).
- [Artefactos de Actions](https://github.com/actions/upload-artifact).
- [ZAP Automation Framework](https://www.zaproxy.org/docs/desktop/addons/automation-framework/).
