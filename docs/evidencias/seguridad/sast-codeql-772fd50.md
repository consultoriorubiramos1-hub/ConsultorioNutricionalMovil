# SAST del tooling utilizado en CI

[CodeQL 41389445834](https://github.com/consultoriorubiramos1-hub/ConsultorioNutricionalMovil/actions/runs/41389445834) termino correctamente sobre `772fd509b46c6d49f0caad069af0d63944d05070`, el mismo commit de tooling fijado por el DAST automatico satisfactorio.

Se descargo el artefacto 13116598712. Su ZIP tiene SHA-256 `a7348e6de9b2528dae3ddba84efc36fc7446405fd41fed3c5e6163e524bb5022`, coincidente con GitHub; el SARIF tiene SHA-256 `0b7e5e77fb97810a9b14b01d0eaddfc5d4fbde8d1ed9140f9972cb163ab710ba`. [Resumen estructurado](sast-codeql-772fd50.json).

El SARIF conserva dos advertencias: js/file-access-to-http en scripts/protect-main.cjs:10 (6.5) y js/http-to-file-access en scripts/promote-google-play.cjs:50 (6.3). Mantienen la [revision contextual documentada](sast-codeql-5642a32.md), sin suprimirlas ni ejecutarlas durante la comprobacion. js/file-system-race no reaparece.

El ajuste de compatibilidad del runner paso lint, TypeScript, configuracion y 82 pruebas heredadas. La prueba Python de diagnostico confirma que no se copian lineas de log o payloads al diagnostico seguro. Este reporte no equivale a cero resultados, evaluacion completa del backend privado o aprobacion del resto de requisitos nativos.
