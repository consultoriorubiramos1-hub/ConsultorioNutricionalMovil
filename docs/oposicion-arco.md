# Solicitud ARCO de Oposición

## Objetivo y ubicación

El paciente puede solicitar que el consultorio deje de utilizar sus datos personales para un tratamiento o finalidad específica cuando exista una causa legal que lo justifique. El consultorio revisa su procedencia; presentar la solicitud no implica su aceptación automática.

Acceso: **Mi perfil → Seguridad → Privacidad y derechos ARCO → Solicitar oposición al tratamiento de datos**. El botón se encuentra debajo de **Solicitar cancelación de datos personales** y utiliza los mismos componentes, colores, tipografía y espaciado. Se conservan las pestañas Datos, Cuenta y Seguridad y el formulario de contraseñas. Los modales son independientes y solo puede haber uno abierto a la vez.

## Formulario

| Campo | Origen y validación |
|---|---|
| Nombre completo del paciente | Perfil guardado, solo lectura. Si no está disponible, se bloquea la preparación y se pide recargar el perfil. No se sustituye por el usuario de la cuenta. |
| Correo electrónico | Perfil guardado, solo lectura. Si falta, permanece vacío y el mensaje indica «No disponible en la cuenta.». |
| ¿A qué uso de tus datos deseas oponerte? | Texto obligatorio que describe la finalidad o tratamiento. Máximo 1000 caracteres. |
| Motivo de la oposición | Texto obligatorio con la razón de la solicitud. Máximo 1000 caracteres. |

Los campos obligatorios se validan después de quitar espacios iniciales y finales; solo espacios o saltos de línea no son una respuesta válida. El límite se aplica mediante `maxLength` en la interfaz y se verifica en el viewmodel y el servicio. No se presentan listas de promociones o publicidad como si fueran tratamientos existentes. Se recuerda no incluir datos médicos sensibles, contraseñas ni documentos.

El formulario incluye la descripción y el aviso de revisión solicitados. Usa AppScreen para desplazamiento y ajuste al teclado, PerfilField para los campos, AppCard para el aviso y AppButton para las acciones. Cerrar con X, Cerrar o Atrás descarta el borrador, que solo se mantiene en memoria mientras el modal está abierto.

## Flujo por correo

1. El paciente completa los dos campos y pulsa **Solicitar oposición**.
2. Se validan los datos y se muestra **¿Deseas presentar tu solicitud de oposición?**, con el aviso de que el consultorio revisará la solicitud sin modificar automáticamente la cuenta o los datos.
3. **Cancelar** o descartar la confirmación no abre correo y conserva el formulario. **Confirmar solicitud** prepara el mensaje con los valores validados al abrir la confirmación.
4. Se utiliza `expo-linking.openURL` con `mailto:`, igual que Cancelación. El destinatario se obtiene exclusivamente de `src/modules/perfil/config/privacidad.ts`: **contacto@rubinutricion.com**, ya publicado en el aviso de privacidad. Esa configuración no se modificó.
5. El paciente revisa el mensaje y **debe pulsar Enviar en su aplicación de correo**. La app explica este paso antes de abrir el correo y al regresar.

Asunto: **Solicitud de derecho ARCO - Oposición**.

El cuerpo contiene exclusivamente la petición de Oposición, nombre completo, correo registrado (si está disponible), tratamiento o finalidad descrita por el paciente, motivo y petición de revisión/resolución. El adapter selecciona esos campos explícitamente; no copia el perfil completo. No añade tokens, contraseñas, identificadores internos, teléfonos, fechas de nacimiento ni expedientes. El destinatario se codifica conservando `@` como separador de la dirección; asunto y cuerpo se codifican como parámetros independientes para mantener acentos y saltos de línea y evitar que el texto introduzca destinatarios o parámetros adicionales.

Si falta el correo oficial o su configuración es inválida, la acción se deshabilita y se muestra qué falta configurar. No requiere variables, dependencias nuevas ni cambios de configuración de Expo SDK 58.

## Límites de mailto y revisión del consultorio

