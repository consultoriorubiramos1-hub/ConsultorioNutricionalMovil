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
$sourceUri = $credential.GetNetworkCredential().Password.Trim()
$parsedUri = $null
if (-not [Uri]::TryCreate($sourceUri, [UriKind]::Absolute, [ref]$parsedUri) -or
    $parsedUri.Scheme -notin @('postgres', 'postgresql') -or -not $parsedUri.Host -or $parsedUri.AbsolutePath -eq '/') {
    throw 'La conexión debe ser una URI PostgreSQL con nombre de base de datos.'
}

$previousSource = [Environment]::GetEnvironmentVariable('DAST_SCHEMA_SOURCE_URI', 'Process')
try {
    $env:DAST_SCHEMA_SOURCE_URI = $sourceUri
    $mount = 'type=bind,source=' + $localDirectory + ',target=/out'
    $scriptMount = 'type=bind,source=' + (Join-Path $PSScriptRoot 'export-schema.sh') + ',target=/opt/cnm-export-schema.sh,readonly'
    & docker run --rm --env DAST_SCHEMA_SOURCE_URI --mount $mount --mount $scriptMount postgres:18-bookworm `
        sh /opt/cnm-export-schema.sh
    if ($LASTEXITCODE -ne 0) { throw 'No se pudo exportar la estructura. No se inició el entorno de pruebas.' }
    Move-Item -LiteralPath (Join-Path $localDirectory 'schema.partial.sql') -Destination $schemaPath
    Write-Host 'Estructura exportada en tools/dast/.local/schema.sql. No se exportaron filas.'
} finally {
    [Environment]::SetEnvironmentVariable('DAST_SCHEMA_SOURCE_URI', $previousSource, 'Process')
    $sourceUri = $null
    $credential = $null
    $connection = $null
    Remove-Item -LiteralPath (Join-Path $localDirectory 'schema.partial.sql') -ErrorAction SilentlyContinue
}
