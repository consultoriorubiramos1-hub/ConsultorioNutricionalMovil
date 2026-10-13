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
tests/integration/live/          App–API–BD aislada real
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

Esta preparación usa **chore/configuracion-ci-cd**, basada en develop. No se fusionó ni actualizó el código de main, ni se abrió PR de liberación.

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
| npm run test:integration:live | PI-01/PI-02 reales; falla si falta el entorno |
| npm run test:integration | Simuladas y reales, ambas obligatorias |
| npm test | Unidades, originales e integración simulada y real |

Las unidades cubren login obligatorio/respuestas incorrectas, perfil/parches/fechas, citas/horarios/comprobantes, nulos/cálculos/progreso, planes vacíos/horarios y publicaciones/likes. Las suites originales también contienen contratos, cancelación, timeouts y viewmodels con dependencias simuladas: **no prueban Express o PostgreSQL**.

PI-01 real autentica un paciente sintético y rechaza contraseña inválida. PI-02 real crea una cita multipart, la consulta, exige lectura directa de BD mediante driver externo y verifica limpieza. Usa FormData web desde Node, por lo que no certifica transporte Android en dispositivo.

El [contrato de integración](docs/integration-environment.md) detalla cómo conectar el backend. **Mientras falten backend/driver/BD, npm test, test:integration y ci-required no pueden aprobarse íntegramente.** No hay passWithNoTests, || true ni aprobación por omisión.

Jest genera JSON y cobertura; Node genera XML JUnit. CI conserva artifacts también con errores. La cobertura de Jest no incluye automáticamente las suites originales Node; no se presenta como cobertura global certificada.

## CI y protección de main

[ci.yml](.github/workflows/ci.yml) valida PR hacia develop o main. Ejecuta npm ci, política de ramas, TypeScript/configuración, ESLint, unidades/originales, integración simulada e integración real. **ci-required** solo aprueba con todos los jobs en success; failure, cancelled o skipped bloquean el resultado.

Los forks no reciben Secrets y quedan sin aprobación completa hasta disponer de una rama revisada en el repositorio. Se usa pull_request, nunca pull_request_target para código no confiable. Acciones fijadas a commits, permisos mínimos, timeouts y artifacts de diagnóstico. Las pruebas reales se serializan.

**main no quedó protegida.** GitHub devolvió protected:false y el conector respondió **403 Resource not accessible by integration** al consultar protección. La GitHub App no tiene acceso de Administration, aunque la cuenta tenga rol admin. El plan contratado no pudo verificarse; no se cambió la visibilidad privada.

El [procedimiento de protección](docs/github-protection.md) incluye [.github/main-protection.json](.github/main-protection.json) y el script manual `node scripts/protect-main.cjs`. Requiere PR, aprobación ajena vigente, ci-required, checks actualizados, aprobación del último push y bloqueo de bypass/force push/eliminación. **El YAML por sí solo no impide merges ni pushes directos.**

## Variables y Secrets

| Ubicación | Configuración |
|---|---|
| Local, .env.local | EXPO_PUBLIC_API_URL; identidad Android/EAS cuando se decida |
| GitHub vars, repositorio/integration-test | TEST_ENVIRONMENT=isolated, TEST_API_URL, TEST_API_ALLOWED_ORIGIN, PRODUCTION_API_URL, TEST_BACKEND_REPOSITORY, TEST_BACKEND_REF, TEST_BACKEND_DRIVER, TEST_DATABASE_ALLOWED_HOST |
| Secrets, integration-test | TEST_DATABASE_URL; TEST_BACKEND_READ_TOKEN de solo lectura si el backend privado lo requiere |
| GitHub vars, Android | ANDROID_PACKAGE, EXPO_PROJECT_ID, EXPO_OWNER, PRODUCTION_API_URL; inicialmente ANDROID_RELEASE_ENABLED=false y RELEASE_APPROVALS_CONFIGURED=false |
| Secrets, android-internal/production | EXPO_TOKEN con acceso al proyecto |
| EAS production | EXPO_PUBLIC_API_URL, ANDROID_PACKAGE, EXPO_PROJECT_ID, EXPO_OWNER, iguales a los valores aprobados en GitHub y visibles al resolver configuración |
| EAS credenciales remotas | Keystore Android y cuenta de servicio de Google Play para Submit |
| Secret, android-production | GOOGLE_PLAY_SERVICE_ACCOUNT_JSON, para promoción mediante API oficial |
| Sesión manual del propietario | GH_ADMIN_TOKEN con Administration:write para protección; no en workflows |

