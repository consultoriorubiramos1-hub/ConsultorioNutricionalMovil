param()
$ErrorActionPreference = 'Stop'

& docker version --format '{{.Server.Version}}'
if ($LASTEXITCODE -ne 0) { throw 'Inicia Docker Desktop antes de exportar la estructura.' }

$localDirectory = Join-Path $PSScriptRoot '.local'
New-Item -ItemType Directory -Force -Path $localDirectory | Out-Null
$schemaPath = Join-Path $localDirectory 'schema.sql'
if (Test-Path $schemaPath) { throw 'Ya existe .local/schema.sql. No se sobrescribió.' }

$connection = Read-Host 'Pega la URI PostgreSQL para leer SOLO la estructura (la entrada queda oculta)' -AsSecureString
$credential = [System.Management.Automation.PSCredential]::new('schema-export', $connection)
$sourceUri = $credential.GetNetworkCredential().Password
$parsedUri = [Uri]$sourceUri
if ($parsedUri.Scheme -notin @('postgres', 'postgresql') -or -not $parsedUri.Host -or $parsedUri.AbsolutePath -eq '/') {
    throw 'La conexión debe ser una URI PostgreSQL con nombre de base de datos.'
}

$previousDatabase = [Environment]::GetEnvironmentVariable('PGDATABASE', 'Process')
$previousTimeout = [Environment]::GetEnvironmentVariable('PGCONNECT_TIMEOUT', 'Process')
try {
    $env:PGDATABASE = $sourceUri
    $env:PGCONNECT_TIMEOUT = '15'
    $mount = 'type=bind,source=' + $localDirectory + ',target=/out'
    & docker run --rm --env PGDATABASE --env PGCONNECT_TIMEOUT --mount $mount postgres:18-bookworm `
        pg_dump --schema-only --no-owner --no-privileges --no-comments --clean --if-exists `
        --lock-wait-timeout=5s --file=/out/schema.partial.sql
    if ($LASTEXITCODE -ne 0) { throw 'No se pudo exportar la estructura. No se inició el entorno de pruebas.' }
    Move-Item -LiteralPath (Join-Path $localDirectory 'schema.partial.sql') -Destination $schemaPath
    Write-Host 'Estructura exportada en tools/dast/.local/schema.sql. No se exportaron filas.'
} finally {
    [Environment]::SetEnvironmentVariable('PGDATABASE', $previousDatabase, 'Process')
    [Environment]::SetEnvironmentVariable('PGCONNECT_TIMEOUT', $previousTimeout, 'Process')
    $sourceUri = $null
    $credential = $null
    $connection = $null
    Remove-Item -LiteralPath (Join-Path $localDirectory 'schema.partial.sql') -ErrorAction SilentlyContinue
}
