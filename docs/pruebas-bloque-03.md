# Bloque 03 de persistencia y cuentas de prueba

**Estado: no ejecutado.** Continuan variantes de CP06 y una comprobacion parcial
de CP19. Los resultados se registraran al recibir las capturas y confirmaciones.

El [bloque 02](evidencias/pruebas/2026-11-02/bloque-02-resultados.md) mostro el
segundo nombre `validacion` y se confirmo el aviso de guardado. Mantener Docker
y Metro abiertos. No reconstruir ni repetir el sembrado para este bloque.
Utilizar las cuentas ficticias A y B con su misma contraseña de fixtures.

| Captura | Referencia | Pasos | Resultado esperado |
|---|---|---|---|
| 1 | CP06-E, completar persistencia de Datos | Con A, salir de Perfil a Inicio y volver a Perfil y Datos. | Segundo nombre sigue como validacion. Capturar el formulario despues de regresar. |
| 2 | CP06-F, cambio valido de Cuenta | En Cuenta de A, cambiar el correo a dast_patient_a.validado@example.test y guardar. | Aparece Cuenta actualizada. Capturar el aviso. No cambiar el nombre de usuario ni la contraseña. |
| 3 | CP06-G, persistencia de Cuenta | Cerrar sesion y volver a entrar con dast_patient_a; abrir Perfil y Cuenta. | Se conserva dast_patient_a.validado@example.test. Capturar Cuenta despues del nuevo acceso. |
| 4 | CP06-H, guardar sin cambios | Sin modificar los campos de Cuenta de A, pulsar Guardar cambios. | Aparece Sin cambios y el mensaje de que no hay cambios pendientes. Capturar el aviso. |
| 5 | CP19-A, perfil de la otra cuenta | Cerrar sesion de A, entrar con dast_patient_b y abrir Perfil y Datos. | Se muestra Prueba Paciente B con Segundo nombre vacio, fecha 20/02/2001 y telefono ficticio 0000000001; no aparece el cambio validacion de A. Capturar el perfil B. |

Si la persistencia o el guardado fallan, conservar la captura del resultado real
y describir el paso; no reemplazarla por una imagen de un estado esperado.
El cambio de correo actualiza un dato ficticio y no solicita un envio de correo.

La comprobacion B no acredita por si sola el aislamiento de todos los modulos ni
los otros requisitos de CP19. El guardado sin cambios es una variante adicional
del bloque y no un caso nuevo atribuido al documento original.
