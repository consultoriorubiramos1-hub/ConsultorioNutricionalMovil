# Bloque 03 de persistencia y cuentas ficticias

Fecha de registro: 2 de noviembre de 2026. Se recibieron cinco capturas y el
mensaje **«ya»** como respuesta al [recorrido del bloque 03](../../../pruebas-bloque-03.md).
Los retornos y el nuevo acceso se registran conforme a los pasos indicados y esa
confirmacion; las capturas muestran los estados finales. Las imagenes originales
se conservan en el informe Word privado. Este registro publico contiene resultados.

Entorno indicado: Android Emulator Medium Phone API 35, x86_64, Expo Go y API local
Docker. El commit efectivo del cliente y nombre del ejecutor siguen pendientes de
registrar. El reloj de Android no se utiliza como hora local verificada.

## Resultados

| Captura | Referencia | Observacion y resultado |
|---|---|---|
| 1 | CP06-E | Datos de A conserva Segundo nombre validacion y encabezado Prueba validacion Paciente A tras el paso de salir y volver a Perfil. Aprobada. |
| 2 | CP06-F | Dialogo Cuenta actualizada con Los datos de tu cuenta se actualizaron correctamente. Aprobado el cambio valido de Cuenta. |
| 3 | CP06-G | Cuenta de A muestra dast_patient_a y correo modificado tras el paso de nuevo acceso. Se ve el sufijo patient_a.validado@example.test; no se transcribe una direccion completa cuyo inicio no se aprecia entero. Aprobada la conservacion del cambio. |
| 4 | CP06-H | Dialogo Sin cambios con No hay cambios pendientes por guardar. Aprobada la distincion del guardado sin modificaciones. |
| 5 | CP19-A y CP09 parcial | La imagen corresponde a Inicio de Prueba Paciente B, no a su Perfil. Peso e IMC sin datos, mensajes de insuficiencia y sin plan alimenticio activo. Aprobado ese estado visible; Perfil B y resto de los casos pendientes. |

**CP06 aprobado en desarrollo**, junto con consulta y validaciones del
[bloque 02](bloque-02-resultados.md). La quinta imagen no se utiliza para afirmar
que se consulto el formulario Perfil de B ni para acreditar el aislamiento de
todos los modulos. Inicio B aporta una variante parcial de CP09 y CP19.

## Conteo de casos

| Grupo | Total | Completos | Por cerrar |
|---|---:|---:|---:|
| CP01 a CP20 del plan original | 20 | 4 | 16 |
| CP21 a CP26 ligados al instrumento | 6 | 0 | 6 |
| CP27 a CP30 propuestos para regresion y distribucion | 4 | 0 | 4 |
| Matriz ampliada | 30 | 4 | 26 |

Completos originales: CP01, CP04, CP05 y CP06. De los 16 originales por cerrar,
CP02, CP09 y CP19 estan parciales y otros 13 no ejecutados. Cada caso puede
requerir varias comprobaciones; cinco capturas no equivalen siempre a cinco
casos completos. El instrumento no fija una cuota de treinta casos.

SN01 y SN02 conservan su seguimiento tecnico separado en la guia. Las suites
unitarias, HTTP, SAST y DAST no se suman como aprobaciones manuales. Las evidencias
de Release mantienen su etapa posterior sobre el AAB del disparador automatico.

La disponibilidad del perfil esta acreditada en ese entorno; las mediciones y
planes ficticios aun requieren preparacion. El [bloque 04](../../../pruebas-bloque-04.md)
continua con Perfil B y formularios ARCO, sin enviar correos.
