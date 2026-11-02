# Bloque 04 de perfil B y formularios ARCO

**Estado: cinco comprobaciones aprobadas por confirmacion del ejecutor.** El
[registro del bloque 04](evidencias/pruebas/2026-11-02/bloque-04-resultados.md)
incorpora Perfil B, cancelacion y validaciones de oposicion, con cuatro capturas
de apoyo. CP07 queda aprobado en su recorrido funcional. La tabla siguiente
conserva las instrucciones de la ejecucion.

| Captura | Referencia | Pasos y resultado esperado |
|---|---|---|
| 1 | CP19-A, Perfil B | Abrir Menu, Perfil y Datos. Capturar Prueba Paciente B, Segundo nombre vacio, fecha 20/02/2001 y telefono ficticio 0000000001; no debe aparecer validacion de A. |
| 2 | CP07-A, motivo vacio | En Perfil, Seguridad, bajar a Privacidad y derechos ARCO. Abrir Solicitar cancelacion de datos personales. Dejar Motivo vacio y pulsar Solicitar cancelacion. En el dialogo, Confirmar solicitud debe abrir la aplicacion de correo. Capturar el mensaje preparado o el impedimento que muestre Android. Volver y descartar la redaccion sin enviarla. |
| 3 | CP07-B, motivo con texto | Repetir cancelacion con Motivo Prueba funcional con cuenta ficticia. Confirmar solicitud y capturar el mensaje preparado que incluye el motivo; descartar sin enviar. Si la captura 2 quedo bloqueada por falta de correo, capturar el formulario con ese motivo y cancelar el dialogo con Cancelar. |
| 4 | CP08-A, ambos campos vacios | Cerrar cancelacion y abrir Solicitar oposicion al tratamiento de datos. Dejar uso/tratamiento y motivo vacios, pulsar Solicitar oposicion. Capturar Indica a que uso de tus datos deseas oponerte. No debe abrir correo. |
| 5 | CP08-B, motivo vacio | Escribir Promociones de prueba en el campo sobre el uso de datos; dejar Motivo de la oposicion vacio y pulsar Solicitar oposicion. Capturar Explica el motivo de tu oposicion. No debe abrir correo. |

En las variantes de cancelacion, Confirmar solicitud prepara la redaccion en una
aplicacion externa; este bloque no incluye pulsar Enviar. No acredita eliminacion
de cuenta ni resolucion de una solicitud. Si Android pide configurar una cuenta o
no tiene aplicacion de correo compatible, capturar el aviso y cerrar; no hace
falta ingresar una cuenta personal para registrar el bloqueo del entorno.

Al volver de la redaccion, confirmar tambien que la cuenta sigue disponible. El
mensaje de la app sobre abrir correo no acredita envio ni recepcion. El fallo de
un prerrequisito externo deja pendiente esa variante; no se sustituye por un
aprobado. CP08 seguira parcial hasta comprobar tambien sus datos completos.
