# Protección de main y autorizaciones

## Estado observado

Repositorio privado, cuenta conectada con rol admin. Durante la preparación inicial, main/develop devolvían protected:false y GET /branches/main/protection respondió **403 Resource not accessible by integration**. Durante el ajuste del PR #15, main ya devuelve **protected:true**, con el mismo commit e248d68cc8d7fdeab96e3de32f7ef6cfd29aefdd.

El indicador protected:true confirma que GitHub identifica protección activa, pero no verifica qué checks, revisiones o restricciones contiene. No se consultó el detalle de esas reglas en este ajuste ni se modificó main o su protección. El propietario debe verificar los puntos siguientes, conservando ci-required como check obligatorio. No se determinó el plan contratado ni se cambió la visibilidad.

## Procedimiento del propietario

Settings → Branches → Add branch protection rule, patrón exacto main:

- Require a pull request before merging y al menos una aprobación del otro integrante.
- Dismiss stale approvals y Require approval of the most recent reviewable push.
- Require status checks, seleccionar **ci-required**.
- Require branches to be up to date y resolución de conversaciones.
- Do not allow bypassing, incluyendo administradores.
- No permitir force pushes ni eliminaciones.

PR obligatorio sin bypass bloquea pushes directos ordinarios. La opción adicional de restringir actores de push depende de repositorios de organización; este repositorio pertenece a una cuenta personal, por lo que no se inventó una lista de actores de organización.

Si el selector aún no muestra ci-required, observar el PR #15 hacia **develop** con este workflow o utilizar la API siguiente. No abrir un PR de liberación hacia main solo para registrar el check. ci-required exige branch-policy, typecheck, lint, unit-tests e integration-mock; falla si cualquiera falla, se cancela o se omite. No requiere integración real ni BD.

.github/main-protection.json contiene el payload real y scripts/protect-main.cjs lo aplica y comprueba con GET posterior. Preparar un token fino de corta duración con **Administration:write exclusivamente en este repositorio** en la variable de sesión GH_ADMIN_TOKEN, sin imprimirlo o versionarlo:

```bash
node scripts/protect-main.cjs
```

**El script no fue ejecutado en esta tarea.** El archivo preparado no equivale a protección activa. Si GitHub devuelve una limitación del plan, conservar su mensaje exacto y documentar revisión manual de dos personas, sabiendo que no existe bloqueo técnico garantizado. No cambiar la visibilidad. [Disponibilidad oficial de protección](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches).

## Environments

El CI automático no requiere un environment integration-test ni Secrets del backend. Las pruebas reales se conservan únicamente para ejecución manual opcional. Para una liberación futura crear android-internal y android-production. Cuando el plan lo permita, configurar al otro integrante como required reviewer y prevent self-review. Para Android permitir solo main y bloquear bypass.

No se crearon/verificaron esos environments, Secrets ni sus reglas. En repositorios privados la disponibilidad depende del plan y de cada función. Consultar [la documentación oficial](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments).

Mantener ANDROID_RELEASE_ENABLED=false y RELEASE_APPROVALS_CONFIGURED=false hasta comprobar las autorizaciones. Un true no crea reglas ni sustituye aprobación. Si el plan no permite controles suficientes, no habilitar los workflows; completar autorización manual documentada cuando se solicite publicar.
