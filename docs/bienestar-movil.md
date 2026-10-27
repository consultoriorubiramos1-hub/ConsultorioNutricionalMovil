# Versión móvil de nutrición y bienestar

Revisión realizada el 26 de octubre de 2026 exclusivamente en `feat/bienestar-movil`. Código preparado para revisión mediante un Pull Request hacia `develop`. No se hizo commit, merge, tag, build, envío a tienda ni publicación durante esta adaptación.

## Alcance por módulo

| Módulo | Comportamiento en la versión de bienestar |
| --- | --- |
| Inicio y menú compartido | Accesos a Mi progreso nutricional, plan alimenticio, perfil y muro. Se retiran próxima cita, botón de citas y acceso rápido a reservas. Inicio consulta únicamente progreso y plan; no solicita `/api/mobile/citas`. |
| Mi progreso nutricional (`/historial`) | Una sola pantalla sin pestañas ni detalles. Arriba, Mis últimas mediciones: exactamente cuatro tarjetas con icono, valor, unidad y fecha propios, en dos columnas y con sus fondos suaves originales. Debajo, Historial de progreso nutricional: fecha destacada, las mismas cuatro medidas en dos columnas, cambio de peso y descripción accesible del progreso. |
| Evolución y bordes | Se recuperan los bordes originales: verde (`Colors.primaryGreen`) para `aligned`, rojo (`Colors.danger`) para `opposed` y gris (`Colors.textSecondary`) para `neutral`. Se reutilizan `evaluationWeightProgress` y `evaluationProgressCards` sin modificar sus reglas, objetivos, mantenimiento ni referencias aplicables. Fondos claros y bordes redondeados. La gráfica y diferencia global existentes quedan al final. |
| Apartados retirados del progreso | No se presentan registro inicial, hábitos, datos del paciente, otras circunferencias/pliegues, agua o distribución segmental. Tampoco motivos de consulta, antecedentes, enfermedades, tratamientos, ginecología, resultados bioquímicos/laboratorio, presión arterial, diagnósticos, intervenciones ni notas clínicas. No se reutilizan diagnósticos como observaciones. |
| Citas (`/citas`) | La entrada antigua redirige a `/inicio` con `Redirect` de Expo Router. No monta el viewmodel ni formularios, no consulta disponibilidad/citas y no solicita permisos para comprobantes. Los enlaces profundos que resuelven esa ruta llegan a la misma redirección. Inicio mantiene su manejo habitual de sesión. |
| Autenticación, recuperación y sesión | Implementación y contratos sin cambios. Se conservan cierre de sesión, limpieza de token ante expiración y manejo de errores. |
| Perfil, plan y muro | Se mantienen perfil y su edición, planes y menús asignados, lectura de publicaciones, búsquedas, likes y enlaces válidos. |
| Derechos ARCO | Acceso mediante consultas actuales y correo oficial; Rectificación mediante edición del perfil/cuenta y solicitudes al responsable; Cancelación y Oposición mediante los formularios existentes que preparan correo. El usuario debe enviarlo desde su programa de correo. No se promete recepción, resolución, supresión inmediata ni cierre automático de cuenta. |

Se conserva MVVM, tipografías Lato, colores y componentes compartidos. Se mantiene virtualización de registros, recarga, estados vacíos y de red, etiquetas accesibles, encabezados y botones. Los accesos rápidos se ajustan para que el nuevo nombre pueda ocupar varias líneas en pantallas pequeñas.

La proyección `NutritionMeasurement` selecciona fecha, cuatro medidas y clave local. El viewmodel conserva esa proyección y el estado descriptivo del progreso, sin pasar objetos clínicos a las tarjetas. Las reglas originales determinan el orden, la comparación válida anterior y el estado; no se decide el color únicamente por subir o bajar de peso. Se preservan filas incompletas y claves únicas. Pesos y cinturas deben ser finitos positivos; porcentajes entre 0 y 100. Los faltantes se muestran como **—** y una fecha histórica ausente como **Sin fecha registrada**. Cada indicador superior busca su última medición disponible con su fecha individual. Sin registros, aparecen cuatro tarjetas con — y el estado vacío del historial.

