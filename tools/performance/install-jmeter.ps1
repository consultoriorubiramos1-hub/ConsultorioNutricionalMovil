$ErrorActionPreference = 'Stop'
$versionPruebas = '5.6.3'
$shaEsperado = '387fadca903ee0aa30e3f2115fdfedb3898b102e6b9fe7cc3942703094bd2e65b235df2b0c6d0d3248e74c9a7950a36e42625fd74425368342c12e40b0163076'
$raizPruebas = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$destinoPruebas = Join-Path $raizPruebas 'tools\dast\.local\jmeter'
$zipPruebas = Join-Path $destinoPruebas "apache-jmeter-$versionPruebas.zip"
$jarPruebas = Join-Path $destinoPruebas "apache-jmeter-$versionPruebas\bin\ApacheJMeter.jar"
$javaPruebas = if ($env:JAVA_HOME -and (Test-Path (Join-Path $env:JAVA_HOME 'bin\java.exe'))) { Join-Path $env:JAVA_HOME 'bin\java.exe' } else { 'java.exe' }
& $javaPruebas -version
if ($LASTEXITCODE -ne 0) { throw 'Se necesita Java. Reutiliza el JDK utilizado por Appium.' }
New-Item -ItemType Directory -Force -Path $destinoPruebas | Out-Null
if (-not (Test-Path -LiteralPath $zipPruebas)) {
    Write-Host 'Descargando JMeter 5.6.3 desde Apache. Solo se necesita la primera vez.'
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -UseBasicParsing -Uri 'https://downloads.apache.org/jmeter/binaries/apache-jmeter-5.6.3.zip' -OutFile "$zipPruebas.partial" -TimeoutSec 300
    $shaDescarga = (Get-FileHash -LiteralPath "$zipPruebas.partial" -Algorithm SHA512).Hash.ToLowerInvariant()
    if ($shaDescarga -ne $shaEsperado) { throw 'SHA-512 incorrecto. No se ejecutara la descarga.' }
    Move-Item -LiteralPath "$zipPruebas.partial" -Destination $zipPruebas -Force
}
if ((Get-FileHash -LiteralPath $zipPruebas -Algorithm SHA512).Hash.ToLowerInvariant() -ne $shaEsperado) {
    throw 'La copia local no coincide con el SHA-512 publicado por Apache. No se ejecutara.'
}
if (-not (Test-Path -LiteralPath $jarPruebas)) {
    Write-Host 'Extrayendo JMeter en el directorio local de pruebas.'
    Expand-Archive -LiteralPath $zipPruebas -DestinationPath $destinoPruebas -Force
}
& $javaPruebas -jar $jarPruebas --version
if ($LASTEXITCODE -ne 0) { throw 'JMeter no pudo iniciarse.' }
Write-Host 'JMeter preparado. Siguiente: node .\tools\performance\run-jmeter.cjs'
