# Android: release → main → AAB → tag

`release/vX.Y.Z` es una rama de Git. El tag `vX.Y.Z` es el resultado de generar, verificar y conservar el AAB. Estos workflows no crean publicaciones en GitHub Releases. El envío y la promoción a Google Play siguen siendo manuales.

## Estado y pendientes externos

Este ajuste solo modifica archivos locales. No vincula EAS, crea cuentas/firma, compila AAB, envía a Play, integra ramas ni crea tags. Las respuestas remotas se comprueban con simulaciones; no se certificó aquí una ejecución real de EAS/Play/GitHub Actions.

El propietario debe completar:

1. ANDROID_PACKAGE, EXPO_OWNER y EXPO_PROJECT_ID en GitHub y EAS production deben coincidir con los identificadores existentes en app.json. app.config.js incorpora esos valores; no inventar ni sustituir identidades.
2. Nombre comercial, versión existente 1.0.0, iconos adaptativos y splash finales. Los recursos de Rubí Ramos ya están preparados; comprobarlos con un build preview recién instalado según la [guía de identidad de la app](app-branding.md).
3. Vinculación interactiva EAS con `npx eas-cli@latest`, cuando se autorice. Preparar firma remota, respaldo seguro de upload key y Play App Signing. CI usa freeze-credentials y no debe crear credenciales automáticamente.
4. Sincronizar versionCode remoto con cualquier carga anterior a Play. Se utiliza appVersionSource=remote y autoIncrement=true. No inventar historia de publicación con números locales.
5. Variables públicas de EAS production: EXPO_PUBLIC_API_URL, ANDROID_PACKAGE, EXPO_PROJECT_ID, EXPO_OWNER, iguales a GitHub. Deben estar disponibles al resolver configuración; no pueden almacenarse como secretos inaccesibles a ese paso.
6. App de Play Console, cuenta de servicio y permisos sobre esa aplicación. Guardar credenciales Submit mediante EAS remoto; eas.json internal no usa un archivo JSON versionado.
7. GOOGLE_PLAY_SERVICE_ACCOUNT_JSON exclusivamente como Secret de android-production para promoción. El script usa OAuth RS256 y Android Publisher API en memoria, sin escribir la clave en disco.
8. Environments android-internal/android-production con autorización ajena, solo main y sin autoaprobación; main protegido con ci-required. ANDROID_RELEASE_ENABLED y RELEASE_APPROVALS_CONFIGURED son variables de repositorio y se mantienen deshabilitadas hasta revisión. Este ajuste no las activa. El token del job tag necesita contents:write y las reglas de tags deben permitir crear vX.Y.Z sin permitir sobrescrituras. Resolver avisos de dependencias antes de liberar.

