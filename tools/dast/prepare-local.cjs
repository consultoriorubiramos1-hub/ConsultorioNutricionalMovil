const fs = require('node:fs');
const path = require('node:path');
const { randomBytes, createHash } = require('node:crypto');
const { execFileSync } = require('node:child_process');

function main() {
  const backendArgument = process.argv[2];
  if (!backendArgument || process.argv.length !== 3) throw new Error('Uso: node tools/dast/prepare-local.cjs RUTA_DEL_REPOSITORIO_WEB');
  const backend = fs.realpathSync(backendArgument);
  const pkg = JSON.parse(fs.readFileSync(path.join(backend, 'package.json'), 'utf8'));
  if (!pkg.dependencies?.next || !pkg.dependencies?.pg) throw new Error('La ruta no corresponde a la API Next.js/PostgreSQL revisada.');
  for (const required of ['package-lock.json', 'src/lib/db.ts', 'src/app/api/mobile/auth/login/route.ts', 'src/app/api/mobile/auth/me/route.ts']) {
    if (!fs.statSync(path.join(backend, required)).isFile()) throw new Error(`Falta ${required}`);
  }
  const ref = execFileSync('git', ['-C', backend, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  if (!/^[a-f0-9]{40}$/.test(ref)) throw new Error('No se pudo identificar el commit de la API.');
  if (execFileSync('git', ['-C', backend, 'status', '--porcelain', '--untracked-files=no'], { encoding: 'utf8' }).trim()) {
    throw new Error('La API tiene cambios en archivos versionados. Utiliza un checkout limpio para registrar su versión.');
  }
  const local = path.join(__dirname, '.local');
  fs.mkdirSync(local, { recursive: true });
  const configPath = path.join(local, 'config.env');
  const schemaPath = path.join(local, 'schema.sql');
  if (!fs.existsSync(schemaPath)) throw new Error('Falta .local/schema.sql. Ejecuta primero tools/dast/export-schema.ps1; solo exporta estructura.');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  if (!/PostgreSQL database dump/.test(schema) || !/CREATE TABLE (?:public\.)?tblusers\s*\(/i.test(schema)) {
    throw new Error('Se requiere un export SQL de estructura real que incluya tblusers.');
  }
  if (/^-- Data for Name:|^\s*COPY\s+[^\n]*\bFROM\s+stdin\s*;|^\s*INSERT\s+INTO\s+(?:public\.)?tblusers\b/im.test(schema)) {
    throw new Error('El SQL contiene secciones de datos; vuelve a exportar exclusivamente el esquema.');
  }
  const quoted = value => JSON.stringify(value.replace(/\\/g, '/').replace(/\$/g, '$$'));
  const config = [
    `DAST_BACKEND_PATH=${quoted(backend)}`,
    `DAST_DOCKERFILE=${quoted(path.join(__dirname, 'Dockerfile.api'))}`,
    `DAST_DB_PASSWORD=${randomBytes(24).toString('hex')}`,
    `DAST_AUTH_SECRET=${randomBytes(32).toString('hex')}`,
    `DAST_FIXTURE_PASSWORD=${randomBytes(20).toString('hex')}`,
    '',
  ].join('\n');
  try {
    fs.writeFileSync(configPath, config, { mode: 0o600, flag: 'wx' });
  } catch (error) {
    if (error.code === 'EEXIST') throw new Error('Ya existe .local/config.env. Consérvalo para reutilizar este entorno; no se sobrescribieron sus claves.');
    throw error;
  }
  fs.writeFileSync(path.join(local, 'source.json'), JSON.stringify({
    backendCommit: ref,
    schemaSha256: createHash('sha256').update(schema).digest('hex'),
    preparedAt: new Date().toISOString(),
    scope: 'local-auth-preparation',
    dastExecuted: false,
  }, null, 2) + '\n');
  console.log('Configuración local creada. API y PostgreSQL usarán claves nuevas; no se leyó ningún .env del backend.');
  console.log('Siguiente: docker compose --env-file tools/dast/.local/config.env -f tools/dast/compose.yml up --build -d --wait');
}

try { main(); } catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
