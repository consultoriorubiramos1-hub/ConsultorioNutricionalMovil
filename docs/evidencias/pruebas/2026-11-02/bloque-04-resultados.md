# Bloque 04 de Perfil B y formularios ARCO

Fecha de registro: 2 de noviembre de 2026. **Estado del bloque: cinco
comprobaciones aprobadas por confirmacion del ejecutor.** El operador confirmo
**«si funciono todo yo ya lo probe»** respecto al recorrido indicado en el
[bloque 04](../../../pruebas-bloque-04.md). Se recibieron cuatro capturas de apoyo,
conservadas en el informe Word privado. Este registro publico incluye resultados.

Entorno indicado: Android Emulator Medium Phone API 35, x86_64, Expo Go y API local
Docker; cuenta ficticia dast_patient_b. La confirmacion del ejecutor sustenta los
pasos y resultados de las cinco comprobaciones; las imagenes documentan sus
estados visibles. No se atribuye a una imagen una accion o mensaje que no muestra.

## Comprobaciones aprobadas

| Referencia | Resultado registrado | Base de aprobacion |
|---|---|---|
| CP19-A, Perfil B | Perfil muestra Prueba Paciente B, Segundo nombre vacio, fecha 20/02/2001 y telefono ficticio 0000000001. | Captura de Datos y confirmacion del ejecutor. |
| CP07-A, cancelacion sin motivo | Funcionamiento de la variante de motivo vacio y apertura de correo. | Confirmacion del ejecutor; la captura muestra Gmail abierto. |
| CP07-B, cancelacion con motivo | Funcionamiento de la variante con motivo escrito y retorno sin envio. | Confirmacion del ejecutor sobre el recorrido completo. |
| CP08-A, oposicion con campos vacios | Funcionamiento de la validacion de uso de datos y motivo vacios. | Confirmacion del ejecutor y captura del formulario utilizado. |
| CP08-B, oposicion con motivo vacio | Funcionamiento de la validacion con uso de datos indicado y motivo vacio. | Confirmacion del ejecutor. La cuarta imagen documenta los controles del formulario. |

## Capturas de apoyo

1. Datos de la cuenta B, con edad visible de 25 años y datos ficticios propios.
2. Pantalla de bienvenida de Gmail, abierta desde el recorrido de cancelacion.
3. Formulario de oposicion con nombre y correo ficticio de B, aviso y campo de
   uso de datos.
4. Parte inferior del formulario de oposicion. En el estado de esa imagen,
   Promociones de prueba aparece en Motivo; la aprobacion de la variante de motivo
   vacio se sustenta en la confirmacion del ejecutor de que ya la probo.

La actividad de correo consiste en prepararlo y volver sin enviarlo, conforme al
plan. El bloque no acredita envio, recepcion, eliminacion de cuenta ni resolucion
de una solicitud ARCO.

## Avance del plan

CP07 queda aprobado para su recorrido funcional, por confirmacion del ejecutor.
Los casos originales completos son CP01, CP04, CP05, CP06 y CP07: **5 de 20**.
Quedan **15 casos por cerrar**: CP02, CP08, CP09 y CP19 parciales, y 11 no
ejecutados. CP08 conserva aprobadas las dos variantes negativas de este bloque;
su variante con datos completos se realiza en el seguimiento del caso. CP19
incorpora la consulta aprobada de Perfil B dentro de su alcance mas amplio.

La matriz ampliada conserva diez casos adicionales por cerrar, separados del
plan original: seis ligados al instrumento y cuatro propuestos. Su total
pendiente es 25. Los escaneos SAST/DAST y la evidencia Release mantienen sus
registros independientes.
