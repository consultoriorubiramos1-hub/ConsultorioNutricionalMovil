# Informe de preparación CI/CD y Android

Fecha: 12 de octubre de 2026, America/Mexico_City. Preparación, sin merge o liberación.

## Auditoría inicial

- Repositorio privado: consultoriorubiramos1-hub/ConsultorioNutricionalMovil. Checkout limpio al inicio en develop.
- main: e248d68cc8d7fdeab96e3de32f7ef6cfd29aefdd (Initial commit).
- develop: 522dbbabebbf67e08742ed7068afe627fb42582c. Diferencia: 28 commits y 137 archivos frente a main. Contiene los módulos reales integrados.
- Ramas remotas consultadas: feature/autenticacion, citas, configuracion-inicial, dashboard, evaluaciones-nutricionales, muro-informativo, perfil-paciente, planes-alimenticios; fix/perfil-fecha y fix/perfil-lint. Se revisaron historia, refs y diferencias; no se fusionaron ni eliminaron ramas.
- Las refs locales históricas codex/* y feature/auth-develop no se trataron como ramas remotas vigentes. La rama local feature/perfil-paciente estaba atrasada respecto a origin; no se alteró.
- No había workflows versionados, eas.json ni identificador Android/projectId EAS. No hay android/ios; se utiliza CNG. No hay bun.lock; se mantiene npm/package-lock.
- Expo 57.0.24, RN 0.86.3, React 19.2.3, TS 6.0.3 y ESLint 9. Configuración estricta y rutas en src/app. Documentación SDK 57 consultada antes de cambios.
- Cuatro suites Node originales revisadas y conservadas sin modificaciones: citas, historial, muro y plan. Incluyen unidades y contratos/viewmodels con dependencias simuladas.
- Fuentes del backend Express, schema/migraciones PostgreSQL, entorno aislado, credenciales Expo/Play y documentos académicos externos no disponibles. No se inventaron.
- .env.local está ignorado y define EXPO_PUBLIC_API_URL. Se inspeccionaron nombres, no se incluyeron sus valores en Git o este reporte.
- Se conservaron app.json, permisos/plugins, iconos y splash. Cámara/micrófono del selector siguen deshabilitados en configuración; los permisos finales del manifiesto CNG no se verificaron mediante un build. El icono existente muestra identidad Expo y queda pendiente de aprobación para tienda.

## Estado por componente

| Componente | Estado | Trabajo realizado | Pendientes |
|---|---|---|---|
| Estructura Git | VERIFICADO REALMENTE | Auditoría local/remota, cambios aislados; main conserva su commit | Revisión del cambio |
| Ramas | IMPLEMENTADO Y CONFIGURADO | chore/configuracion-ci-cd desde develop; flujo documentado y política CI | Integrar la preparación a develop mediante PR autorizado |
| Pruebas unitarias | IMPLEMENTADO; VERIFICADO PARCIALMENTE | Jest SDK 57, siete archivos unitarios y ejecución de cuatro suites originales | Ejecutar unidades restantes/originales en CI |
| Pruebas de integración | PREPARADO PERO SIN EJECUTAR íntegramente | Servicios/adapters simulados; PI-01/PI-02 reales, driver externo y limpieza | Backend/BD/driver aislados; solo un caso simulado se ejecutó |
| GitHub Actions CI | IMPLEMENTADO Y CONFIGURADO | Jobs obligatorios, artifacts y ci-required que rechaza omission/fallo/cancelación | Primer PR y ejecución remota completa |
| Protección de main | PENDIENTE DE PERMISOS | Payload y script manual preparados | Conector sin Administration; protected:false; aplicar y verificar reglas |
| TypeScript | VERIFICADO REALMENTE | Tipos Jest/Node y exclusión del checkout de backend; tsc --noEmit aprobado | Ninguno local; CI remoto pendiente |
| ESLint | VERIFICADO REALMENTE | Cero warnings obligatorios, exclusión de artifacts/backend | CI remoto pendiente |
| EAS Build | PREPARADO PERO SIN EJECUTAR | APK preview, AAB production, firma/versionCode remotos, config dinámica | Paquete, owner, projectId, firma y primer build autorizado |
| Google Play Store | PREPARADO PERO SIN EJECUTAR | Dispatch interno y promoción del mismo versionCode; borrador Release | Cuenta/app/primera carga, credenciales, instalación, aprobación y requisitos Play |
| Variables y Secrets | PENDIENTE DE CREDENCIALES | Ejemplos seguros, controles de origen/host y flags deshabilitados | Cargar Secrets y configurar environments/protecciones |
| README | IMPLEMENTADO Y CONFIGURADO | Arquitectura, equipo, comandos, ramas, CI/EAS/Play y pendientes | Actualizar documentos académicos externos |

La preparación no equivale a una liberación validada. El CI real **debe fallar** mientras falte el entorno obligatorio; el YAML no protege main sin reglas activadas en GitHub.

## Comprobaciones efectivamente ejecutadas

- npm run typecheck: aprobado después de añadir los tipos de pruebas.
- npm run lint: aprobado sin errores/warnings.
- npm run verify:config: aprobado; parseo YAML/JS, concordancia lockfile, acciones fijadas y descubrimiento de **7 archivos unitarios y 1 de integración simulada**. No ejecuta sus suites.
- actionlint **1.7.12**, descargado de su release oficial y comprobado mediante SHA-256: los tres workflows sin errores de estructura, expresiones o referencias. No se utilizó ShellCheck ni Pyflakes; no se ejecutaron los workflows.
- npx expo config --type public --json: aprobado, conserva nombre/version/plugins y confirma que android.package y projectId aún están ausentes. No se imprimieron variables privadas ni se generaron directorios nativos.
- Comprobación limitada de Jest: auth.test.ts, perfil.test.ts y release-safety.test.ts, **19 casos aprobados**. La primera ejecución se detuvo antes de ejecutar casos por permisos de caché; se corrigió ubicando la caché en .expo/jest-cache y la ejecución posterior pasó.
- Integración simulada: únicamente el caso PI-02 de multipart y consulta, **1 aprobado y 7 omitidos por selección explícita local**. No se presenta la suite completa como aprobada y no se comprobó persistencia de BD.
- node scripts/test-environment.cjs: **exit 1 esperado**, falta TEST_ENVIRONMENT. Verifica el bloqueo por configuración ausente; no es una prueba PI aprobada ni contactó API.
- git diff --check: sin errores tras normalizar el final del README.
- npm audit: inicialmente 68 avisos (incluido uno crítico en shell-quote). Actualización compatible de shell-quote **1.10.0 → 1.12.0** en lockfile; instalación reporta **67 avisos: 16 moderate y 51 high, sin critical**. Es el único paquete preexistente cuya versión cambió. No se aplicó audit fix --force ni se cambió Expo/RN de versión mayor. [Aviso corregido](https://github.com/advisories/GHSA-pqg4-j6r4-53mv).

Los avisos restantes necesitan análisis y actualizaciones compatibles antes de habilitar producción. Algunos fixes propuestos por npm cambian versiones mayores o SDK; no se declararon resueltos. La instalación de Jest/preset/YAML actualizó package-lock; el controlador verify:config comprueba que coincida con package.json.

## Pruebas preparadas que no se declararon aprobadas

- Unidades completas de citas, historial/progreso, planes y muro.
- Suites originales Node completas (tests/*.test.cjs), no migradas ni reemplazadas.
- Casos restantes de integración simulada: login válido, 400/401/403, JSON/red, perfil y dashboard.
- PI-01 real App–API, PI-02 real App–API–BD y limpieza real de fixtures.
- Instalación Android, transporte nativo, permisos/manifest finales, firma AAB y funcionamiento en dispositivos.
- Workflows remotos, API de producción, EAS Build/Submit, promoción y GitHub Releases.

La suite release-safety se comprobó nuevamente tras ajustar los validadores a los campos del código oficial de EAS CLI: **3 casos aprobados**, sin operaciones remotas. No se ejecutó npm test o un ciclo completo de liberación.

## Archivos creados

Configuración: .env.example, .env.test.example, .nvmrc, app.config.js, eas.json, jest.config.cjs, jest.integration.config.cjs.

GitHub: .github/workflows/ci.yml, android-release.yml, android-promote.yml; .github/main-protection.json.

Scripts: scripts/android-release.cjs, promote-google-play.cjs, protect-main.cjs, run-node-tests.cjs, test-environment.cjs, verify-config.cjs.

Lógica reutilizable: src/modules/auth/utils/login-validation.ts y src/modules/perfil/utils/perfil-form.ts. Las reglas provienen de los viewmodels existentes; no se agregó lógica clínica.

Pruebas: tests/jest.setup.ts; tests/helpers/load-typescript.cjs; tests/unit/auth.test.ts, perfil.test.ts, citas.test.ts, historial.test.ts, plan-alimenticio.test.ts, muro.test.ts, release-safety.test.ts; tests/integration/mock/app-api.test.ts y tests/integration/live/app-api.test.cjs.

Documentación: docs/ci-cd-audit.md, integration-environment.md, github-protection.md y android-release.md.

## Archivos modificados

README.md, .gitignore, eslint.config.js, package.json, package-lock.json, tsconfig.json, src/modules/auth/viewmodels/use-login-view-model.ts y src/modules/perfil/viewmodels/use-perfil-viewmodel.ts.

app.json y las cuatro pruebas originales permanecen sin cambios. No se tocaron archivos nativos ni registros del backend.

## Intervención manual y siguientes pasos

1. Revisor examina la preparación en la rama nueva. No se abrió PR automáticamente para evitar iniciar ahora el ciclo remoto de pruebas; se puede abrir posteriormente a **develop**.
2. Provisionar backend de pruebas y driver conforme a integration-environment.md, Secrets/variables y environments. Verificar BD aislada antes de sembrar fixtures.
3. Propietario aplica protección de main mediante UI o script con GH_ADMIN_TOKEN. El error actual es **403 Resource not accessible by integration**, no una limitación de plan demostrada. Verificar GET de reglas después de aplicarlas; no cambiar visibilidad.
4. Cuando se autorice integrar develop con main: abrir ese PR, obtener todos los checks y revisión ajena vigente, resolver conversaciones y hacer merge manual. Una integración obligatoria pendiente impide ci-required.
5. Para publicar después: elegir paquete/identidad gráfica, vincular EAS, preparar firma/cuenta de servicio, sincronizar versionCode, ficha/privacidad/requisitos de Play y primera carga manual. Resolver dependencias antes de habilitar flags.
6. Ejecutar Android interno únicamente cuando se autorice; instalar/probar, registrar reporte, recibir aprobación ajena y promover el mismo artefacto. Confirmar revisión pública en Play y publicar el borrador GitHub Release.

Credenciales pendientes: EXPO_TOKEN, firma Android remota, cuenta de servicio Submit en EAS, GOOGLE_PLAY_SERVICE_ACCOUNT_JSON del environment production, TEST_DATABASE_URL y token de lectura del backend si corresponde. GH_ADMIN_TOKEN solo para operación manual de protección. No se crearon/recuperaron claves automáticamente.

Limitaciones: faltan backend, schema/driver, permisos de administración del conector, conocimiento del plan, cuentas/configuración EAS/Play y pruebas reales/dispositivo. Los controles preparados bloquean antes de declarar éxito, pero su operación externa completa todavía requiere ejecución autorizada.
