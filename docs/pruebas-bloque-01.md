# Bloque 01: cinco comprobaciones manuales pendientes

El usuario solicita continuar en bloques de cinco capturas. Este bloque agrupa variantes de la [matriz funcional](matriz-pruebas-funcionales.md); no altera el alcance del plan ni equivale a cinco casos completos aprobados. CP01-A, CP01-B y CP01-C ya tienen evidencia en su [registro](evidencias/pruebas/2026-11-02/cp01-inicio-sesion.md).

**Estado inicial de las cinco comprobaciones: no ejecutadas.** Modalidad indicada: Android Emulator y desarrollo en Expo Go; Release tiene registro posterior separado.

**Actualizacion:** el operador envio las cinco capturas y confirmo su funcionamiento. Ver el [registro de resultados](evidencias/pruebas/2026-11-02/bloque-01-resultados.md): CP01, CP04 y CP05 aprobados; CP02 parcial y aviso de carga de datos registrado como INC-ENT-01. La tabla siguiente conserva las instrucciones originales del bloque.

| Captura | Referencia | Pasos | Resultado esperado y evidencia |
|---|---|---|---|
| 1 | CP05-A, Aviso de Privacidad | Desde Login, bajar hasta los enlaces legales y abrir Aviso de Privacidad. Recorrer el contenido hasta el final. Tomar captura y cerrar con Entendido. | Documento legible, desplazamiento disponible, titulo y parte final visibles en la captura; el cierre vuelve a Login. Informar tambien si el retorno fallo. |
| 2 | CP05-B, Terminos | Abrir Terminos y Condiciones, recorrer hasta el final y tomar captura. Cerrar con Atras de Android. | Documento legible y desplazable sin exigir sesion; captura del titulo y parte final. Informar si Atras no regresa al Login. |
| 3 | CP02-A, recuperacion con usuario vacio | Abrir Olvidaste tu contraseña, dejar Usuario vacio y pulsar Enviar codigo. Capturar el aviso. Volver a Login con la flecha de la pantalla. | Mensaje `Ingresa tu usuario.` sin avanzar a verificacion de codigo. No se solicita enviar un correo real. |
| 4 | CP01-D, credenciales correctas | En Login, introducir `dast_patient_a` y la contraseña local valida del fixture. Mantenerla oculta, pulsar Iniciar sesion y esperar el resultado. | Abrir Inicio y capturar la pantalla. Si hay error o retorno automatico a Login, capturar lo observado y registrar el problema, sin aprobarlo. |
| 5 | CP04, cierre y acceso posterior | Solo si la anterior abre Inicio: abrir Menu, pulsar Cerrar sesion y probar Atras. Si la app sale, reabrirla. Capturar el estado final. | Regresar a Login y exigir autenticacion para los modulos personales. Informar si Atras permitio volver a datos personales. Si la captura 4 no permite iniciar sesion, esta comprobacion queda bloqueada por dependencia. |

Una captura del documento no acredita todas sus paginas ni su cierre: registrar tambien la observacion del operador sobre desplazamiento, legibilidad y retorno. El Login posterior a logout tampoco acredita por si solo haber intentado volver a una pantalla personal. No se asignan esos resultados hasta recibirlos.

## Contraseña sintetica para la comprobacion 4

Al llegar a la comprobacion 4, abrir otra terminal PowerShell en la carpeta del proyecto movil; conservar la terminal de Metro abierta. El siguiente bloque copia exclusivamente la contraseña del fixture al portapapeles, sin mostrarla ni modificar la configuracion:

```powershell
git log -1 --oneline
$lineaClavePrueba = Get-Content .\tools\dast\.local\config.env |
    Where-Object { $_ -like 'DAST_FIXTURE_PASSWORD=*' }
if (-not $lineaClavePrueba) { throw 'No se encontro la clave del fixture local.' }
$clavePrueba = ($lineaClavePrueba -split '=', 2)[1].Trim()
Set-Clipboard -Value $clavePrueba
```

Escribir primero el usuario y luego ejecutar el bloque para copiar la contraseña; asi, copiar el nombre de usuario no reemplaza la clave en el portapapeles. Pegar en Contraseña mediante Ctrl+V y usar el ojo para mantener el valor oculto antes de capturar. La clave valida no se adjunta al reporte ni al chat. Conservar la linea de commit para identificar el cliente probado.

Referencias: [Set-Clipboard en Windows PowerShell](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.management/set-clipboard?view=powershell-5.1) y [controles de Android Emulator](https://developer.android.com/studio/run/emulator).

## Entrega del bloque

Enviar las capturas numeradas 1 a 5 y las observaciones indicadas; incluir la linea de commit si esta disponible. Una prueba que falle conserva la captura del error. Si no puede completarse un paso, registrar la causa y continuar con los que no dependan de el.
