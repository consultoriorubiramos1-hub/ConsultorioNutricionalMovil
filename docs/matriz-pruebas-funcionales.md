# Matriz funcional y de regresion: preparacion

Base documental: 09_Plan_de_pruebas.docx, actualizacion del 29 de octubre de 2026, CP01 a CP20, contrastado con Instrumento Integral de Evaluacion Movil. Se conservan los veinte casos originales. CP21 a CP26 comprueban requisitos adicionales del instrumento; CP27 a CP30 complementan la regresion y distribucion. El instrumento no fija una cuota de treinta casos ni de doce pruebas por tipo.

Estado de esta matriz: **CP01, CP04 y CP05 aprobados en el entorno de desarrollo; CP02 parcial**. El [primer bloque de resultados](evidencias/pruebas/2026-11-02/bloque-01-resultados.md) distingue lo visible en las capturas y la confirmacion del operador. Los reportes unitarios y HTTP conservan su propio alcance y no se convierten automaticamente en aprobaciones manuales. INC-ENT-01 requiere completar la preparacion local antes de los recorridos de datos.

Las suites automatizadas del 2 de noviembre de 2026 ya estan [ejecutadas y documentadas](evidencias/pruebas/2026-11-02/README.md). La [guia de dispositivo](guia-pruebas-dispositivo.md) ordena los casos, identifica los bloqueos y proporciona el registro separado de Debug y Release. Se pospone la integracion con el disparador y el tag hasta el trabajo posterior solicitado por el usuario.

## CP01 a CP20 del documento

| Caso / historia | Datos y pasos previstos | Resultado esperado | Estado manual |
|---|---|---|---|
| CP01 / AUT01 | Cuenta ficticia; campos vacios, credenciales incorrectas y correctas. | Se informan errores y solo los datos validos abren Inicio. | [Aprobado en desarrollo: A-D](evidencias/pruebas/2026-11-02/cp01-inicio-sesion.md). |
| CP02 / AUT02-AUT03 | Recuperacion: codigo incorrecto/correcto, clave debil, confirmacion distinta y datos validos. | Se rechazan entradas invalidas; el restablecimiento solo se confirma cuando el servicio lo acepta. | [Parcial: usuario vacio aprobado](evidencias/pruebas/2026-11-02/bloque-01-resultados.md); resto pendiente. |
| CP03 / AUT04 | Pantalla personal con sesion vencida provocada de forma controlada. | Se retiran los datos personales visibles y se solicita iniciar sesion. | No ejecutado |
| CP04 / AUT05 | Acceder, cerrar sesion desde el menu y volver a los modulos personales. | Se muestra Login y se exige autenticacion nueva. | [Aprobado en desarrollo](evidencias/pruebas/2026-11-02/bloque-01-resultados.md); captura y confirmacion del operador. |
| CP05 / AUT06 | Sin sesion, abrir ambos documentos legales, recorrerlos y cerrar mediante control y Atras. | Son completos y legibles; regresan al acceso sin exigir sesion. | [Aprobado en desarrollo](evidencias/pruebas/2026-11-02/bloque-01-resultados.md); capturas y confirmacion del operador. |
| CP06 / PER01-PER02 | Consultar Datos y Cuenta; fecha/correo invalidos y cambios validos. | Se valida y solo se anuncia guardado aceptado por la API. | No ejecutado |
| CP07 / PER03 | Cancelacion con perfil cargado; motivo vacio/con contenido; preparar correo y cancelar envio externo. | Motivo opcional y correo preparado; no se anuncia eliminacion ni envio confirmado. | No ejecutado |
| CP08 / PER04 | Oposicion con tratamiento/motivo vacios y completos; preparar correo y cancelarlo. | Campos obligatorios; no se anuncia resolucion ni desactivacion automatica. | No ejecutado |
| CP09 / DASH01-DASH02 | Cuentas con/sin medidas o plan; abrir accesos y regresar. | Resumen de la cuenta correcta, carga/faltantes claros y navegacion funcional. | No ejecutado |
| CP10 / EVA01 | Cuatro medidas con fechas distintas, un faltante y un porcentaje invalido controlado. | Cada indicador elige su ultimo dato valido y fecha propia; no inventa faltantes. | No ejecutado |
| CP11 / EVA02 | Historial completo, incompleto y sin fecha; desplazar y actualizar. | Conserva registros y senala ausencias sin bloquear. | No ejecutado |
| CP12 / EVA03 | Objetivos de bajar, subir, mantener y referencia insuficiente. | Texto/borde responden al objetivo; estado neutral si no hay comparacion suficiente. | No ejecutado |
| CP13 / EVA04 | Cero, una y varias medidas; fecha invalida y peso no positivo controlados. | Grafica/diferencia usan datos validos o informan insuficiencia. | No ejecutado |
| CP14 / PLA01-PLA02 | Cuentas con/sin plan; horarios completos y uno faltante. | Plan asignado y tiempos correctos; no inventa horarios. | No ejecutado |
| CP15 / PLA03-PLA04 | Cambiar menu, abrir preparacion, volver y repetir sin indicaciones. | Detalle de la comida correcta y seleccion conservada. | No ejecutado |
| CP16 / MUR01-MUR04 | Expandir/contraer, consultar imagen, enlace valido y no disponible. | Recursos o error claro sin bloquear el texto. | No ejecutado |
| CP17 / MUR02 | Buscar con/sin resultados, limpiar y comprobar cien caracteres. | Filtra correctamente y recupera el listado general. | No ejecutado |
| CP18 / MUR03 | Dar/quitar Me gusta, pulsaciones repetidas y error controlado. | Evita duplicidad durante el proceso y conserva solo el estado confirmado. | No ejecutado |
| CP19 / Alcance y permisos | Abrir la ruta heredada de citas y revisar menu; separar informacion de dos cuentas ficticias. | Citas regresa a Inicio sin formulario; cada cuenta consulta sus datos autorizados. | No ejecutado |
| CP20 / Red y accesibilidad | Interrumpir/restaurar conexion, navegar durante carga y ampliar texto. | Error/reintento claros; sin respuesta de otra pantalla ni contenido inaccesible. | No ejecutado |