El cambio histórico procede de la comparación original con la medición válida anterior. La gráfica y diferencia global conservan sus validaciones: fecha válida, peso positivo, extremos distintos e inequívocos y limpieza decimal. Color y texto describen avance respecto al objetivo o referencia disponible; no son un diagnóstico ni una valoración general de salud. Los motivos clínicos internos de exclusión se sustituyen por un mensaje neutral sin revelar embarazo, antecedentes ni notas médicas. Ningún diagnóstico se reutiliza como contenido de bienestar.

## Sistema conectado y datos que continúan tratándose

No se modificaron backend, aplicación web administrativa, Render, Neon ni PostgreSQL. Las funciones de atención clínica, expediente, diagnósticos, laboratorios, intervenciones, agenda y comprobantes quedan fuera de la interfaz móvil y siguen siendo responsabilidad del sistema conectado. Su funcionamiento web no se auditó ni se ejecutó desde este repositorio.

Los endpoints, DTO, adaptadores y campos clínicos del historial se conservan. `/api/mobile/historial` todavía puede entregar datos clínicos. Las reglas originales consultan objetivos registrados y, cuando corresponde, limitaciones de sus referencias; la proyección visible muestra solo cuatro medidas, fecha, cambio y descripción del estado. Los componentes clínicos de evaluación/detalle siguen fuera de las rutas. No se purgaron datos ni se realizaron operaciones contra pacientes reales.

La app sigue tratando identificación/contacto, credenciales/token, medidas corporales y datos relacionados con la salud, planes, interacciones del muro y solicitudes ARCO. La respuesta del historial todavía puede incluir hábitos y contenido clínico del sistema conectado, que se excluyen de la proyección mostrada. El token continúa en SecureStore; esto no certifica el servidor ni implica borrado de información remota. Inicio ya no descarga citas.

Los componentes, servicios y contratos heredados de citas se conservan aislados y sin acceso desde las rutas de la aplicación. Sus pruebas de contrato/formulario permanecen activas y usan transporte simulado; no habilitan una funcionalidad del producto ni acreditan persistencia real en servidor. Una prueba recorre los imports de ejecución de todas las rutas y comprueba que no alcanzan formularios, servicios ni viewmodels de citas.

## Documentos legales

`src/modules/auth/content/legal-documents.ts` mantiene ambos documentos y su estructura. Los enlaces de login y el modal se conservan; ahora se identifica el documento de privacidad como **Aviso de Privacidad**. Se puede consultar sin sesión, desplazarse por todos los apartados y cerrar con X, Entendido o Atrás de Android. Se conserva texto seleccionable, encabezados accesibles y ausencia de truncamiento.

Términos contiene los diez apartados y todos los párrafos solicitados: introducción, acceso, seguimiento, límites de bienestar, plan, uso responsable, disponibilidad, privacidad, cambios y contacto. El apartado de seguimiento precisa la pantalla única, fecha y cuatro medidas, ausencia de pestañas/detalles y evolución exclusivamente descriptiva. Se retiran las promesas de reservas, comprobantes, pagos y servicios clínicos de la versión móvil. Se conserva `contacto@rubinutricion.com`, cuya operación y autorización para contacto/ARCO confirmó el usuario el 26 de octubre de 2026.

Privacidad conserva la distinción entre datos móviles y datos clínicos/administrativos del sistema conectado, identidad y domicilio documentados, datos de salud, consentimiento, ARCO, conservación, supresión, revocación y proveedores. Los documentos legales se conservaron sin cambios en este ajuste visual por instrucción del usuario; la validación pendiente descrita abajo sigue vigente. Tampoco se cambió navegación, autenticación, ARCO ni otras pantallas durante la recuperación del diseño.