- Abrir el correo **no confirma envío ni recepción**. No se muestra folio, aceptación ni éxito de envío/recepción.
- Si el sistema rechaza la apertura (por ejemplo, no hay una aplicación compatible o el usuario cancela la apertura), se muestra un error con instrucciones y el correo oficial como alternativa manual. El formulario conserva los datos para reintentar; no se exponen errores internos.
- La detección y el comportamiento dependen del sistema y de la aplicación de correo. No se consulta `canOpenURL`, para evitar depender de permisos de consulta de esquemas. Los clientes también pueden imponer sus propios límites de longitud. Referencia: [Expo Linking, SDK 58](https://docs.expo.dev/versions/v58.0.0/sdk/linking/).
- Se evitan confirmaciones y aperturas concurrentes por pulsaciones repetidas. Mientras el sistema abre el correo se bloquean edición y cierre. Después se puede preparar otra solicitud voluntariamente; la app no puede detectar mensajes enviados ni deduplicarlos en el buzón.
- El consultorio debe mantener disponible el correo publicado, recibir la solicitud, verificar identidad, analizar procedencia, comunicar la resolución y, cuando corresponda, aplicar las medidas en sus sistemas. Esta implementación no verifica la operación del buzón ni añade funciones administrativas.

No hay endpoints nuevos ni cambios al backend o PostgreSQL. La solicitud no cambia Activo/Inactivo, no elimina cuentas o expedientes, no suspende citas, no modifica planes y no bloquea el uso de la app.

## Arquitectura y archivos afectados

| Archivo | Responsabilidad |
|---|---|
| `src/modules/perfil/components/privacidad-arco.tsx` (modificado) | Añade la opción y administra un único modal abierto por tipo de solicitud. |
| `src/modules/perfil/components/oposicion-datos-modal.tsx` (nuevo) | Presentación del formulario de Oposición con el diseño de Cancelación. |
| `src/modules/perfil/models/oposicion.model.ts` (nuevo) | Modelo, formulario y límite de caracteres. |
| `src/modules/perfil/adapters/oposicion-adapter.ts` (nuevo) | Selección de datos del perfil y construcción del mensaje codificado. |
| `src/modules/perfil/utils/oposicion-form.ts` (nuevo) | Validación de campos obligatorios y longitud. |
| `src/modules/perfil/viewmodels/use-oposicion-viewmodel.ts` (nuevo) | Estado de los campos, textos de confirmación y adaptación de la solicitud. |
| `src/modules/perfil/services/oposicion-service.ts` (nuevo) | Valida antes de preparar el correo de Oposición. |
| `src/modules/perfil/viewmodels/use-solicitud-arco-viewmodel.ts` (nuevo) | Confirmación, snapshot de datos, bloqueo de pulsaciones, errores, avisos y anulación de callbacks al cerrar, compartidos por ambos derechos. |
| `src/modules/perfil/services/correo-arco-service.ts` (nuevo) | Correo oficial, apertura con expo-linking y errores compartidos. |
| `src/modules/perfil/viewmodels/use-cancelacion-viewmodel.ts` (modificado) | Delega el flujo común conservando motivo, interfaz pública y textos existentes. |
| `src/modules/perfil/services/cancelacion-service.ts` (modificado) | Delega la apertura común conservando el mensaje, validaciones y errores existentes. |
| `tests/unit/oposicion.test.ts` (nuevo) | Pruebas de adapter, validación y servicio. |
| `tests/unit/oposicion-ui.test.ts` (nuevo) | Pruebas de interfaz e independencia entre solicitudes. |
| `docs/oposicion-arco.md` (nuevo) | Funcionamiento, límites y validación de esta implementación. |
| `docs/cancelacion-arco.md` (modificado) | Enlace al nuevo flujo independiente de Oposición. |

El modal, el modelo, el adapter y las pruebas existentes de Cancelación permanecen intactos. No se modifican PerfilView, el formulario de seguridad, la recuperación de contraseña, los documentos legales ni la configuración del correo o del SDK.

## Verificación

Las pruebas nuevas cubren campos vacíos/espacios y límites; precarga de datos; destinatario y mensaje exactos; acentos, saltos de línea y caracteres especiales; lista de datos permitidos; ausencia de modificaciones al perfil/sesión; confirmación/cancelación/descarte; cierre y limpieza del borrador; bloqueo de aperturas repetidas; errores y reintentos; falta de correo oficial, nombre o correo del paciente; avisos sin falso éxito y conservación de las tres pestañas y del formulario de Cancelación.

Los recorridos de Android e iOS usan `Platform.OS` y apertura de correo simulados. No envían mensajes, no prueban apps de correo reales ni confirman recepción. Antes de distribuir, comprobar en dispositivos de ambas plataformas el desplazamiento y teclado, los campos de solo lectura, destinatario/asunto/cuerpo, regresar sin enviar, cancelación, errores sin una aplicación compatible y conservación de la cuenta activa. La recepción del buzón se verifica por el procedimiento del consultorio, con una solicitud enviada voluntariamente.

Comandos de validación: `npm run typecheck`, `npm run lint`, `npm test`, `npx expo-doctor@latest`.

Resultados de esta implementación:

| Comprobación | Resultado |
|---|---|
| TypeScript | Aprobado, sin errores. |
| ESLint | Aprobado, sin errores ni advertencias. |
| Unidades Jest | 294/294 en 19 suites: incluye 35 pruebas nuevas de Oposición (18 unitarias y 17 de interfaz) y las 20 existentes de Cancelación, sin modificar estas últimas. |
| Pruebas originales Node | 67/67. |
| Integración con transporte simulado | 9/9; no representa conexión real con backend o PostgreSQL. |
| Expo Doctor | 20/20 comprobaciones, sin problemas detectados. |
| `git diff --check` | Sin errores de espacios. |

Se trabajó en `feature/oposicion-arco`, sin commits ni pushes. La apertura y recepción reales del correo y la revisión visual en dispositivos Android/iOS quedan pendientes de la comprobación manual descrita arriba.
