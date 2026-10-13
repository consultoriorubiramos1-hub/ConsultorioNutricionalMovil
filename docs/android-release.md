# Android: preparación y liberación futura

## Estado y pendientes externos

No se vinculó EAS, creó cuenta, generó firma, compiló AAB, envió a Play, promovió versión ni creó Release. No se observaron todavía las respuestas reales de EAS/Play usadas por los scripts.

El propietario debe completar:

1. ANDROID_PACKAGE definitivo, EXPO_OWNER y EXPO_PROJECT_ID reales en GitHub y EAS production. app.config.js incorpora esos valores conservando app.json. No cambiar el paquete después de publicar.
2. Nombre comercial, versión existente 1.0.0, iconos adaptativos y splash finales. Se conservaron los recursos actuales; el icono aún muestra Expo.
3. Vinculación interactiva EAS con `npx eas-cli@latest`, cuando se autorice. Preparar firma remota, respaldo seguro de upload key y Play App Signing. CI usa freeze-credentials y no debe crear credenciales automáticamente.
4. Sincronizar versionCode remoto con cualquier carga anterior a Play. Se utiliza appVersionSource=remote y autoIncrement=true. No inventar historia de publicación con números locales.
5. Variables públicas de EAS production: EXPO_PUBLIC_API_URL, ANDROID_PACKAGE, EXPO_PROJECT_ID, EXPO_OWNER, iguales a GitHub. Deben estar disponibles al resolver configuración; no pueden almacenarse como secretos inaccesibles a ese paso.
6. App de Play Console, cuenta de servicio y permisos sobre esa aplicación. Guardar credenciales Submit mediante EAS remoto; eas.json internal no usa un archivo JSON versionado.
7. GOOGLE_PLAY_SERVICE_ACCOUNT_JSON exclusivamente como Secret de android-production para promoción. El script usa OAuth RS256 y Android Publisher API en memoria, sin escribir la clave en disco.
8. Environments, autorización ajena, main protegido y flags deshabilitados hasta revisión. Resolver avisos de dependencias antes de liberar.

La primera carga a Google Play requiere intervención manual según [EAS Submit para Android](https://docs.expo.dev/submit/android/). Prepararla no equivale a realizarla. Completar ficha, capturas, privacidad, seguridad de datos, clasificación, permisos y requisitos de cuenta/pruebas que Play Console indique para la cuenta concreta; no se verificaron aquí esos requisitos externos.

## Envío a pruebas internas

Solo después del merge autorizado y CI completo, ejecutar android-release.yml en main. Su job quality reutiliza exactamente branch-policy, typecheck, lint, unit-tests e integration-mock, con ci-required como agregador. No pasa Secrets de backend ni ejecuta pruebas contra PostgreSQL/Neon. La opción predeterminada es CANCELAR. Exige flags, versión coincidente, confirmación y environment android-internal.

La consulta de producción usa GET /api/mobile/auth/me sin token y exige rechazo JSON 401/403. Es disponibilidad básica sin tocar pacientes, no validación funcional completa. Si el backend real tiene otro contrato, revisarlo antes de cambiar la comprobación; no inventar /health.

Se descargan variables EAS a .env.eas-release.local, se comparan cuatro valores públicos con GitHub y se elimina el archivo. El build usa production, espera FINISHED y firma remota. No usa auto-submit.

El manifest conserva commit, versión, versionCode, paquete, proyecto, build ID y SHA-256. La estructura AAB se comprueba mediante BundleConfig.pb y base/manifest/AndroidManifest.xml; eso no certifica instalación/firma/funcionamiento en dispositivos. Submit usa el build ID exacto, nunca --latest. Se conservan AAB/manifest por 90 días.

## Instalación y evidencia

El otro integrante debe instalar desde Play Internal Testing y documentar versión/versionCode/commit, dispositivos Android y resultado de login/sesión, recuperación con cuentas sintéticas, perfil, citas/comprobantes, historial/evaluaciones/progreso, plan vacío/asignado, búsqueda/likes/enlaces del muro y errores de red. No exponer información médica o credenciales.

Adjuntar reporte HTTPS revisado y responsable de aprobación. Estas pruebas manuales de instalación y funcionamiento siguen siendo requisito para promover a producción; la decisión de usar integración simulada en CI no las sustituye. La automatización no simula estas pruebas ni afirma que ocurrieron. Las pruebas API/BD conservadas son opcionales y no forman parte del gate de liberación.

## Promoción del mismo AAB

Ejecutar android-promote.yml en el mismo main con Run ID interno exitoso, versión, reporte, internal_tests_passed=true y PROMOVER_A_PRODUCCION, después de revisión ajena. Si main cambia, repetir pruebas internas.

El workflow verifica metadata del run GitHub, commit, versión, proyecto EAS y SHA-256. La API oficial de Play crea un edit, exige el versionCode en internal, rechaza downgrade y rollout/borrador de producción pendiente, actualiza production usando el mismo versionCode, valida y confirma el edit. No recompila ni carga otra vez el AAB. Los fallos no se ocultan y un edit no confirmado se elimina.

Después crea un borrador GitHub Release vX.Y.Z con trazabilidad. Google puede continuar la revisión; el propietario confirma disponibilidad en Play Console antes de publicar el registro.

## Recuperación

No repetir builds/Submit a ciegas: revisar EAS/Play por build ID/versionCode. Cada build nuevo incrementa el contador. Cancelar el runner puede dejar trabajo EAS en curso; revisarlo y cancelarlo manualmente si corresponde.

Si Play acepta la promoción y falla GitHub Release, consultar promotion.json/Play y recuperar el registro manualmente sin volver a publicar. Si vence el artifact de 90 días, iniciar un nuevo ciclo autorizado o recuperar el original mediante procedimiento revisado, sin desactivar verificaciones.

Resolver errores de permisos, primera carga, revisión o rollout pendiente en Play Console. No saltarse revisiones ni activar changesNotSentForReview automáticamente. Resultados y URLs de descarga quedan fuera de Git.

## Referencias consultadas

- [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/)
- [Jest para Expo](https://docs.expo.dev/develop/unit-testing/)
- [Schema eas.json](https://docs.expo.dev/eas/json/)
- [Versionado remoto](https://docs.expo.dev/build-reference/app-versions/)
- [EAS CLI](https://docs.expo.dev/eas/cli/)
- [Fragmento Build del código oficial EAS CLI](https://github.com/expo/eas-cli/blob/main/packages/eas-cli/src/graphql/types/Build.ts)
- [OAuth de cuentas de servicio](https://developers.google.com/identity/protocols/oauth2/service-account)
- [Play: actualizar track](https://developers.google.com/android-publisher/api-ref/rest/v3/edits.tracks/update)
- [Play: confirmar edit](https://developers.google.com/android-publisher/api-ref/rest/v3/edits/commit)