Ambos conservan `approvedAt: 30 de septiembre de 2025` como antecedente histórico y registran `updatedAt: 26 de octubre de 2026`. El modal dice **Fecha de aprobación original** para no presentar la aprobación antigua como aprobación de la nueva revisión. `validationStatus: pending` es metadata editorial interna; no se muestra como comentario al usuario.

**Pendiente antes de publicar:** validación del responsable y revisión jurídica de ambos documentos, finalidades reales, consentimiento de datos sensibles, identidad/domicilio vigentes, inventario de proveedores/encargados y transferencias, medidas efectivas del servidor, plazos de conservación y procedimiento de respuesta ARCO. La confirmación del correo no equivale a aprobación legal del resto del contenido.

## Verificaciones automatizadas

Resultados del 26 de octubre de 2026, tras ejecutar las suites completas con los cambios finales de código. En Windows se utiliza `npm.cmd`/`npx.cmd` porque la política de PowerShell bloquea los lanzadores `.ps1`; no se modifica esa política.

| Comando solicitado | Resultado final |
| --- | --- |
| `npm run typecheck` | Aprobado; `tsc --noEmit`, salida 0. |
| `npm run lint` | Aprobado; cero advertencias permitidas, salida 0. |
| `npm run test:unit` | Aprobado; 21 suites Jest y 351 pruebas; además 67 pruebas heredadas de Node. Cero fallos, omisiones o cancelaciones. Salida 0. |
| `npm run test:integration:mock` | Aprobado; 1 suite, 10 pruebas, salida 0. Transporte simulado, sin servidor real. |
| `npm run verify:config` | Aprobado; sintaxis, descubrimiento de 21 suites unitarias y 1 de integración, lockfile y controles CI/EAS, salida 0. Este comando descubre suites; no sustituye su ejecución anterior. |
| `npx expo-doctor` | Aprobado; 20/20 comprobaciones, salida 0. Se ejecutó con acceso autorizado a red y caché temporal en `.expo/npm-cache`, sin cambiar dependencias. |
| `git diff --check` | Aprobado; sin errores de whitespace, salida 0. |

Cobertura añadida/actualizada: cuatro indicadores superiores con icono/fecha y faltantes —; cuatro medidas históricas en dos columnas y cambio; bordes para bajar, subir, mantenimiento y referencias válidas o insuficientes; paridad de estado, orden y cambio con las funciones originales; descripción accesible sin motivos clínicos; ausencia de pestañas y detalles; validación, carga, error, recarga, vacíos, sesión y respuestas tardías. Se conservan las pruebas de las demás funciones. El grafo de rutas excluye componentes clínicos iniciales/detallados y permite reutilizar las utilidades originales del progreso.

Los tests de componentes usan `react-test-renderer` y módulos nativos simulados. No constituyen pruebas de instalación en Android/iOS, gestos de desplazamiento real, TalkBack/VoiceOver ni pruebas contra backend/BD reales. No se ejecutó integración live, que incluye operaciones de citas sobre el servidor, para respetar el alcance y no alterar información remota.

## Pendientes de Google Play y validación en dispositivos

Esta adaptación no garantiza aprobación de Google Play y no sustituye revisión jurídica. Antes de solicitar publicación, el responsable debe:

