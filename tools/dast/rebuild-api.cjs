const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { execFileSync, spawnSync } = require('node:child_process');

function main() {
  if (process.argv.length !== 2) throw new Error('Uso: node tools/dast/rebuild-api.cjs; utiliza exclusivamente el entorno local existente.');
  const local = path.join(__dirname, '.local');
  const config = fs.readFileSync(path.join(local, 'config.env'), 'utf8');
  const encodedPath = config.match(/^DAST_BACKEND_PATH=(.+)$/m)?.[1];
  if (!encodedPath) throw new Error('No se encontro la ruta local del backend preparado.');
  const backend = fs.realpathSync(JSON.parse(encodedPath.trim()).replace(/\$\$/g, '$'));
  const pkg = JSON.parse(fs.readFileSync(path.join(backend, 'package.json'), 'utf8'));
  if (!pkg.dependencies?.next || !pkg.dependencies?.pg) throw new Error('La carpeta preparada no corresponde a la API Next.js/PostgreSQL.');
  const git = args => execFileSync('git', ['-C', backend, ...args], { encoding: 'utf8' }).trim();
  const ref = git(['rev-parse', 'HEAD']);
  if (!/^[a-f0-9]{40}$/.test(ref) || git(['status', '--porcelain', '--untracked-files=no'])) throw new Error('El checkout del backend debe estar limpio e identificado por commit.');
  const sourcePath = path.join(local, 'source.json');
  const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
  const hash = createHash('sha256').update(fs.readFileSync(path.join(local, 'schema.sql'))).digest('hex');
  if (hash !== source.schemaSha256) throw new Error('El esquema local cambio desde la preparacion; revisa sus metadatos antes de reconstruir.');
  const compose = ['compose', '--env-file', 'tools/dast/.local/config.env', '-f', 'tools/dast/compose.yml'];
  const root = path.resolve(__dirname, '../..');
  console.log('Reconstruyendo exclusivamente el servicio api; se reutilizan la base y las claves locales.');
  const build = spawnSync('docker', [...compose, 'up', '--no-deps', '--build', '-d', '--wait', 'api'], { cwd: root, stdio: 'inherit' });
  if (build.error || build.status !== 0) throw new Error('La API no termino de arrancar; no se actualizaron los metadatos de origen.');
  if (git(['rev-parse', 'HEAD']) !== ref || git(['status', '--porcelain', '--untracked-files=no'])) throw new Error('El checkout cambio durante la construccion; repite con una version estable.');
  const check = spawnSync('docker', [...compose, 'exec', '-T', 'api', 'node', 'dast-tools/check-security-headers.cjs'], { cwd: root, encoding: 'utf8' });
  if (check.stdout) process.stdout.write(check.stdout);
  if (check.error || check.status !== 0) throw new Error('La comprobacion de cabeceras fallo; no se actualizaron los metadatos de origen.');
  const result = JSON.parse(check.stdout);
  if (result.results?.length !== 4 || !result.results.every(item => item.passed === true)) throw new Error('La comprobacion de cabeceras esta incompleta.');
  fs.writeFileSync(path.join(local, 'header-check.json'), JSON.stringify({ ...result, backendCommit: ref }, null, 2) + '\n');
  fs.writeFileSync(sourcePath, JSON.stringify({ ...source, backendCommit: ref, rebuiltAt: new Date().toISOString() }, null, 2) + '\n');
  console.log('API local actualizada y cabeceras verificadas. Metadatos del nuevo commit registrados sin regenerar claves.');
}

try { main(); } catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
