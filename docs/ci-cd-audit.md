# Informe CI/CD: ajuste del PR #15

## Decisión vigente

Para este proyecto académico, la validación automática exige pruebas unitarias y de integración simulada entre servicios y adapters. No necesita backend, API real, PostgreSQL/Neon ni Secrets de BD. Esta decisión sustituye el requisito de integración real de la preparación inicial.

El cambio se realiza en chore/configuracion-ci-cd para el [PR #15 hacia develop](https://github.com/consultoriorubiramos1-hub/ConsultorioNutricionalMovil/pull/15). No se modifica main, se realiza merge o se publica Android.

## Comprobaciones obligatorias

| Job | Alcance |
|---|---|
| branch-policy | Flujo de ramas y excepción controlada de hotfix |
| typecheck | TypeScript y comprobación de configuración |
| lint | Expo ESLint, incluidos warnings |
| unit-tests | Unidades Jest y las cuatro suites originales Node |
| integration-mock | Servicios/adapters reales con fetch y dependencias nativas simulados |
| ci-required | Depende exactamente de los cinco anteriores; solo aprueba si todos terminan en success |

integration-tests fue retirado del workflow automático. ci-required conserva always() y rechaza failure, cancelled, skipped o un resultado ausente. Las suites no se vaciaron, marcaron como omitidas ni reemplazaron para conseguir aprobación.

npm test ejecuta test:unit y test:integration. test:unit conserva Jest y test:legacy; test:integration ejecuta únicamente test:integration:mock. test:integration:live permanece disponible como comando manual opcional, fuera de CI y de npm test.

## Resultados locales efectivamente verificados

| Comprobación | Resultado real |
|---|---|
| npm run typecheck | Aprobado |
| npm run lint | Aprobado, sin errores ni warnings |
| npm test: unidades Jest | 7 archivos, **32 casos aprobados**, ninguno omitido |
| npm test: originales Node | Cuatro archivos conservados, **67 casos aprobados**, sin fallos/cancelados/omitidos |
| npm test: integración simulada | 1 archivo, **8 casos aprobados**, ninguno omitido |
| npm test completo | **107 casos aprobados** sin API/BD real |
| npm run verify:config | Aprobado: YAML/JS, lockfile, descubrimiento, cinco dependencias y CI reutilizable sin Secrets de backend |
| Agregador real de ci-required | Aprobado con cinco éxitos; rechazó fallo, cancelación, omisión y ausencia de cada job (21 escenarios locales) |
| actionlint 1.7.12 | Los tres workflows sin errores; ShellCheck/Pyflakes no utilizados |

El script verify:config ejecuta el código real del agregador leído del YAML en un contexto aislado con resultados controlados. No sustituye pruebas de negocio y no consulta servicios externos.

No se ejecutaron PI-01/PI-02 reales, conexión Neon, EAS Build/Submit, promoción, instalación en dispositivo ni Google Play. Las pruebas simuladas verifican contratos del cliente, serialización, adapters y errores; **no son evidencia de persistencia real en PostgreSQL/Neon**.

Los resultados anteriores son locales. La ejecución remota posterior del PR debe observarse y registrarse por separado; no se presenta una corrida anterior como aprobación del nuevo commit.

## Pruebas reales opcionales

Se conservan tests/integration/live/app-api.test.cjs, el cargador TS, el control de entorno y .env.test.example. Continúan exigiendo un backend y una BD aislada antes de ejecutarse manualmente. No se redujeron sus aserciones o controles de limpieza y no se declararon aprobadas.

Los requisitos se detallan en [integration-environment.md](integration-environment.md). No hay workflow automático para ellas. Su falta de configuración no bloquea los PR ni el CI reutilizado por Android.

## Liberación Android

android-release.yml reutiliza el CI con las cinco validaciones automáticas y ya no pasa TEST_BACKEND_READ_TOKEN o TEST_DATABASE_URL. Conserva las verificaciones de identidad, versión, API básica de producción durante una futura liberación autorizada, firma y procedencia del AAB.

android-promote.yml fue revisado y validado con actionlint: mantiene selección del run interno exitoso, mismo commit/artefacto/versionCode, SHA-256, confirmación de pruebas internas, reporte HTTPS y aprobación de environment. No necesitó cambios de código.

Las pruebas manuales de instalación y funcionamiento siguen siendo requisito antes de promover a producción. Usar simulación en CI no las sustituye. Los workflows Android siguen siendo solo workflow_dispatch y mantienen los flags/autorizaciones existentes.

## Archivos modificados en este ajuste

- .github/workflows/ci.yml: elimina el job API/BD y su contrato de Secrets; ajusta el agregador a cinco dependencias.
- .github/workflows/android-release.yml: elimina Secrets de integración real del CI reutilizable.
- package.json: test:integration pasa a ejecutar solo la suite simulada.
- scripts/verify-config.cjs: exige la nueva composición del CI y verifica comportamiento del agregador.
- .env.test.example: señala explícitamente el uso opcional/manual.
- README.md: scripts, pruebas automáticas/simuladas/opcionales, Secrets y flujo del PR #15.
- docs/integration-environment.md: documenta el contrato real como opcional y manual.
- docs/github-protection.md: mantiene ci-required como check requerido y elimina entorno BD obligatorio.
- docs/android-release.md: explica CI sin BD y conserva pruebas/aprobaciones manuales.
- docs/ci-cd-audit.md: este informe actualizado y resultados reales.

No se agregaron dependencias; package-lock.json no necesitó cambios. No se modificaron suites originales, unidades Jest, pruebas simuladas, módulos de la app, app.json ni configuración EAS.

## Antecedentes y límites

La preparación inicial está en el commit 65fd2e59a037af158a6e9f6a386c3e512ac5345d, basado en develop 522dbbabebbf67e08742ed7068afe627fb42582c. main se conservó en e248d68cc8d7fdeab96e3de32f7ef6cfd29aefdd. El primer CI del PR #15 no pudo ejecutar integration-tests por falta de entorno; ese requisito se cambia ahora por decisión del equipo, sin simular resultados reales.

La auditoría inicial revisó estructura, ramas y módulos; conservó las cuatro suites Node y añadió Jest compatible con Expo SDK 57/RN 0.86.3. Su verificación inicial era parcial; este ajuste ejecutó completas las suites automáticas.

En la auditoría inicial la integración GitHub no tenía Administration (403 Resource not accessible by integration); la protección efectiva de main sigue siendo una operación separada del propietario. El YAML no impide por sí solo un merge o push sin protección. No se modifica protección en este ajuste.

La revisión previa de dependencias corrigió shell-quote 1.10.0 → 1.12.0 y reportó 67 avisos restantes; no se volvió a ejecutar npm audit ni se presenta ese dato histórico como un análisis de seguridad actual. Identidad, firma, credenciales y requisitos de EAS/Play siguen pendientes para una publicación futura.

El objetivo del PR es configurar el CI y preparar Android. La aprobación de sus pruebas automáticas no certifica backend/BD reales, funcionamiento en dispositivos ni disponibilidad pública en Play. No se modificó el repositorio RubiRamos.
