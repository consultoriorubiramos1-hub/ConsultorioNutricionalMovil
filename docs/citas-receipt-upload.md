# Diagnóstico y validación del comprobante de Citas

## Evidencia de la causa

- El proyecto declara e instala Expo `57.0.24`, React Native `0.86.3` y expo-file-system `57.0.7`.
- `git diff 89eea12 HEAD -- src/modules/citas/services src/modules/citas/adapters/receipt-adapter.ts` no muestra cambios. La implementación inicial de Citas y la actual usan el mismo descriptor `{ uri, name, type }` y el mismo SDK. Git no demuestra qué cambio de ejecución hizo que una instalación anterior funcionara; no se atribuye el fallo a una actualización de SDK inexistente en ese intervalo.
- `e419574` agregó la tarjeta bancaria, su configuración/modelo y su exposición en el viewmodel. `71906ba` agregó estilos e iconos al formulario. Ninguno cambió la selección del archivo, el adaptador ni el transporte del comprobante. `appointment-form.tsx` sigue pasando a `submitAppointment` el archivo elegido, y el viewmodel conserva fecha, horario y comprobante hasta obtener éxito.
- En Expo 57, `fetch` global en Android/iOS usa `expo/fetch`, salvo que se active explícitamente `EXPO_PUBLIC_USE_RN_FETCH`. Véase la [documentación del SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/expo/#expofetch-api). No se agregó ni activó esa excepción para corregir el problema.
- El código instalado `node_modules/expo/src/winter/fetch/convertFormData.ts` rechaza un objeto que solo tenga `uri`, `name` y `type`: lanza `Unsupported FormDataPart implementation`. Acepta Blob o partes con un método `bytes()`. `fetch.ts` espera esa conversión antes de llamar a `NativeRequest.start`.
- Antes de cambiar el servicio se ejecutó la nueva prueba con el normalizador real de Expo: el descriptor anterior fue rechazado y las dos pruebas del formulario actual (Android/iOS) fallaron con ese mismo error, sin llamadas HTTP. El `catch` del servicio convertía cualquier rechazo de `fetch`, incluida esa falla local de serialización, en «No se pudo conectar con el servidor».

Esta incompatibilidad explica que cargar horarios (GET sin archivo) y enviar desde web (Blob real) funcionen mientras falla el envío móvil. No demuestra por sí sola qué ocurrió en el teléfono reportado: para eso falta la validación del dispositivo y su versión instalada.

## Cambio aplicado

Solo se modifica código de producción en `src/modules/citas/services/citas-service.ts`:

- La parte nativa conserva la URI original, el nombre genérico `comprobante.jpg/png/webp` generado por el adaptador y su MIME validado. Ahora proporciona `bytes()` mediante `new File(uri).bytes()`, API de expo-file-system ya instalada. Así Expo puede serializar el contenido. El método no es enumerable: el `getParts()` del transporte opcional de React Native conserva el descriptor original sin pasar funciones al módulo nativo.
- La lectura es asíncrona, se realiza al serializar y no modifica, convierte, renombra ni copia el archivo. Se evita crear un Blob global de React Native desde un ArrayBuffer, operación que esa implementación no admite.
- Se mantiene el campo `receipt`, los otros campos del contrato, Bearer y el límite de 5 MB. No se fija `Content-Type` manualmente: Expo genera el boundary. El flujo web sigue usando su Blob original.
- Se diferencian construcción/serialización, lectura del archivo, rechazo del transporte, respuesta HTTP y respuesta no JSON. El estado HTTP se conserva. No se reintenta automáticamente un POST.

No se cambian `receipt-service.ts`, `receipt-adapter.ts`, `appointment-form.tsx`, `use-citas-viewmodel.ts`, estilos, datos bancarios, dependencias, configuración nativa, backend ni base de datos. La [documentación de FileSystem del SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/filesystem/#uploading-files-using-expofetch) describe el envío de archivos con Expo y FormData.

## Diagnósticos temporales y seguros

Desactivados por defecto y siempre desactivados en producción (`__DEV__ === false`). Para habilitarlos en una sesión de desarrollo, desde PowerShell en este proyecto:

```powershell
$env:EXPO_PUBLIC_RECEIPT_UPLOAD_DIAGNOSTICS = "1"
npx.cmd expo start --clear
```

La consola de desarrollo muestra `[citas:receipt]` con **solo** `stage`, `platform` y, cuando existe respuesta, `status`. No se imprimen tokens, headers, errores originales, URL, URI, nombre original, imagen, bytes, notas, fechas, horarios, datos bancarios ni cuerpos de respuesta.

| Evento | Interpretación |
| --- | --- |
| `form_data_ready` | El formulario se construyó; todavía no acredita lectura ni envío. |
| `request_started` | Se llamó a fetch; todavía puede fallar la serialización previa al HTTP. |
| `form_data_error` | Falló la validación/construcción o se reconoció un rechazo del serializador. |
| `file_read_error` | FileSystem no pudo leer los bytes al serializar; volver a seleccionar la imagen. |
| `transport_error` | fetch rechazó sin respuesta HTTP disponible, fuera de los fallos locales identificados. Puede ser conectividad, TLS u otro fallo del transporte; no prueba una caída del servidor. |
| `http_response` | Hay respuesta del servidor/proxy; `status` distingue 2xx, 401/403, 409, 413, 415, 422 o 5xx. |
| `invalid_response` | Llegó un estado HTTP pero el cuerpo no se pudo interpretar como JSON. |

Al terminar, detener Metro y quitar la opción antes de iniciarlo nuevamente:

```powershell
Remove-Item Env:EXPO_PUBLIC_RECEIPT_UPLOAD_DIAGNOSTICS -ErrorAction SilentlyContinue
npx.cmd expo start --clear
```

## Comprobación en Android real

1. Usar una cuenta de prueba y un PNG/JPG/WEBP sintético válido de menos de 5 MB, sin información personal ni bancaria. Usar una API de pruebas accesible desde el teléfono; `localhost` en Android es el propio teléfono. No hace falta realizar una transferencia para verificar el transporte con un comprobante sintético.
2. Iniciar Metro con los diagnósticos anteriores y abrir este código actualizado en un Android físico, con Expo Go compatible con SDK 57 o el development build compatible que utilice el proyecto. No basta con abrir un APK anterior. No se agregaron módulos nativos que obliguen a recompilar por este cambio.
3. En Citas, seleccionar una fecha futura y un horario disponible. Comprobar que aparece la tarjeta bancaria y que conserva el diseño. Elegir el archivo en el selector real y verificar la vista previa.
4. Pulsar una sola vez «Solicitar cita». Debe aparecer `form_data_ready`, `request_started` y `http_response` con estado 2xx, sin los eventos de error. Verificar el aviso de éxito y consultar de nuevo «Próximas citas».
5. Desde el sistema web, abrir la cita creada y comprobar que el comprobante asociado se puede visualizar y corresponde a la imagen sintética enviada. Un 2xx o una vista previa local por sí solos no prueban que se haya guardado el archivo correcto. No modificar directamente la BD.
6. Repetir con JPG, PNG y WEBP válidos en horarios distintos y con una imagen cercana al límite. Verificar que archivos de más de 5 MB se rechacen antes del envío. Probar también cambiar/quitar el comprobante y cancelar el selector. Evitar reintentar a ciegas tras perder una respuesta: consultar primero si se creó la cita.
7. Para comprobar el error de conectividad, cargar horarios y seleccionar archivo antes de desconectar el teléfono. El envío debe indicar conexión y registrar `transport_error`, sin inventar un estado HTTP. Reconectar y consultar las citas antes de volver a enviar.
8. Registrar commit/build, modelo del dispositivo, versión de Android, Expo Go/development build, formato probado, estados de diagnóstico y resultado de la verificación web. No adjuntar credenciales, comprobantes reales ni datos del paciente al reporte.

## Alcance de las pruebas automatizadas

`tests/unit/receipt-upload.test.ts` usa el FormData de React Native con el parche real de Expo y el normalizador/serializador instalado de Expo. Reproduce el rechazo del descriptor anterior y verifica bytes binarios intactos, campo `receipt`, nombre, MIME y boundary para Android/iOS y los tres MIME aceptados. Solo la lectura del archivo se sustituye por bytes sintéticos; las pruebas de clasificación usan respuestas/rechazos de fetch simulados. Comprueba también que los diagnósticos sean opt-in, no se emitan en producción y no incluyan errores privados.

Las suites existentes comprueban límites/selección y el flujo de la tarjeta bancaria con fecha, horario y comprobante. Estas pruebas no verifican el selector nativo, los permisos de archivos reales, la conexión desde Android ni la persistencia del comprobante en la API. La suite de integración simulada tampoco los certifica. La validación en Android físico queda pendiente: no se dispone aquí de un dispositivo accesible para ejecutarla. No se ejecutaron pruebas que siembren o modifiquen una base de datos externa.