CP19 conserva el alcance documentado: las pruebas internas heredadas de citas no habilitan ese modulo en la interfaz.

## CP21 a CP30 propuestos

Estos casos complementan el documento; no se atribuyen al archivo original. Los controles faltantes deben implementarse o verificarse antes de ejecutar su caso.

| Caso / referencia | Datos y pasos previstos | Resultado esperado | Estado manual |
|---|---|---|---|
| CP21 / Consentimiento, Act. 6 | Instalacion limpia: revisar que el consentimiento no este marcado; probar rechazo y aceptacion explicita. | No se presume consentimiento por iniciar sesion; la decision queda aplicada conforme al flujo definido. | No ejecutado |
| CP22 / Pinning valido, Act. 6 | Cliente nativo con certificado/pin autorizado y cuenta sintetica. | La conexion se admite y funciona el recorrido permitido. | No ejecutado |
| CP23 / Pinning invalido, Act. 6 | Proxy/certificado de prueba no autorizado en entorno controlado; intentar acceso. | El cliente rechaza la conexion y no transmite credenciales a ese destino. | No ejecutado |
| CP24 / Eliminacion de cuenta, Act. 6 | Cuenta desechable aislada: solicitar eliminacion, confirmar y consultar nuevamente su acceso. | Endpoint autenticado aplica la politica definida y devuelve resultado trazable; no se confunde correo preparado con cuenta eliminada. | No ejecutado |
| CP25 / Opt-Out, Act. 6 | Cuenta sintetica: cambiar preferencias de oposicion, recargar y probar rechazo de guardado. | Switches y persistencia coinciden con la respuesta del servicio; el fallo no se presenta como cambio guardado. | No ejecutado |
| CP26 / Permisos, Act. 7 | Funciones activas que requieran permisos: conceder, denegar y volver a intentar. Revisar permisos solicitados sin necesidad. | Solicitudes justificadas y a demanda; denegacion controlada. Si la funcion no necesita permiso, no lo solicita. | No ejecutado |
| CP27 / Regresion entre cuentas | Demorar una respuesta de la cuenta A, cerrar/cambiar a B y completar la respuesta anterior. | Ningun dato tardio de A aparece en B. | No ejecutado |
| CP28 / Contrato de respuestas | Entorno controlado: HTML o JSON incompleto en una respuesta; luego contrato valido. | No se anuncia exito falso, no se muestran detalles internos y el reintento recupera el flujo. | No ejecutado |
| CP29 / Instalacion y actualizacion, Act. 7 | Instalar y actualizar la version distribuida en pruebas internas de Play a partir del AAB firmado; revisar version y arranque. | Version y paquete correctos, arranque funcional y manejo de sesion conforme a la politica definida. | No ejecutado |
| CP30 / Entrada externa | Sin sesion, intentar un enlace directo a una pantalla personal; repetir con sesion valida. | La pantalla personal exige autenticacion y el retorno mantiene un recorrido autorizado. | No ejecutado |

## Preparacion y bloqueadores

- Dispositivo Android y version identificada; ampliar a iOS cuando se disponga. Release se prueba mediante la version distribuida a partir del AAB del flujo automatico.
- Dos cuentas ficticias: una con plan/mediciones y otra sin registros. El esquema reducido de DAST CI solo admite autenticacion y no prepara esas funciones.
- Datos controlados de fechas/pesos faltantes o invalidos; correo de recuperacion de prueba y aplicacion de correo para preparar ARCO sin enviar a personas reales.
- Pinning nativo aun no acreditado: no se localizaron configuracion o dependencia de pinning en src, app.json, app.config.js o package.json revisados. HTTPS por si solo no acredita ese requisito.
- La implementacion ARCO revisada prepara correo para cancelacion y oposicion. El instrumento exige ademas eliminacion de cuenta y switches Opt-Out; CP07/CP08 no acreditan por si solos CP24/CP25.
- El consentimiento explicito no se acredita con abrir el aviso o iniciar sesion. Debe verificarse el flujo frente al requisito antes de aprobar CP21.
- SecureStore esta presente en el servicio de tokens; su uso y la retirada de sesion requieren tambien evidencia funcional/nativa. Esta matriz no acredita aun cifrado o pinning en un dispositivo.

## Registro para cada ejecucion

Conservar caso/historia, fecha, ejecutor, commit/version, dispositivo y sistema, entorno API, datos ficticios, pasos, resultado observado, estado y evidencia anonimizada. Los estados son aprobado, fallido, bloqueado o no ejecutado. Un fallo agrega reproduccion, severidad, responsable y resultado de repeticion.

El reparto de responsables se confirma contra el tablero antes de ejecutar; esta matriz no reasigna personas. Caja blanca se acredita con las suites realmente ejecutadas y su trazabilidad. Los casos de caja negra conservan registros separados en Debug y Release. No se suman automaticamente las suites unitarias como pruebas manuales completadas. Si se mantiene una seleccion numerica adicional del equipo, se identificara como tal, sin atribuir esa cuota al instrumento.
