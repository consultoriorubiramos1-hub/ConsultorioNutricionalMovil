# Evidencia SAST: CodeQL sobre 5642a32

## Identificación

- Proyecto: ConsultorioNutricionalMovil.
- Rama analizada: `feature/seguridad-sast-dast`.
- Commit analizado: `5642a32fe5a5c82b4f572d408cfc0789a648e540`.
- Fecha: 1 de noviembre de 2026.
- Ejecución: [SAST - CodeQL #41351816444](https://github.com/consultoriorubiramos1-hub/ConsultorioNutricionalMovil/actions/runs/41351816444).
- Estado de la ejecución: completada correctamente.
- Motor: CodeQL 2.27.3.
- Lenguaje configurado: JavaScript/TypeScript.
- Suite: `security-extended`.
- Reglas registradas en el SARIF: 103.

## Alcance comprobado

Los registros indican que se analizaron 144 de 144 archivos TypeScript y 18 de 18 archivos JavaScript. También se extrajeron cinco archivos de GitHub Actions en esta invocación.

Se descargó el artefacto y se revisaron los resultados del archivo `javascript.sarif`. La revisión no se limitó al estado verde del workflow.

## Resultado

El SARIF contiene **dos advertencias**. Ambas aparecen en scripts de administración o publicación. No hay resultados ubicados en `src/` en esta ejecución.

| ID | Regla | Ubicación | Nivel | Puntuación de seguridad de CodeQL |
| --- | --- | --- | --- | --- |
| SAST-01 | `js/file-access-to-http` | `scripts/protect-main.cjs:10` | warning | 6.5 |
| SAST-02 | `js/http-to-file-access` | `scripts/promote-google-play.cjs:50` | warning | 6.3 |

Estas puntuaciones proceden de los metadatos de las reglas; las advertencias no constituyen por sí solas una explotación confirmada.

## Revisión contextual de SAST-01

CodeQL identifica el flujo desde la lectura de `.github/main-protection.json` hasta el cuerpo de una petición HTTP.

El archivo contiene la política de protección de la rama y está versionado en el repositorio. El destino del script es una URL HTTPS fija de la API de GitHub para la protección de `main` en este mismo repositorio. El envío mediante PUT es la operación administrativa prevista por la herramienta.

Conclusión de la revisión: se confirmó el flujo de datos que describe CodeQL, pero no se confirmó una divulgación no autorizada en el uso revisado. La evaluación se limita a ese archivo y destino actuales. No se ejecutó la herramienta ni se cambiaron las protecciones del repositorio durante esta revisión.

Estado: advertencia revisada contextualmente; sin cierre ni supresión automática en GitHub.

## Revisión contextual de SAST-02

CodeQL identifica que un identificador recibido de Google Play forma parte del JSON escrito en `release/promotion.json`.

La ruta de salida es fija. El script guarda un comprobante con `versionCode`, confirmación, `editId` y fecha. El dato recibido se serializa como JSON; no se utiliza para seleccionar la ruta de salida ni se ejecuta como código.

Conclusión de la revisión: el almacenamiento del comprobante es una operación prevista. No se confirmó una escritura en una ruta arbitraria ni ejecución de contenido remoto en el flujo revisado. No se ejecutó la promoción ni se enviaron cambios a Google Play durante esta revisión.

Estado: advertencia revisada contextualmente; sin cierre ni supresión automática en GitHub.

## Evidencia original

- [Artefacto sast-codeql-41351816444](https://github.com/consultoriorubiramos1-hub/ConsultorioNutricionalMovil/actions/runs/41351816444/artifacts/13100898716).
- Archivo contenido: `javascript.sarif`.
- SHA-256 del ZIP descargado: `35d8c146b247cb093b2d8b4e41c5d35aea3bd4cd5fcc769dd4b7933c7208a0e3`.
- La huella del ZIP coincide con el digest informado por GitHub.
- SHA-256 del SARIF: `045c79fd3f7ee034d39c1a109d16683400b47124c6be4cf24ebb626c559069e5`.
- Retención configurada del artefacto: 30 días; expiración informada por GitHub: 1 de diciembre de 2026 a las 21:25:15 UTC.

## Dependencias: resultado SCA separado

Los últimos reportes SCA guardados tras `npm audit fix` registran:

| Alcance | Bajas | Moderadas | Altas | Críticas | Total |
| --- | ---: | ---: | ---: | ---: | ---: |
| Completo | 1 | 44 | 0 | 0 | 45 |
| Sin dependencias de desarrollo | 0 | 12 | 0 | 0 | 12 |

Fuentes del repositorio:

- [Reporte completo tras corrección](npm-audit-tras-correccion.json).
- [Reporte sin desarrollo tras corrección](npm-audit-produccion-tras-correccion.json).
- [Reporte completo inicial](npm-audit-inicial.json).
- [Reporte sin desarrollo inicial](npm-audit-produccion-inicial.json).

En el reporte completo, los avisos de origen identificados son `deepmerge`, `glob` y `minimatch`; las demás entradas incluyen paquetes afectados por depender de ellos. Por ello, 45 entradas de paquetes afectados no equivalen a 45 avisos independientes.

Los reportes citados se generaron antes de la alineación posterior mediante `expo install --fix`. La instalación posterior siguió informando 45 entradas (44 moderadas y una baja); no se ha adjuntado aquí una nueva auditoría JSON posterior a esa alineación.

Los hallazgos SCA permanecen abiertos. No se han declarado corregidos, aceptados ni irrelevantes para el binario. El filtro `--omit=dev` describe el árbol de dependencias, no acredita por sí solo la presencia o ausencia de un paquete en el AAB.

## Límites y trabajo pendiente

Actualizacion: el [seguimiento sobre 4fcd103](sast-codeql-4fcd103.md) conserva las dos advertencias administrativas y registra una advertencia adicional en la preparacion del entorno local. Ese documento describe el ajuste y el estado de su reanalisis. Esta evidencia mantiene los resultados del commit original.

- Revisar la seguridad específica de autenticación, almacenamiento, red y permisos.
- Realizar DAST con resultados y evidencias reales.
- Revisar los hallazgos SCA residuales y registrar su tratamiento.
- Verificar R8, configuración nativa y funcionamiento en el AAB generado por el disparador automático.
- El éxito de CodeQL y de las pruebas automatizadas no constituye una certificación de ausencia de vulnerabilidades.
