# CP01 / AUT01: inicio de sesión

**Estado general: parcial.** CP01-A y CP01-B estan aprobadas. CP01-C y CP01-D permanecen no ejecutadas hasta recibir sus evidencias. Este registro no aprueba todavia CP01 completo.

## Entorno y procedencia

Evidencia recibida el 2 de noviembre de 2026. Ejecucion realizada por el operador en Android Emulator, perfil Medium Phone API 35, x86_64, identificado en la preparacion. Codex revisa las capturas y documenta los resultados aportados.

La modalidad indicada para abrir la app fue **Expo Go, desarrollo**, mediante `npm run android -- --go --clear`, con API local `http://10.0.2.2:3300`. El operador no adjunto en este paso la salida de Expo ni `git log`: el commit exacto del cliente y la version del runtime quedan pendientes de confirmar. La captura muestra la interfaz de la app en Android; no demuestra una compilacion propia Debug ni Release. La hora del dispositivo no se toma como hora local verificada de ejecucion.

Preparacion relacionada: [PREP-01, conectividad](prep-01-conectividad-emulador.md) y [PREP-02, fixtures y autenticacion HTTP](prep-02-autenticacion-local.md).

## Seguimiento de variantes

| Variante | Entradas y accion | Resultado esperado | Estado |
|---|---|---|---|
| CP01-A | Usuario y contraseña vacios; pulsar Iniciar sesión. | Mostrar `Ingresa tu usuario.` y conservar el login. | Aprobado; captura recibida. |
| CP01-B | Usuario sintetico `dast_patient_a` y contraseña vacia; pulsar Iniciar sesión. | Mostrar `Ingresa tu contraseña.` y conservar el login. | Aprobado; captura recibida. |
| CP01-C | Cuenta sintetica con contraseña incorrecta; pulsar Iniciar sesión. | Informar rechazo y conservar el acceso cerrado. | No ejecutado. |
| CP01-D | Cuenta sintetica con credenciales correctas; pulsar Iniciar sesión. | Abrir Inicio para la identidad esperada. | No ejecutado. |

## CP01-A: campos vacios

**Datos utilizados:** ambos campos sin texto introducido; solo se observan los placeholders `tu@correo.com` e `Ingresa tu contraseña`. No se utilizaron credenciales en esta variante.

**Pasos indicados al operador:** abrir el login, dejar ambos campos vacios y pulsar **Iniciar sesión**. El operador compartio a continuacion la siguiente captura.

**Resultado esperado:** aviso `Ingresa tu usuario.` y permanencia en la pantalla de acceso.

**Resultado observado:** se ve el formulario con ambos campos vacios y el aviso **`Ingresa tu usuario.`** en el recuadro de error. La pantalla visible sigue siendo el login, con el boton Iniciar sesión. Coincide con el resultado previsto para esta variante.

**Dictamen de la variante: aprobado.** No se observa una incidencia en la evidencia aportada.

![CP01-A: formulario vacio con mensaje Ingresa tu usuario](capturas/cp01-a-campos-vacios.png)

Original recibido: `image(20261102-202223).png`. Copia sin editar, 137553 bytes. SHA-256: `6a28492892e00a277381bfa67ed1d5e15eed5be6f63323c386a2b47035c7e91f`.

## CP01-B: usuario presente y contraseña vacia

Evidencia recibida el 2 de noviembre de 2026. Se indico introducir `dast_patient_a` en el primer campo, dejar vacia la contraseña y pulsar **Iniciar sesión**.

**Resultado esperado:** mensaje `Ingresa tu contraseña.` y permanencia en el login.

**Resultado observado:** la captura muestra el usuario sintetico `dast_patient_a`, el placeholder `Ingresa tu contraseña` en el campo vacio y el aviso **`Ingresa tu contraseña.`**. Sigue visible la pantalla de acceso con el boton Iniciar sesión.

**Dictamen de la variante: aprobado.** La validacion de contraseña obligatoria se presenta como se esperaba. La captura no evidencia trafico HTTP ni una sesion creada, y no se utiliza para acreditar esos resultados.

![CP01-B: usuario sintetico presente y aviso de contraseña obligatoria](capturas/cp01-b-contrasena-vacia.png)

Original recibido: `image(20261102-202841).png`. Copia sin editar, 141688 bytes. SHA-256: `1bb00d8b239de4c4bb31edd8d9fde48cc760ad94a313df268e8b266bd8131240`.

## Limites y siguiente paso

La imagen no muestra trafico de red, almacenamiento, el codigo HTTP ni una sesión creada. No se utiliza para acreditar esos controles ni los escenarios de credenciales incorrectas/correctas. La validacion visual no sustituye las comprobaciones internas y nativas que tienen evidencia separada.

Sigue CP01-C: conservar `dast_patient_a`, escribir la contraseña deliberadamente incorrecta `Incorrecta123!` y pulsar Iniciar sesión. Se espera `Usuario o contraseña incorrectos.` y permanencia en el login. Esta variante y el acceso con credenciales correctas permanecen no ejecutados.
