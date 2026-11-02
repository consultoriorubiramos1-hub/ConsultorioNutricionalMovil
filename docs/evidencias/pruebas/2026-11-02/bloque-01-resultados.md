# Bloque 01: documentos, recuperacion inicial, login y logout

Evidencia recibida el **2 de noviembre de 2026**. El operador envio las cinco capturas solicitadas e indico **«todas funcionaron»**. Esa declaracion se registra como confirmacion de los pasos y retornos indicados en el [bloque de instrucciones](../../../pruebas-bloque-01.md); los detalles visibles de cada imagen se distinguen a continuacion.

Modalidad indicada: desarrollo en Expo Go y Android Emulator, perfil Medium Phone API 35, x86_64. El commit exacto del cliente y la version de Expo Go siguen pendientes de confirmacion: no se incluyo la salida de `git log` en este envio. El reloj del emulador no se utiliza como hora local verificada. No es evidencia Release.

Las cinco capturas originales se conservan en el informe Word privado del bloque. Este registro publico incluye solo resultados; las imagenes no se adjuntan al repositorio.

## Resultado por comprobacion

| Captura | Referencia | Evidencia visual | Confirmacion del operador y resultado |
|---|---|---|---|
| 1 | CP05-A: Aviso de Privacidad | Titulo, apartados finales 9 y 10, fechas y boton Entendido visibles; texto legible. | Reporta funcionamiento de los pasos, incluido recorrido y cierre. Aprobado para consulta y retorno. |
| 2 | CP05-B: Terminos y condiciones | Titulo, apartados finales 8 a 10, fechas y boton Entendido visibles; texto legible. | Reporta funcionamiento de los pasos, incluido recorrido y cierre con Atras. Aprobado para consulta y retorno. |
| 3 | CP02-A: usuario vacio en recuperacion | Campo Usuario vacio y mensaje `Ingresa tu usuario.`; permanece en Recuperar contraseña. | Aprobado para esa validacion inicial. CP02 completo permanece parcial. |
| 4 | CP01-D: credenciales correctas | Se abrio Inicio, con saludo, menu y accesos de la app. Aparecen ademas avisos de carga de informacion. | El operador confirma el acceso. Aprobado para autenticacion y entrada a Inicio; la carga de datos se registra como incidencia separada. |
| 5 | CP04: cierre de sesion y acceso posterior | Login con campos vacios, sin datos personales visibles. | Reporta funcionamiento de los pasos del bloque, incluido intento de volver con Atras/reapertura. Aprobado para el recorrido funcional; el almacenamiento nativo tiene verificacion separada. |

Las capturas 1 y 2 muestran el final de los documentos, no cada pagina ni la accion de cerrarlos. El desplazamiento completo y retorno se sustentan en la confirmacion del operador, ademas de las imagenes. La captura 5 muestra el estado final; no es una grabacion de la pulsacion Atras.

## Evidencias

### 1. CP05-A: Aviso de Privacidad

**Evidencia visual:** captura 1 del informe Word privado.

Se acredita lectura/navegacion del documento en esta modalidad. No acredita por si sola consentimiento Opt-In ni cumplimiento juridico integral.

### 2. CP05-B: Terminos y condiciones

**Evidencia visual:** captura 2 del informe Word privado.

CP05 queda aprobado para las dos consultas, legibilidad, desplazamiento y retornos comprobados. El contenido legal conserva su propia revision y alcance.

### 3. CP02-A: recuperacion con usuario vacio

**Evidencia visual:** captura 3 del informe Word privado.

No se acredito envio/recepcion de correo, codigo correcto/incorrecto, token de recuperacion, contraseña debil, confirmacion distinta ni cambio exitoso. Esas variantes de CP02 permanecen no ejecutadas.

### 4. CP01-D: entrada a Inicio con la cuenta sintetica

**Evidencia visual:** captura 4 del informe Word privado.

La pantalla de Inicio, junto con la confirmacion del operador, completa la variante de acceso valido. Con las capturas A, B y C previas, CP01 queda aprobado para las entradas y respuestas de su formulario. No se utiliza esta imagen para aprobar la carga de perfil, plan o progreso.

### 5. CP04: estado final tras cerrar sesion

**Evidencia visual:** captura 5 del informe Word privado.

El operador confirma el recorrido de cierre y comprobacion posterior solicitado. La inspeccion del cifrado o eliminacion fisica del token en el almacenamiento del dispositivo no se acredita con una imagen de Login.

## INC-ENT-01: preparacion pendiente del paciente de pruebas

La captura 4 muestra estos mensajes:

- `No se pudo cargar toda la información`.
- `Mi progreso nutricional: Paciente no encontrado.`
- `Plan alimenticio: No se pudo encontrar tu plan alimenticio. Inténtalo nuevamente.`

**Estado:** abierta, bloquea la preparacion de los siguientes recorridos de datos. **Contexto confirmado:** `seed-auth.cjs` prepara cuatro usuarios/roles de autenticacion y no crea pacientes, mediciones ni planes. Por tanto, la cuenta autenticada no basta para acreditar esos modulos.

Antes de sembrar el paciente se debe verificar la estructura local de `tblpatients` y la configuracion de conexion usada por los servicios del backend. La revision del codigo de referencia muestra que algunos servicios utilizan `POSTGRES_URL`, mientras el Compose base configura `DATABASE_URL`; aun no se ha recibido una comprobacion de esas variables dentro del contenedor del operador. No se atribuye toda la incidencia a una sola causa sin esa comprobacion.

**Accion pendiente:** inspeccion de metadatos/configuracion local y preparacion de perfiles ficticios exclusivamente en la base aislada. No aprobar CP06/CP09 ni crear datos sobre pacientes reales para resolver este bloqueo. Los casos que requieren planes, mediciones o correo conservan sus prerrequisitos especificos.

## Estado acumulado del plan

- **CP01 aprobado:** campos vacios, contraseña vacia, credenciales incorrectas y correctas.
- **CP04 aprobado:** recorrido funcional de cierre y acceso posterior, con captura y confirmacion del operador.
- **CP05 aprobado:** ambos documentos y retornos, con capturas y confirmacion del operador.
- **CP02 parcial:** validacion de usuario vacio aprobada; recuperacion completa pendiente.
- Los otros dieciseis casos CP01-CP20 siguen no ejecutados. Las pruebas complementarias y Release mantienen sus estados separados.
