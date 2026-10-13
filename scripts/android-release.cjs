const fs = require("node:fs");
const crypto = require("node:crypto");

function requireValue(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Falta ${name}.`);
  return value;
}
function assertReleaseContext(confirmation) {
  if (process.env.GITHUB_EVENT_NAME !== "workflow_dispatch" || process.env.GITHUB_REF !== "refs/heads/main" || process.env.ANDROID_RELEASE_ENABLED !== "true" || process.env.RELEASE_APPROVALS_CONFIGURED !== "true" || process.env.RELEASE_CONFIRMATION !== confirmation) {
    throw new Error("Liberación deshabilitada, rama incorrecta o autorización manual ausente.");
  }
}
function readJson(file) { return JSON.parse(fs.readFileSync(file, "utf8")); }
function validateConfig(config, expectedVersion) {
  if (!/^\d+\.\d+\.\d+$/.test(expectedVersion) || config.version !== expectedVersion) throw new Error("La versión solicitada debe coincidir con expo.version (X.Y.Z).");
  if (!/^[a-zA-Z][\w]*(\.[a-zA-Z][\w]*)+$/.test(config.android?.package ?? "")) throw new Error("Falta android.package definitivo.");
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(config.extra?.eas?.projectId ?? "")) throw new Error("Falta el projectId real de EAS.");
  if (!config.owner) throw new Error("Falta el propietario real de Expo.");
  return config;
}
function validateBuild(build, expected) {
  if (build.status !== "FINISHED" || build.platform !== "ANDROID" || build.gitCommitHash !== expected.sourceSha || build.appVersion !== expected.version || build.app?.id !== expected.projectId || build.appIdentifier !== expected.packageName || build.app?.ownerAccount?.name !== expected.owner || build.buildProfile !== "production" || build.distribution !== "STORE") throw new Error("El build de EAS no corresponde al commit, versión, paquete o proyecto autorizado.");
  const versionCode = String(build.appBuildVersion ?? "");
  if (!/^[1-9]\d*$/.test(versionCode) || Number(versionCode) > 2100000000) throw new Error("versionCode de EAS inválido.");
  if (expected.versionCode && versionCode !== expected.versionCode) throw new Error("versionCode distinto del artefacto interno.");
  if (!/^[a-f0-9-]{36}$/i.test(build.id ?? "") || (expected.buildId && build.id !== expected.buildId)) throw new Error("Identificador de build inválido.");
  const url = new URL(build.artifacts?.applicationArchiveUrl || build.artifacts?.buildUrl);
  if (url.protocol !== "https:" || url.username || url.password || !url.pathname.endsWith(".aab")) throw new Error("EAS no devolvió un Android App Bundle HTTPS.");
  return { buildId: build.id, versionCode, artifactUrl: url.href };
}
function writeOutput(name, value) {
  if (/\r|\n/.test(value)) throw new Error("Output inválido.");
  fs.appendFileSync(requireValue("GITHUB_OUTPUT"), `${name}=${value}\n`);
}
async function requestJson(url, options = {}) {
  const response = await fetch(url, { ...options, redirect: "error", signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`La operación remota falló (HTTP ${response.status}).`);
  return response.status === 204 ? null : response.json();
}
async function checkProductionApi() {
  const api = new URL(requireValue("EXPO_PUBLIC_API_URL"));
  if (api.protocol !== "https:" || api.username || api.password || api.search || api.hash || api.pathname !== "/") throw new Error("La API de producción debe ser un origen HTTPS válido.");
  // Endpoint existente; consulta sin token, sin cuentas ni cambios de datos.
  const response = await fetch(api.origin + "/api/mobile/auth/me", { redirect: "error", signal: AbortSignal.timeout(30000) });
  const body = await response.json();
  if (![401, 403].includes(response.status) || body.ok !== false) throw new Error("La API de producción no devolvió el rechazo de sesión esperado.");
}
async function githubRequest(suffix, options = {}) {
  const repository = requireValue("GITHUB_REPOSITORY");
  if (!/^[\w.-]+\/[\w.-]+$/.test(repository)) throw new Error("Repositorio inválido.");
  return requestJson(`https://api.github.com/repos/${repository}${suffix}`, {
    ...options, headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${requireValue("GITHUB_TOKEN")}`, "X-GitHub-Api-Version": "2022-11-28", ...options.headers },
  });
}
async function main(mode) {
  assertReleaseContext(["preflight", "verify-eas-environment", "record-build", "record-bundle"].includes(mode) ? "ENVIAR_A_PRUEBAS_INTERNAS" : "PROMOVER_A_PRODUCCION");
  fs.mkdirSync("release", { recursive: true });
  if (mode === "preflight") {
    validateConfig(readJson("release/config.json"), requireValue("RELEASE_VERSION"));
    requireValue("EXPO_TOKEN");
    await checkProductionApi();
    console.log("Configuración y respuesta no autenticada de la API verificadas.");
  } else if (mode === "verify-eas-environment") {
    try {
      const remote = require("node:util").parseEnv(fs.readFileSync(".env.eas-release.local", "utf8"));
      for (const [actual, expected] of [["EXPO_PUBLIC_API_URL", "EXPECTED_PRODUCTION_API_URL"], ["ANDROID_PACKAGE", "EXPECTED_ANDROID_PACKAGE"], ["EXPO_PROJECT_ID", "EXPECTED_EXPO_PROJECT_ID"], ["EXPO_OWNER", "EXPECTED_EXPO_OWNER"]]) {
        if (!remote[actual] || remote[actual] !== requireValue(expected)) throw new Error(`EAS production tiene un valor ausente o distinto: ${actual}.`);
      }
    } finally {
      fs.unlinkSync(".env.eas-release.local");
    }
    console.log("Las variables públicas de EAS production coinciden con GitHub.");
  } else if (mode === "record-build") {
    const config = validateConfig(readJson("release/config.json"), requireValue("RELEASE_VERSION"));
    const builds = readJson("release/build.json");
    if (!Array.isArray(builds) || builds.length !== 1) throw new Error("Se esperaba un único build Android.");
    const manifest = { sourceSha: requireValue("GITHUB_SHA"), version: config.version, packageName: config.android.package, projectId: config.extra.eas.projectId, owner: config.owner };
    const build = validateBuild(builds[0], manifest);
    fs.writeFileSync("release/manifest.json", JSON.stringify({ ...manifest, buildId: build.buildId, versionCode: build.versionCode }, null, 2) + "\n");
    writeOutput("build_id", build.buildId);
    writeOutput("artifact_url", build.artifactUrl);
  } else if (mode === "record-bundle") {
    const manifest = readJson("release/manifest.json");
    manifest.sha256 = crypto.createHash("sha256").update(fs.readFileSync("release/app.aab")).digest("hex");
    fs.writeFileSync("release/manifest.json", JSON.stringify(manifest, null, 2) + "\n");
  } else if (mode === "verify-promotion") {
    const runId = requireValue("INTERNAL_RUN_ID");
    if (!/^[1-9]\d*$/.test(runId)) throw new Error("Run ID inválido.");
    const manifest = readJson("release/manifest.json");
    if (manifest.sourceSha !== requireValue("GITHUB_SHA") || manifest.version !== requireValue("RELEASE_VERSION") || manifest.packageName !== requireValue("ANDROID_PACKAGE") || manifest.projectId !== requireValue("EXPO_PROJECT_ID") || manifest.owner !== requireValue("EXPO_OWNER")) throw new Error("El artefacto interno no corresponde al main y configuración actuales.");
    if (process.env.INTERNAL_TESTS_PASSED !== "true") throw new Error("Falta confirmar la instalación y pruebas internas.");
    const evidence = new URL(requireValue("SMOKE_TEST_REPORT"));
    if (evidence.protocol !== "https:" || evidence.username || evidence.password) throw new Error("Falta enlace HTTPS al reporte de pruebas internas revisado.");
    const run = await githubRequest(`/actions/runs/${runId}`);
    if (run.conclusion !== "success" || run.event !== "workflow_dispatch" || run.head_branch !== "main" || run.head_sha !== manifest.sourceSha || run.path !== ".github/workflows/android-release.yml") throw new Error("La ejecución de pruebas internas no fue exitosa o no corresponde al artefacto.");
    const hash = crypto.createHash("sha256").update(fs.readFileSync("release/app.aab")).digest("hex");
    if (hash !== manifest.sha256) throw new Error("La huella del .aab difiere del artefacto de pruebas internas.");
    const { execFileSync } = require("node:child_process");
    const build = JSON.parse(execFileSync("npx", ["eas-cli@latest", "build:view", manifest.buildId, "--json"], { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] }));
    validateBuild(build, manifest);
    await checkProductionApi();
    console.log("Build interno, commit, versión y SHA-256 coinciden.");
  } else if (mode === "register-release") {
    const manifest = readJson("release/manifest.json");
    const receipt = readJson("release/promotion.json");
    if (receipt.versionCode !== manifest.versionCode || receipt.committed !== true) throw new Error("Google Play no confirmó la operación de promoción.");
    const result = await githubRequest("/releases", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tag_name: `v${manifest.version}`, target_commitish: manifest.sourceSha, name: `Android ${manifest.version}`, draft: true, prerelease: false,
        body: `Promoción aceptada por la API de Google Play; revisión/disponibilidad pública por confirmar.\n\nCommit: ${manifest.sourceSha}\nversionCode: ${manifest.versionCode}\nEAS build: ${manifest.buildId}\nSHA-256: ${manifest.sha256}\nPruebas internas: ${requireValue("SMOKE_TEST_REPORT")}\n\nPublicar este registro cuando Play Console confirme la disponibilidad.` }),
    });
    console.log(`Registro borrador de GitHub Release: ${result.html_url}`);
  } else throw new Error("Modo de liberación desconocido.");
}
if (require.main === module) main(process.argv[2]).catch((error) => { console.error(error.message); process.exitCode = 1; });
module.exports = { assertReleaseContext, validateConfig, validateBuild };
