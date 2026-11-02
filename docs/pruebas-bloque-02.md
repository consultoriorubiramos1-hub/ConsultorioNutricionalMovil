# Bloque 02: perfil, cinco comprobaciones

Preparacion HTTP completada: [PREP-03, 5/5 aprobadas](evidencias/pruebas/2026-11-02/prep-03-perfiles.md),
segun salida real del operador del 2 de noviembre de 2026. Se puede iniciar el
bloque manual; no es necesario repetir la reconstruccion o el sembrado mientras
se conserve el mismo entorno activo.

**Estado: no ejecutado.** Estas comprobaciones corresponden a variantes de CP06;
no equivalen a cinco casos originales completos. La aprobacion se registra cuando
se reciben sus resultados y capturas. CP06 seguira parcial si falta el cambio
valido de Cuenta u otra variante de su alcance.

## Preparacion necesaria

Actualizar la rama movil `feature/seguridad-sast-dast` y la rama del backend
`feature/seguridad-dependencias-web`. Conservar `tools/dast/.local/config.env`, el
esquema y los contenedores actuales. Desde el repositorio movil:

```powershell
node .\tools\dast\rebuild-api.cjs --emulator

if ($LASTEXITCODE -eq 0) {
    docker compose --env-file tools/dast/.local/config.env -f tools/dast/compose.yml -f tools/dast/compose-emulator.yml exec -T api node dast-tools/seed-profiles.cjs
    if ($LASTEXITCODE -eq 0) {
        docker compose --env-file tools/dast/.local/config.env -f tools/dast/compose.yml -f tools/dast/compose-emulator.yml exec -T api node dast-tools/check-profiles.cjs
    }
}
```

Se requiere terminar con cinco resultados HTTP/contrato aprobados. El sembrado
crea exclusivamente dos perfiles ficticios para las cuentas existentes. Su
repeticion conserva los campos editados. No crea mediciones ni planes, por lo que
los recorridos de esos datos se preparan en otro bloque.

El perfil A inicial tiene nombre `Prueba`, apellidos `Paciente A`, segundo nombre
vacio, fecha de nacimiento `15/01/2000`, telefono ficticio `0000000000` y cuenta
`dast_patient_a@example.test`. La clave sigue siendo la de fixtures, sin publicarla.

## Cinco capturas solicitadas tras aprobar la preparacion

Iniciar sesion con `dast_patient_a`. Mantener Docker y Metro abiertos.

| Captura | Variante | Pasos | Resultado esperado |
|---|---|---|---|
| 1 | CP06-A, consultar Datos | Abrir menu, Perfil y pestaña Datos. | Cargan los datos ficticios de A sin aviso de paciente no encontrado. Capturar los campos. |
| 2 | CP06-B, consultar Cuenta | Cambiar a Cuenta. | Usuario `dast_patient_a` y correo ficticio de A. Capturar la pestaña. |
| 3 | CP06-C, fecha invalida | En Datos, escribir `31/02/2000` y pulsar Guardar cambios. | Aviso de fecha no valida; no confirma guardado. Capturar el aviso. Cerrarlo y restaurar `15/01/2000`. |
| 4 | CP06-D, correo invalido | En Cuenta, escribir `correo-invalido` y pulsar Guardar cambios. | Aviso `Ingresa un correo electrónico válido.`; no confirma guardado. Capturarlo y restaurar el correo ficticio inicial. |
| 5 | CP06-E, guardar Datos y persistencia | En Datos, cambiar Segundo nombre a `Validacion`, guardar y confirmar el aviso. Salir de Perfil y volver a abrirlo. | El segundo nombre sigue siendo `Validacion`. Capturar el formulario recargado y confirmar que aparecio el aviso de datos actualizados. |

Si Segundo nombre ya dice `Validacion` por una ejecucion anterior, cambiar a
`Revalidacion` para que exista una modificacion real. No cambiar usuario ni clave
en este bloque. Informar los retornos, avisos y cualquier fallo aunque la captura
muestre solo el estado final. Usar exclusivamente las cuentas sinteticas.

La apertura de Inicio no aprueba aun carga de medidas o planes. Estos perfiles
permiten comenzar CP06; no cierran por si solos INC-ENT-01 ni aprueban CP09.
