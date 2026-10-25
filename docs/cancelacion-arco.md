# Solicitud ARCO de Cancelación

Acceso: **Mi perfil → Seguridad → Privacidad y derechos ARCO → Solicitar cancelación de datos personales**. Se conservan las pestañas Datos, Cuenta y Seguridad y el formulario de contraseñas.

## Medio de presentación y configuración

No se encontró un servicio o contrato de API ARCO en este repositorio; tampoco contiene las fuentes del backend. Se utiliza `mailto:` mediante `expo-linking`, que ya estaba instalado. La configuración `CORREO_PRIVACIDAD` en `src/modules/perfil/config/privacidad.ts` contiene **contacto@rubinutricion.com**, tomado del apartado 7, Derechos ARCO, del aviso de privacidad existente (`src/modules/auth/content/legal-documents.ts`). No se inventaron endpoints ni destinatarios.

No falta configurar un correo para preparar la solicitud. Esto no verifica la operación del buzón ni su entrega: el consultorio debe mantener disponible el medio publicado. Si se retira el correo de la configuración (valor `null`) o es inválido, el formulario muestra qué falta y deshabilita la solicitud. No requiere variables, permisos nativos ni dependencias adicionales.

El paciente confirma su intención y se abre su aplicación de correo con destinatario, asunto y mensaje preparados. **Debe revisar y pulsar Enviar en esa aplicación.** Abrirla no confirma que haya enviado el mensaje, ni que el consultorio lo haya recibido. No se registra un folio ni se muestra éxito de envío/recepción. Si no puede abrirse el correo, se muestran instrucciones para configurar una aplicación y el destinatario oficial como alternativa manual. El servicio intenta abrir la URL directamente y captura el rechazo; evita depender de consultas de esquemas que pueden fallar por restricciones de visibilidad de aplicaciones. Véase [Linking para SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/linking/).

## Datos y arquitectura

- `perfil-view.tsx` incorpora la tarjeta únicamente en Seguridad y entrega el perfil ya cargado.
- `privacidad-arco.tsx` y `cancelacion-datos-modal.tsx` presentan la sección y el formulario. Reutilizan AppCard, AppText, AppButton, AppScreen y PerfilField, con desplazamiento, áreas seguras y ajuste al teclado.
- `use-cancelacion-viewmodel.ts` administra motivo, confirmación, apertura, errores y avisos. Bloquea confirmaciones y aperturas duplicadas. Cerrar descarta el borrador; no se guarda en almacenamiento.
- `cancelacion.model.ts` define únicamente nombre, correo de contacto y motivo.
- `cancelacion-adapter.ts` toma explícitamente nombre y correo del perfil y codifica asunto y cuerpo como parámetros separados. No utiliza formularios con cambios sin guardar ni copia el perfil completo. Un motivo vacío significa todos los datos que legalmente proceda cancelar. Si falta correo del paciente, lo indica sin inventarlo; si falta nombre completo, bloquea la preparación hasta recargar el perfil.
- `cancelacion-service.ts` abre el correo sin consultar la sesión ni llamar a la API. No adjunta expedientes, datos clínicos, teléfonos, fechas de nacimiento, contraseñas ni tokens. El formulario recuerda al paciente que no incluya información sensible en el motivo.

La solicitud no cambia el estado Activo/Inactivo, no cierra sesión ni elimina datos. El consultorio recibe el mensaje, verifica identidad, evalúa procedencia y comunica la resolución. Una eventual desactivación por el administrador y las obligaciones de conservación quedan fuera de este flujo. El estado Inactivo por sí solo no representa la cancelación legal completa. No se implementa Oposición.

## Verificación

`tests/unit/cancelacion.test.ts` cubre configuración existente, datos permitidos, codificación del mensaje, motivo/correo ausentes, bloqueo por falta de configuración o nombre y errores del sistema al abrir correo.

`tests/unit/cancelacion-ui.test.ts` recorre Perfil/Seguridad, verifica las tres pestañas, precarga, escritura, confirmación, cancelación y descarte con Atrás/cierre, preservación de contraseñas, ausencia de modificaciones al perfil/sesión, errores y reintentos, aperturas duplicadas y avisos sin éxito falso. Ejecuta el flujo con `Platform.OS` simulado para Android e iOS y `Linking.openURL` simulado: **no prueba aplicaciones de correo ni dispositivos reales y no envía mensajes**.

Comandos: `npm run typecheck`, `npm run lint`, `npm test`.

Resultado de esta implementación: TypeScript y ESLint sin errores ni advertencias; verificación de configuración aprobada; `npm test` aprobó 259 pruebas unitarias Jest (incluidas las 20 nuevas de Cancelación), 67 pruebas originales Node y 9 de integración con transporte simulado. No se enviaron correos ni se verificó recepción del buzón. La validación en dispositivos reales sigue pendiente.

Antes de distribuir, verificar manualmente en Android e iOS:

1. Abrir Seguridad y la solicitud en pantalla pequeña y con tamaño de texto ampliado; revisar desplazamiento y teclado en el motivo.
2. Comprobar nombre/correo del perfil, escribir el motivo y cancelar la confirmación; no debe abrirse correo ni cambiar la cuenta.
3. Confirmar y comprobar destinatario, acentos, saltos de línea, asunto y motivo en la aplicación de correo. La app debe explicar que hace falta pulsar Enviar, sin afirmar recepción.
4. Regresar sin enviar; la cuenta debe seguir activa y no debe mostrarse una recepción confirmada.
5. Probar sin una aplicación de correo configurada y reintentar después de configurarla. En simuladores/emuladores puede faltar una aplicación capaz de atender `mailto:`.
6. Verificar por el procedimiento del consultorio que el buzón recibe una solicitud enviada voluntariamente y que la resolución se comunica al paciente. Esa recepción externa no se puede inferir de `openURL`.