La primera carga a Google Play requiere intervención manual según [EAS Submit para Android](https://docs.expo.dev/submit/android/). Prepararla no equivale a realizarla. Completar ficha, capturas, privacidad, seguridad de datos, clasificación, permisos y requisitos de cuenta/pruebas que Play Console indique para la cuenta concreta; no se verificaron aquí esos requisitos externos.

## Preparar e integrar la rama release

Preparar release/vX.Y.Z desde develop y mantener esa versión estable en app.json y package.json. Los pushes a release y los PR ejecutan CI; branch-policy verifica la versión de la rama. Abrir PR release/vX.Y.Z → main en el mismo repositorio, obtener ci-required y revisión vigente, e integrar manualmente. Un PR cerrado sin merge, un fork o un hotfix no autoriza un AAB automático.

## Generación automática y tag final

`android-tag.yml` escucha exclusivamente `pull_request` de tipo `closed` hacia main. Su job authorize comprueba merged=true, estado cerrado, origen/base del mismo repositorio, nombre completo release/vX.Y.Z, versión y que merge_commit_sha sea exactamente GITHUB_SHA. Consulta también el PR en la API de GitHub. Rechaza un tag existente de otro commit antes de compilar. No hay disparador push por tag, workflow_dispatch de build ni envío encadenado a otro workflow.

Todos los checkouts de este flujo y del CI reutilizable fijan `ref: github.sha`; se comprueba HEAD y que no haya cambios versionados antes del build. Nunca se resuelve main de nuevo para elegir el código. Si main avanza durante la ejecución, se conserva el commit original; ante cualquier discrepancia con el evento se bloquea el proceso.

El job quality reutiliza exactamente branch-policy, typecheck, lint, unit-tests e integration-mock, con ci-required como agregador. No pasa Secrets de backend ni ejecuta pruebas contra PostgreSQL/Neon. El job build depende de authorize y quality y usa android-internal con sus aprobaciones y flags existentes.

La consulta de producción usa GET /api/mobile/auth/me sin token y exige rechazo JSON 401/403. Es disponibilidad básica sin tocar pacientes, no validación funcional completa. Si el backend real tiene otro contrato, revisarlo antes de cambiar la comprobación; no inventar /health.

Se descargan variables EAS a .env.eas-release.local, se comparan cuatro valores públicos con GitHub y se elimina el archivo. El build usa production, espera FINISHED y firma remota. No usa auto-submit.

Se exige FINISHED, plataforma ANDROID, perfil production, distribución STORE, commit/versión/paquete/proyecto/owner coincidentes, build ID y versionCode válidos y URL HTTPS de AAB. La descarga comprueba integridad ZIP y presencia de BundleConfig.pb y base/manifest/AndroidManifest.xml. jarsigner verifica firma e integridad; se rechazan AAB sin firmar o con entradas sin firmar. Los certificados autofirmados de Android no requieren una CA pública. Esto no certifica instalación ni funcionamiento en dispositivos.

El manifiesto conserva esquema, commit, versión, versionCode, paquete, proyecto, owner, build ID, rama/PR de origen, repositorio, Run ID/intento y SHA-256. AAB, manifiesto y resultado de firma se conservan 90 días como `android-aab-<run_id>-<intento>`, descargable en GitHub Actions. El nombre por intento permite reintentos sin sobrescribir artefactos anteriores.

Solo después del upload exitoso puede ejecutarse tag, el único job con contents:write. Recupera el artefacto por su ID, verifica SHA-256, manifiesto y metadatos/digest de conservación en GitHub, y vuelve a comprobar el PR. Crea exclusivamente refs/tags/vX.Y.Z apuntando al SHA compilado. No usa force, PATCH ni DELETE. Si ya existe en ese commit, termina de forma idempotente; si apunta a otro, falla. También comprueba el resultado después de una creación concurrente o una respuesta perdida. Ningún fallo de calidad, compilación, descarga, firma, validación o almacenamiento permite avanzar a crear el tag.

## Envío manual a pruebas internas

Ejecutar `android-release.yml` mediante workflow_dispatch en main, con `build_run_id` de la ejecución automática exitosa, `version` y `confirmation=ENVIAR_A_PRUEBAS_INTERNAS`. La opción predeterminada sigue siendo CANCELAR. Se exigen flags y aprobación de android-internal. Este workflow no compila.

Selecciona el AAB conservado del último intento disponible del Run ID indicado. Comprueba que el run automático terminó correctamente y corresponde a android-tag.yml del mismo repositorio, y valida manifiesto, PR integrado, tag, SHA-256 y metadata EAS. Se exige que el commit coincida con el main fijado al iniciar el envío manual. Submit usa el build ID exacto, nunca --latest. Después de un Submit exitoso conserva AAB/manifiesto como `android-internal-<run_id>` durante 90 días. Ese Run ID manual es el que se usa para promoción.

## Instalación y evidencia

El otro integrante debe instalar desde Play Internal Testing y documentar versión/versionCode/commit, dispositivos Android y resultado de login/sesión, recuperación con cuentas sintéticas, perfil y cuatro derechos ARCO, Mi progreso nutricional (pantalla única sin pestañas; cada tarjeta solo fecha, peso, grasa, músculo y cintura; sin detalles ni clasificaciones; gráfica y diferencia descriptivas), IMC orientativo de Inicio, plan vacío/asignado, búsqueda/likes/enlaces del muro y errores de red. En la versión de bienestar, comprobar que `/citas` redirige a Inicio y que no hay reservas, comprobantes ni apartados clínicos accesibles; consultar [alcance y pendientes de bienestar](bienestar-movil.md). Probar también los documentos legales sin sesión, pantallas pequeñas, escalado de texto, TalkBack y cierre con Atrás. No exponer información médica o credenciales.

Adjuntar reporte HTTPS revisado y responsable de aprobación. Estas pruebas manuales de instalación y funcionamiento siguen siendo requisito para promover a producción; la decisión de usar integración simulada en CI no las sustituye. La automatización no simula estas pruebas ni afirma que ocurrieron. Las pruebas API/BD conservadas son opcionales y no forman parte del gate de liberación.

## Promoción del mismo AAB

Ejecutar android-promote.yml en el mismo main con Run ID interno exitoso, versión, reporte, internal_tests_passed=true y PROMOVER_A_PRODUCCION, después de revisión ajena. Si main cambia, repetir pruebas internas.

El workflow verifica metadata del run GitHub, commit, versión, proyecto EAS y SHA-256. La API oficial de Play crea un edit, exige el versionCode en internal, rechaza downgrade y rollout/borrador de producción pendiente, actualiza production usando el mismo versionCode, valida y confirma el edit. No recompila ni carga otra vez el AAB. Los fallos no se ocultan y un edit no confirmado se elimina.

No crea ni modifica tags o publicaciones en GitHub Releases. Google puede continuar la revisión; el propietario confirma disponibilidad en Play Console.

## Recuperación

Si solo falla tag, reejecutar únicamente los jobs fallidos: recupera el artefacto del build ya aprobado, incluso si pertenece a un intento anterior del mismo Run ID, sin recompilar. Si el tag ya quedó creado pero se perdió la respuesta, un reintento acepta el mismo SHA. Nunca borrar/mover un tag en conflicto para eludir el bloqueo.

Reejecutar todos los jobs vuelve a compilar el mismo commit y crea otro artefacto por intento; EAS incrementa versionCode. No repetir builds/Submit a ciegas: revisar EAS/Play por build ID/versionCode. Cancelar el runner puede dejar trabajo EAS en curso; revisarlo y cancelarlo manualmente si corresponde. No se declara éxito ni se crea tag antes de conservar y verificar el nuevo AAB.

Si Play acepta el envío/promoción y falla un paso posterior, consultar EAS, promotion.json y Play antes de repetir una operación. Si vence el artefacto de 90 días, iniciar un nuevo ciclo autorizado o recuperar el original mediante procedimiento revisado, sin desactivar verificaciones. Si main avanzó antes de iniciar el envío/promoción manual, los controles conservadores de commit bloquean el artefacto anterior: preparar y probar un ciclo vigente.

Resolver errores de permisos, primera carga, revisión o rollout pendiente en Play Console. No saltarse revisiones ni activar changesNotSentForReview automáticamente. Resultados y URLs de descarga quedan fuera de Git.

## Referencias consultadas

- [Expo SDK 58](https://docs.expo.dev/versions/v58.0.0/)
- [Jest para Expo](https://docs.expo.dev/develop/unit-testing/)
- [Schema eas.json](https://docs.expo.dev/eas/json/)
- [Versionado remoto](https://docs.expo.dev/build-reference/app-versions/)
- [EAS CLI](https://docs.expo.dev/eas/cli/)
- [EAS en CI y firma remota](https://docs.expo.dev/build/building-on-ci/)
- [GitHub Actions tras integrar un PR](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#running-your-pull_request-workflow-when-a-pull-request-merges)
- [GitHub: referencias Git](https://docs.github.com/en/rest/git/refs)
- [GitHub: artefactos de Actions](https://docs.github.com/en/rest/actions/artifacts)
- [Verificación con jarsigner](https://docs.oracle.com/en/java/javase/17/docs/specs/man/jarsigner.html)
- [Fragmento Build del código oficial EAS CLI](https://github.com/expo/eas-cli/blob/main/packages/eas-cli/src/graphql/types/Build.ts)
- [OAuth de cuentas de servicio](https://developers.google.com/identity/protocols/oauth2/service-account)
- [Play: actualizar track](https://developers.google.com/android-publisher/api-ref/rest/v3/edits.tracks/update)
- [Play: confirmar edit](https://developers.google.com/android-publisher/api-ref/rest/v3/edits/commit)
