const fs = require("node:fs");
const path = require("node:path");

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Falta ${name}: integración real NO verificada.`);
  return value;
}

function readTestEnvironment({ requireDriver = true } = {}) {
  if (required("TEST_ENVIRONMENT") !== "isolated") throw new Error("TEST_ENVIRONMENT debe ser isolated.");
  const api = new URL(required("TEST_API_URL"));
  const production = new URL(required("PRODUCTION_API_URL"));
  const allowed = required("TEST_API_ALLOWED_ORIGIN");
  if (!["http:", "https:"].includes(api.protocol) || api.username || api.password || api.search || api.hash || api.pathname !== "/") throw new Error("TEST_API_URL debe ser un origen HTTP(S) sin credenciales.");
  if (api.origin !== allowed || api.origin === production.origin) throw new Error("El origen de pruebas no está autorizado o coincide con producción.");
  if (api.protocol === "http:" && !["localhost", "127.0.0.1", "[::1]"].includes(api.hostname)) throw new Error("HTTP solo permitido en localhost.");
  const repository = required("TEST_BACKEND_REPOSITORY");
  const ref = required("TEST_BACKEND_REF");
  const driverPath = required("TEST_BACKEND_DRIVER");
  if (!/^[\w.-]+\/[\w.-]+$/.test(repository) || !/^[a-f0-9]{40}$/.test(ref)) throw new Error("Especifique repositorio del backend y commit completo de 40 caracteres.");
  const backendRoot = path.resolve(".test-backend");
  const resolvedDriver = path.resolve(backendRoot, driverPath);
  if (!resolvedDriver.startsWith(backendRoot + path.sep) || !resolvedDriver.endsWith(".cjs")) throw new Error("TEST_BACKEND_DRIVER debe ser un módulo .cjs dentro de .test-backend.");
  if (requireDriver && !fs.existsSync(resolvedDriver)) throw new Error("El driver de fixtures/BD del backend no está disponible; PI-02 no puede aprobarse.");
  if (requireDriver) {
    const database = new URL(required("TEST_DATABASE_URL"));
    if (!["postgres:", "postgresql:"].includes(database.protocol) || database.hostname !== required("TEST_DATABASE_ALLOWED_HOST") || database.pathname === "/") throw new Error("La BD no coincide con el host de pruebas autorizado.");
  }
  return { apiUrl: api.origin, driverPath: resolvedDriver };
}
if (require.main === module) {
  try { readTestEnvironment({ requireDriver: !process.argv.includes("--before-checkout") }); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { readTestEnvironment };
