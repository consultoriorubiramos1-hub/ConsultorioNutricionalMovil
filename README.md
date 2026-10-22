# Consultorio Nutricional Móvil

Aplicación para pacientes: autenticación y recuperación, inicio, perfil, citas con comprobante, historial y evaluaciones, progreso nutricional, planes alimenticios y muro. Se conservan conexiones y funciones reales; los datos sintéticos están limitados a pruebas.

## Tecnologías y arquitectura

Expo SDK **57**, React Native **0.86.3**, React **19.2.3**, TypeScript **6**, Expo Router, MVVM y adapters. Jest **29.7**, jest-expo **57** y @react-native/jest-preset **0.86.3**. GitHub Actions ejecuta CI y EAS prepara Android. El backend previsto es Node/Express en Render con PostgreSQL en Neon, pero sus fuentes y entorno de pruebas **no están en este repositorio**. No se verificó una conexión real con Neon.

Las vistas consumen viewmodels; los servicios llaman la API y los adapters convierten DTO a modelos. La validación de login y los formularios de perfil se extrajeron a utilidades conservando sus reglas.

```text
src/app/                         Rutas y layouts de Expo Router
src/modules/
  auth/ dashboard/ perfil/ citas/ historial/ plan-alimenticio/ muro/
    models/ adapters/ services/ viewmodels/ views/ components/ utils/
src/components/ui/              Componentes compartidos
src/shared/session/             Sesión
assets/                         Iconos, splash y recursos
tests/*.test.cjs                 Cuatro suites originales de node:test
tests/unit/                     Unidades Jest y controles de liberación
tests/integration/mock/          Servicios/adapters con fetch simulado
tests/integration/live/          App–API–BD aislada, opcional y manual
scripts/                        Ejecución, verificación y operaciones manuales
.github/workflows/               CI y Android
docs/                           Auditoría y procedimientos
```

No se movieron módulos ni las carpetas históricas evaluaciones/planes. Los módulos implementados están en historial y plan-alimenticio. Android/iOS utilizan Continuous Native Generation: no crear ni editar directorios nativos a mano.

## Instalación y ejecución local

Usar Node **22.13.x o una revisión posterior de Node 22** (.nvmrc fija 22.13.0) y npm. No hay bun.lock.

```bash
npm ci
npm start
npm run android
npm run ios
npm run web
```

Copiar .env.example a .env.local y completar EXPO_PUBLIC_API_URL con la API de desarrollo. **EXPO_PUBLIC_* queda visible en el binario**: nunca poner contraseñas o tokens allí. No cambiar el .env.local existente para ejecutar pruebas aisladas.

