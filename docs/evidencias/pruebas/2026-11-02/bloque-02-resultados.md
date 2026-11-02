# Bloque 02 de pruebas de Perfil

Fecha de registro: 2 de noviembre de 2026. Se recibieron las cinco capturas del
[bloque 02](../../../pruebas-bloque-02.md) y la confirmacion del operador
**«si aparecio el aviso de guardado»**. Las imagenes originales se conservan en el
informe Word privado del bloque; este registro publico incluye solo resultados.

Entorno indicado: Android Emulator Medium Phone API 35, x86_64, Expo Go en
desarrollo y API local Docker. La preparacion previa [PREP-03](prep-03-perfiles.md)
tiene 5/5 comprobaciones HTTP aprobadas. El commit efectivo del cliente y nombre
del ejecutor siguen pendientes de registrar. El reloj del emulador no se usa
como hora local verificada.

## Resultados recibidos

| Captura | Variante | Resultado observado | Estado |
|---|---|---|---|
| 1 | CP06-A, consultar Datos | Prueba Paciente A, Segundo nombre vacio, fecha 15/01/2000 y telefono ficticio 0000000000; sin aviso de paciente no encontrado. | Aprobada. |
| 2 | CP06-B, consultar Cuenta | Usuario dast_patient_a y correo dast_patient_a@example.test; identidad ficticia A en el encabezado. | Aprobada. |
| 3 | CP06-C, fecha invalida | Se introdujo 31/02/2000. Dialogo «No se pudo guardar» con «La fecha de nacimiento debe tener el formato DD/MM/AAAA.». | Aprobada para el rechazo de esa fecha. |
| 4 | CP06-D, correo invalido | Campo correo-invalido. Dialogo «No se pudo guardar» con «Ingresa un correo electrónico válido.». | Aprobada para esa validacion. |
| 5 | CP06-E, guardar Datos y persistencia | Segundo nombre «validacion» en minusculas y encabezado «Prueba validacion Paciente A». El operador confirma la aparicion del aviso de guardado. | Guardado visible acreditado; variante parcial hasta comprobar el regreso a Perfil. |

La mayuscula inicial del valor sugerido no cambia el resultado: se registra el
valor real `validacion`. La captura final acredita el campo y encabezado
actualizados; no permite distinguir por si sola si se tomo antes o despues de
salir de Perfil. La confirmacion recibida corresponde expresamente al aviso de
guardado, por lo que la reentrada se comprobara en el siguiente bloque.

La edad visible de 26 años coincide con la fecha ficticia de A para la fecha del
registro. En el caso de fecha invalida se conserva el texto exacto del aviso, sin
atribuirle un mensaje mas especifico que el observado.

## Estado de CP06 y de la incidencia

**CP06 parcial.** Consulta de Datos/Cuenta y las dos validaciones negativas
aprobadas. El cambio de Segundo nombre tiene confirmacion del aviso y resultado
visible. Faltan la reentrada, el cambio valido de Cuenta y su consulta posterior.

INC-ENT-01 queda atendida para la disponibilidad HTTP y carga visual del perfil A.
Los recorridos de mediciones, planes y otros datos conservan su preparacion y
verificacion pendientes. Estas capturas no cierran esos alcances.

CP01, CP04 y CP05 conservan su aprobacion en desarrollo. CP02 y CP06 estan
parciales; los otros quince casos originales siguen sin acreditarse como
completados. No se atribuyen a este bloque resultados Release ni una nueva
ejecucion SAST/DAST.

El [bloque 03](../../../pruebas-bloque-03.md) permite continuar con cinco capturas
sin reconstruir la API ni repetir el sembrado mientras siga activo el entorno.

**Seguimiento posterior:** el [resultado del bloque 03](bloque-03-resultados.md)
completo las variantes pendientes y aprobo CP06 en desarrollo. La condicion
parcial anterior corresponde al momento de recepcion del bloque 02.