1. Validar los documentos y disponer de un aviso público accesible, coherente con el tratamiento real y la identidad de la ficha.
2. Completar la declaración de aplicaciones de salud y nutrición según las funciones/datos reales; el enfoque de bienestar no elimina el tratamiento de datos de salud. Revisar descripción y advertencias de la ficha. [Política de salud](https://support.google.com/googleplay/android-developer/answer/16679511?hl=en).
3. Completar Seguridad de los datos incluyendo servidor y SDK/proveedores. No declarar que no se tratan datos sensibles por haber ocultado tarjetas. [Seguridad de los datos](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en).
4. Evaluar la aplicabilidad y requisitos de eliminación de cuenta/datos con los flujos reales de alta del servicio. La app usa cuentas autorizadas y no incorpora un registro nuevo. Los correos ARCO no acreditan por sí solos el cumplimiento del flujo de eliminación de cuentas de Play. [Eliminación de cuentas](https://support.google.com/googleplay/android-developer/answer/13327111?hl=en).
5. Auditar los permisos efectivos del futuro AAB y SDK incluidos: retirar acceso a reservas no demuestra que se hayan eliminado permisos nativos de librerías heredadas. No se cambiaron dependencias ni configuración Expo/EAS/Android en esta tarea. [Permisos sensibles](https://support.google.com/googleplay/android-developer/answer/9888170?hl=en).
6. Completar ficha, capturas, clasificación de contenido, acceso de revisión, requisitos de cuenta/pruebas y versión objetivo exigidos por Play Console para la cuenta concreta.
7. Cuando exista autorización separada para un build, instalar y verificar login, recuperación, sesión, perfil y cuatro derechos ARCO, progreso con cuatro indicadores superiores y tarjetas históricas con bordes, sin pestañas ni detalles; gráfica/diferencia descriptivas, IMC de Inicio, plan, muro, errores de red, enlaces profundos y Atrás. Probar Android pequeño, texto ampliado y TalkBack; probar navegación, documentos y VoiceOver en iOS. [Guía de liberación](android-release.md).

Referencias técnicas consultadas: [Expo SDK 58](https://docs.expo.dev/versions/v58.0.0/), [índice Expo](https://docs.expo.dev/llms.txt), [redirecciones de Expo Router](https://docs.expo.dev/router/reference/redirects/). Referencia jurídica para revisión por el responsable: [LFPDPPP vigente, Cámara de Diputados](https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPDPPP.pdf). No se presume cumplimiento por citar estas fuentes.

## Integridad del alcance y entrega

Referencias de ramas protegidas comparadas al inicio y al entregar, sin cambios:

| Rama | Commit |
| --- | --- |
| `main` | `3d3a35496633912e8906b93bc4bf25211f32c278` |
| `develop` | `f30251fa6eea373648ed690fcf6f1547275355bf` |
| `release/v1.0.0` | `f30251fa6eea373648ed690fcf6f1547275355bf` |

No se modificaron API de autenticación, dependencias/lockfile, credenciales, EAS, identificadores Android ni configuración de infraestructura. Las modificaciones se limitan a la app móvil, pruebas y documentación. El destino previsto del PR es `develop`; la aprobación de publicación y los pendientes externos permanecen separados de la revisión de código.

## Inventario completo de archivos modificados o añadidos

27 archivos acumulados de la adaptación y sus ajustes. Los archivos de documentos legales que aparecen en este inventario corresponden a cambios previos; no se editaron durante esta recuperación visual.

```text
docs/android-release.md
docs/bienestar-movil.md
src/modules/auth/components/legal-document-modal.tsx
src/modules/auth/content/legal-documents.ts
src/modules/auth/models/legal-document.model.ts
src/modules/citas/views/citas-view.tsx
src/modules/dashboard/adapters/dashboard-adapter.ts
src/modules/dashboard/components/dashboard-menu.tsx
src/modules/dashboard/services/dashboard-service.ts
src/modules/dashboard/views/dashboard-view.tsx
src/modules/historial/components/follow-up-card.tsx
src/modules/historial/components/initial-evaluation.tsx
src/modules/historial/components/nutrition-progress.tsx
src/modules/historial/components/progress-summary.tsx
src/modules/historial/models/historial.model.ts
src/modules/historial/services/historial-service.ts
src/modules/historial/utils/historial-presentation.ts
src/modules/historial/utils/nutrition-measurements.ts
src/modules/historial/viewmodels/use-historial-viewmodel.ts
src/modules/historial/views/historial-view.tsx
tests/historial.test.cjs
tests/integration/mock/app-api.test.ts
tests/unit/bienestar-ui.test.ts
tests/unit/historial-progress-ui.test.ts
tests/unit/login-legal-documents.test.ts
tests/unit/nutrition-measurements.test.ts
tests/unit/perfil-citas-ui.test.ts
```