Nunca subir tokens, JSON privados, keystores ni cuentas reales de pacientes. Las variables de integración pueden vivir en el environment; el workflow reutilizable también permite pasar los Secrets del repositorio. Revisar código antes de autorizar integration-test. No entregar Secrets de producción a PR.

## EAS y Android

[app.config.js](app.config.js) conserva app.json e inyecta identificadores aprobados desde variables. No se inventó paquete permanente, owner o projectId. Se conservan nombre, versión 1.0.0, iconos, splash y plugins de comprobantes. El icono actual corresponde a Expo: falta identidad gráfica aprobada para tienda.

[eas.json](eas.json) define preview (APK interno) y production (AAB, firma remota y environment production). EAS administra/incrementa versionCode remotamente. El propietario debe inicializar/sincronizar el contador con cualquier carga previa a Play. No se añadió un número local ficticio. Cambiar la versión comercial mediante PR revisado en app.json/package.json.

Faltan cuenta/proyecto EAS, android.package, credenciales remotas/Play App Signing, variables, ficha y políticas de tienda. No se ejecutaron eas init, creación de firma, builds, Submit ni OTA.

## Liberación futura autorizada

Los workflows Android son **solo workflow_dispatch**, nunca por push a main. Quedan deshabilitados sin las dos variables de habilitación y confirmación manual. Crear android-internal/android-production, permitir solo main, exigir revisión ajena y prevenir autoaprobación. Si el plan no permite los controles, mantener ambas variables en false.

1. Completar pendientes externos y revisar avisos de dependencias. Más adelante abrir PR develop → main, obtener ci-required y revisión vigente, y hacer merge manual autorizado.
2. Ejecutar android-release.yml en main con versión exacta y ENVIAR_A_PRUEBAS_INTERNAS. Vuelve a exigir CI completo y aprobación de android-internal.
3. Verifica versión/identidad, consulta auth/me sin token y compara variables de EAS production. La consulta prueba disponibilidad básica, no todas las funciones del backend.
4. EAS construye/firma el AAB. Se verifica build del commit exacto, estructura AAB y SHA-256. Se envía ese build ID a internal y conserva AAB/manifest 90 días.
5. Instalar desde Play Internal Testing, probar los módulos en dispositivos representativos y adjuntar reporte HTTPS sin datos personales.
6. Con revisión ajena, ejecutar android-promote.yml en el mismo main con Run ID interno, versión, reporte, internal_tests_passed=true y PROMOVER_A_PRODUCCION. Un commit distinto requiere repetir pruebas internas.
7. Promover **el mismo versionCode** con la API oficial de Play, sin recompilar ni volver a cargar AAB. Rechaza downgrade y rollout/borrador pendiente.
8. Crear registro borrador en GitHub Releases. Confirmar revisión/disponibilidad en Play Console y publicar manualmente el registro cuando corresponda.

La [guía Android](docs/android-release.md) explica primera carga manual, firma, permisos y recuperación. No se ejecutó esta secuencia durante la preparación.

## Estado y documentación académica

El [reporte de auditoría](docs/ci-cd-audit.md) diferencia configuración, verificación local, preparado sin ejecutar y pendiente externo. No se ejecutó el ciclo completo de pruebas, pipeline remoto ni publicación. npm audit conserva 67 avisos después de corregir shell-quote; la preparación no certifica seguridad para publicar.

Actualizar documentos académicos que describen GitHub Flow sin develop: ramas, integración de módulos, actividades Mobile-D, criterios de aceptación, plan/evidencias de pruebas, gestión de configuración y despliegue. El flujo real es feature/* → develop → main, con PR/revisión/CI. PI-01/PI-02 deben figurar pendientes hasta ejecutar el entorno real. No se modificaron documentos externos no disponibles.
