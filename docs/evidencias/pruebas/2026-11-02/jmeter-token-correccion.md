# JMeter: bloqueo de preparacion por formato del token

Fecha local: 2 de noviembre de 2026, Ciudad de Mexico. Evidencia de origen:
salida de consola compartida por el operador a las 2026-11-03T01:00:54.139Z.
Commit movil del intento: `921efa059e7bb2e511498545c1a46ff8b4526edf`.
Commit backend declarado: `367c4bbfb595d7b8765c017a37d9ff7c78113400`.

## Resultado observado

JMeter 5.6.3 se descargo, verifico y extrajo correctamente en Windows. El
operador obtuvo Java 22 y el ejecutor pudo verificar la version de JMeter,
la distribucion SHA-512 y los hashes del plan y de sus propiedades.

| Campo del resumen recibido | Valor |
|---|---|
| performanceExecuted | false |
| passed | false |
| failedAt | fixtures |
| errorCode | fixture-token |
| stages | Lista vacia |

La preparacion se detuvo antes de iniciar carga; este intento no se presenta
como una medicion fallida del rendimiento de la API. Los avisos de escaneo de
plugins impresos por JMeter no fueron el error que detuvo el ejecutor.
No se publica ningun token, clave, configuracion privada ni ruta personal.

## Causa y cambio

El ejecutor exigia por error un token de tres segmentos Base64URL no vacios.
El backend, revisado en el commit declarado, emite tokens con
`encode` de `next-auth/jwt`. NextAuth v4 usa cifrado JWE por defecto; el formato
compacto tiene cinco segmentos y puede incluir la segunda parte vacia.
No se pidio al operador compartir su token para diagnosticarlo.

El ejecutor ahora transporta el token como un valor Bearer opaco, sin
interpretar ni descifrar sus segmentos. Mantiene el limite de 8192 caracteres
del backend y rechaza tipos incorrectos, valores vacios, espacios, controles y
caracteres no validos para la cabecera. Conserva las comprobaciones de la sesion
y del perfil sintetico A antes de iniciar JMeter. La API sigue validando el
token; aceptar su sintaxis en el cliente no equivale a aceptar su autenticidad.

No se cambian el backend, las cuentas, el JMX, la carga, la duracion ni los
criterios de aprobacion. La instalacion existente de JMeter se reutiliza.

## Validacion de la correccion

Se agregaron tres pruebas: JWE de cinco segmentos con parte vacia transmitido
sin alteraciones; tokens con sintaxis o longitud no admitida sin exposicion de
su valor; token de sintaxis admitida que la API rechaza, impidiendo continuar
a Perfil y a la carga. Se conservan los doce tests anteriores del ejecutor.

Resultados del workspace: 15/15 tests del ejecutor, 126/126 de la suite heredada
y herramientas, lint, TypeScript, sintaxis Node y git diff --check aprobados.
Son controles del ejecutor, no mediciones REN01/EST01. El nuevo recorrido de
carga en Windows sigue pendiente del resumen del operador.

Fuentes primarias:
[emisor y validador del backend](https://github.com/consultoriorubiramos1-hub/RubiRamos/blob/367c4bbfb595d7b8765c017a37d9ff7c78113400/src/lib/mobile-auth.ts),
[opciones JWT de NextAuth v4](https://next-auth.js.org/configuration/options#jwt),
[formato de Bearer](https://www.rfc-editor.org/rfc/rfc6750#section-2.1).