Agregar dependencias con `npx expo install <paquete>`. Consultar [SDK 57](https://docs.expo.dev/versions/v57.0.0/) y [el índice vigente](https://docs.expo.dev/llms.txt). Las bibliotecas nativas fuera de Expo Go requieren un development build. El perfil preview genera un APK de revisión; no se añadió un perfil developmentClient sin instalar antes expo-dev-client.

## Flujo de ramas para los dos integrantes

El flujo definitivo es **feature/* → develop → main**, mediante Pull Requests. Las correcciones normales siguen **fix/* → develop → main**.

1. Cada integrante actualiza develop y crea feature/<tema> o fix/<tema> desde ella.
2. El autor abre PR a develop. El otro integrante revisa código, contratos y CI; no aprobar su propio trabajo.
3. Posteriormente, preparar la versión mediante PR **develop → main**. Exigir CI completo y aprobación vigente del otro integrante.
4. Después de nuevos commits se solicita revisión otra vez. La protección exige checks actualizados y aprobación del último push.
5. El merge es manual. La publicación requiere autorización y un proceso separado. No trabajar ni hacer pushes directos a main.

Hotfix publicado: crear fix/hotfix-<tema> desde main, abrir PR a main, recibir revisión ajena y etiqueta **hotfix-approved** aplicada por un mantenedor. CI y protección siguen siendo obligatorios. Después sincronizar el fix a develop mediante otro PR. La etiqueta permite la excepción de origen, sin sustituir revisiones.

Esta preparación usa **chore/configuracion-ci-cd**, basada en develop, y se revisa en el [PR #15 hacia develop](https://github.com/consultoriorubiramos1-hub/ConsultorioNutricionalMovil/pull/15). No se fusionó ni actualizó el código de main, ni se abrió PR de liberación.

## Scripts y pruebas

| Comando | Alcance |
|---|---|
| npm run typecheck | tsc --noEmit, incluye pruebas TS |
| npm run lint | Expo ESLint; falla también con warnings |
| npm run verify:config | Sintaxis JS/YAML, lockfile, descubrimiento y controles CI/EAS; no ejecuta suites |
| npm run test:unit | Jest unitario y cuatro suites originales de Node |
| npm run test:unit:jest | Solo unidades Jest |
| npm run test:legacy | Suites originales de citas, historial, muro y plan, sin modificarlas |
| npm run test:integration:mock | Servicios/adapters reales con fetch simulado |
| npm run test:integration:live | Opcional y manual: PI-01/PI-02 contra API/BD aisladas; exige su entorno |
| npm run test:integration | Integración simulada de servicios/adapters, sin API ni BD |
| npm test | Unidades Jest, originales Node e integración simulada; sin API ni BD |

Las unidades cubren login obligatorio/respuestas incorrectas, perfil/parches/fechas, citas/horarios/comprobantes, nulos/cálculos/progreso, planes vacíos/horarios y publicaciones/likes. Las suites originales también contienen contratos, cancelación, timeouts y viewmodels con dependencias simuladas: **no prueban Express o PostgreSQL**.

Las pruebas de integración simulada utilizan servicios y adapters del proyecto con respuestas de fetch controladas y aserciones sobre peticiones, transformaciones y errores. Son obligatorias en CI y no representan conexión real con Express, PostgreSQL o Neon.

Por decisión del equipo para este proyecto académico, las pruebas contra API/BD **no forman parte de npm test, del CI ni de la validación obligatoria de PR o liberación**. Se conservan como opcionales para ejecución manual futura con `npm run test:integration:live`. PI-01/PI-02 reales siguen sin ejecutarse ni aprobarse; no se consideran cobertura real verificada. El [contrato opcional](docs/integration-environment.md) describe sus requisitos. No hay passWithNoTests, || true ni aprobación por omisión de pruebas obligatorias.

Jest genera JSON y cobertura; Node genera XML JUnit. CI conserva artifacts también con errores. La cobertura de Jest no incluye automáticamente las suites originales Node; no se presenta como cobertura global certificada.

## CI y protección de main

[ci.yml](.github/workflows/ci.yml) valida PR hacia develop o main. Exige cinco jobs: **branch-policy, typecheck, lint, unit-tests e integration-mock**. Ejecutan npm ci, política de ramas, TypeScript/configuración, ESLint, unidades/originales e integración simulada. **ci-required** depende exactamente de los cinco y solo aprueba si todos terminan en success; failure, cancelled, skipped o un resultado ausente bloquean el resultado.

El CI no necesita Secrets, un environment de integración, un checkout del backend ni conexión a PostgreSQL/Neon. Los PR de forks ejecutan las mismas comprobaciones sin credenciales, sujetos a las autorizaciones habituales de GitHub. Se usa pull_request, nunca pull_request_target para código no confiable. Acciones fijadas a commits, permisos mínimos, timeouts y artifacts de diagnóstico.

En la preparación inicial el conector devolvió **403 Resource not accessible by integration** al consultar reglas de protección. Durante este ajuste del PR #15, la lista de ramas ya indica **protected:true para main**, conservando su commit. No se modificó esa protección ni se verificaron aquí sus reglas concretas. El propietario debe comprobar que el check exigido siga siendo ci-required, con revisiones y checks actualizados. No se cambió la visibilidad privada.

El [procedimiento de protección](docs/github-protection.md) incluye [.github/main-protection.json](.github/main-protection.json) y el script manual `node scripts/protect-main.cjs`. Requiere PR, aprobación ajena vigente, ci-required, checks actualizados, aprobación del último push y bloqueo de bypass/force push/eliminación. **El YAML por sí solo no impide merges ni pushes directos.**

## Variables y Secrets

| Ubicación | Configuración |
|---|---|
| Local, .env.local | EXPO_PUBLIC_API_URL; identidad Android/EAS cuando se decida |
| CI automático y npm test | No necesitan variables ni Secrets de backend/BD |
| Solo pruebas reales opcionales, .env.test.local | TEST_ENVIRONMENT=isolated, TEST_API_URL, TEST_API_ALLOWED_ORIGIN, PRODUCTION_API_URL, TEST_BACKEND_REPOSITORY, TEST_BACKEND_REF, TEST_BACKEND_DRIVER, TEST_DATABASE_ALLOWED_HOST y TEST_DATABASE_URL; ver contrato opcional |
| GitHub vars, Android | ANDROID_PACKAGE, EXPO_PROJECT_ID, EXPO_OWNER, PRODUCTION_API_URL; inicialmente ANDROID_RELEASE_ENABLED=false y RELEASE_APPROVALS_CONFIGURED=false |
| Secrets, android-internal/production | EXPO_TOKEN con acceso al proyecto |
| EAS production | EXPO_PUBLIC_API_URL, ANDROID_PACKAGE, EXPO_PROJECT_ID, EXPO_OWNER, iguales a los valores aprobados en GitHub y visibles al resolver configuración |
| EAS credenciales remotas | Keystore Android y cuenta de servicio de Google Play para Submit |
| Secret, android-production | GOOGLE_PLAY_SERVICE_ACCOUNT_JSON, para promoción mediante API oficial |
| Sesión manual del propietario | GH_ADMIN_TOKEN con Administration:write para protección; no en workflows |

Nunca subir tokens, JSON privados, keystores ni cuentas reales de pacientes. El CI reutilizable no recibe Secrets de integración real. No entregar Secrets de producción a PR. Las variables de las pruebas reales opcionales se configuran únicamente cuando se decida ejecutarlas manualmente en un entorno aislado.

## EAS y Android

[app.config.js](app.config.js) conserva app.json e inyecta identificadores aprobados desde variables. No se inventó paquete permanente, owner o projectId. Se conservan nombre, versión 1.0.0 y plugins de comprobantes. Los íconos y el splash utilizan el logo original de Rubí Ramos sobre blanco; ver [recursos y comprobación en dispositivos](docs/app-branding.md).

[eas.json](eas.json) define preview (APK interno) y production (AAB, firma remota y environment production). EAS administra/incrementa versionCode remotamente. El propietario debe inicializar/sincronizar el contador con cualquier carga previa a Play. No se añadió un número local ficticio. Cambiar la versión comercial mediante PR revisado en app.json/package.json.

Faltan cuenta/proyecto EAS, android.package, credenciales remotas/Play App Signing, variables, ficha y políticas de tienda. No se ejecutaron eas init, creación de firma, builds, Submit ni OTA.

## Liberación futura autorizada

Los workflows Android son **solo workflow_dispatch**, nunca por push a main. Quedan deshabilitados sin las dos variables de habilitación y confirmación manual. Crear android-internal/android-production, permitir solo main, exigir revisión ajena y prevenir autoaprobación. Si el plan no permite los controles, mantener ambas variables en false.

1. Completar pendientes externos y revisar avisos de dependencias. Más adelante abrir PR develop → main, obtener ci-required y revisión vigente, y hacer merge manual autorizado.
2. Ejecutar android-release.yml en main con versión exacta y ENVIAR_A_PRUEBAS_INTERNAS. Reutiliza las cinco comprobaciones automáticas sin backend/BD y exige aprobación de android-internal.
3. Verifica versión/identidad, consulta auth/me sin token y compara variables de EAS production. La consulta prueba disponibilidad básica, no todas las funciones del backend.
4. EAS construye/firma el AAB. Se verifica build del commit exacto, estructura AAB y SHA-256. Se envía ese build ID a internal y conserva AAB/manifest 90 días.
5. Instalar desde Play Internal Testing, probar los módulos en dispositivos representativos y adjuntar reporte HTTPS sin datos personales.
6. Con revisión ajena, ejecutar android-promote.yml en el mismo main con Run ID interno, versión, reporte, internal_tests_passed=true y PROMOVER_A_PRODUCCION. Un commit distinto requiere repetir pruebas internas.
7. Promover **el mismo versionCode** con la API oficial de Play, sin recompilar ni volver a cargar AAB. Rechaza downgrade y rollout/borrador pendiente.
8. Crear registro borrador en GitHub Releases. Confirmar revisión/disponibilidad en Play Console y publicar manualmente el registro cuando corresponda.

La [guía Android](docs/android-release.md) explica primera carga manual, firma, permisos y recuperación. No se ejecutó esta secuencia durante la preparación.

## Estado y documentación académica

El [reporte de auditoría](docs/ci-cd-audit.md) registra los resultados reales del ajuste del PR #15 y distingue pruebas automáticas simuladas, pruebas reales opcionales y verificación manual en dispositivos. No se ejecutan builds o publicaciones como parte de este ajuste. La auditoría previa reportó 67 avisos después de corregir shell-quote; esa revisión no certifica seguridad para publicar.

Actualizar documentos académicos que describen GitHub Flow sin develop: ramas, integración de módulos, actividades Mobile-D, criterios de aceptación, plan/evidencias de pruebas, gestión de configuración y despliegue. El flujo real es feature/* → develop → main, con PR/revisión/CI. La evidencia automática cubre unidades e integración simulada; PI-01/PI-02 reales deben figurar como opcionales y no verificadas. No se modificaron documentos externos no disponibles.
