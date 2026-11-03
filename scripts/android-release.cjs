const fs = require("node:fs");
const crypto = require("node:crypto");
const { execFileSync } = require("node:child_process");
const VERSION = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const SHA = /^[a-f0-9]{40}$/;
const ID = /^[1-9]\d*$/;

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
function validateMergedRelease(event, env = process.env) {
  const pr = event.pull_request;
  const repository = env.GITHUB_REPOSITORY;
  const branch = pr?.head?.ref ?? "";
  const version = branch.slice("release/v".length);
  if (env.GITHUB_EVENT_NAME !== "pull_request" || env.GITHUB_REF !== "refs/heads/main" || event.action !== "closed" || pr?.merged !== true || pr.state !== "closed" || pr.base?.ref !== "main" || !branch.startsWith("release/v") || !VERSION.test(version) || !Number.isSafeInteger(pr.number) || pr.number < 1 || event.repository?.full_name !== repository || pr.head?.repo?.full_name !== repository || pr.base?.repo?.full_name !== repository || !event.repository?.id || pr.head.repo.id !== event.repository.id || pr.base.repo.id !== event.repository.id || !SHA.test(env.GITHUB_SHA ?? "") || pr.merge_commit_sha !== env.GITHUB_SHA) {
    throw new Error("Se requiere un PR release/vX.Y.Z integrado en main del mismo repositorio y del commit exacto del evento.");
  }
  return { version, sourceSha: env.GITHUB_SHA, sourceBranch: branch, sourcePr: pr.number, repository };
}
function assertBuildContext() {
  if (process.env.ANDROID_RELEASE_ENABLED !== "true" || process.env.RELEASE_APPROVALS_CONFIGURED !== "true") throw new Error("Liberación automática deshabilitada o aprobaciones sin configurar.");
  return validateMergedRelease(readJson(requireValue("GITHUB_EVENT_PATH")));
}
function assertCheckout(sourceSha) {
  if (execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim() !== sourceSha) throw new Error("El checkout no coincide con el commit autorizado.");
  execFileSync("git", ["diff", "--exit-code", "HEAD", "--"], { stdio: "pipe" });
}
async function verifyMergedPullRequest(context) {
  const event = readJson(requireValue("GITHUB_EVENT_PATH"));
  const pr = await githubRequest(`/pulls/${context.sourcePr}`);
  const verified = validateMergedRelease({ ...event, pull_request: pr });
  if (verified.sourceBranch !== context.sourceBranch || pr.head.sha !== event.pull_request.head.sha) throw new Error("La procedencia del PR difiere del evento original.");
}
function readJson(file) { return JSON.parse(fs.readFileSync(file, "utf8")); }
function validateConfig(config, expectedVersion, identity) {
  if (!VERSION.test(expectedVersion) || config.version !== expectedVersion) throw new Error("La versión solicitada debe coincidir con expo.version (X.Y.Z).");
  if (!/^[a-zA-Z][\w]*(\.[a-zA-Z][\w]*)+$/.test(config.android?.package ?? "")) throw new Error("Falta android.package definitivo.");
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(config.extra?.eas?.projectId ?? "")) throw new Error("Falta el projectId real de EAS.");
  if (!config.owner) throw new Error("Falta el propietario real de Expo.");
  if (identity && (config.android.package !== identity.packageName || config.extra.eas.projectId !== identity.projectId || config.owner !== identity.owner)) throw new Error("La identidad Expo/Android no coincide con la configuración autorizada.");
  return config;
}
function expectedIdentity() {
  return { packageName: requireValue("ANDROID_PACKAGE"), projectId: requireValue("EXPO_PROJECT_ID"), owner: requireValue("EXPO_OWNER") };
}
function validateVersions(version) {
  if (!VERSION.test(version) || readJson("app.json").expo.version !== version || readJson("package.json").version !== version) throw new Error("La rama release, app.json y package.json deben coincidir en X.Y.Z.");
}
function releaseConfig(version) {
  const config = validateConfig(readJson("release/config.json"), version, expectedIdentity());
  const source = readJson("app.json").expo;
  for (const [actual, original] of [[config.android.package, source.android?.package], [config.owner, source.owner], [config.extra.eas.projectId, source.extra?.eas?.projectId]]) {
    if (original && actual !== original) throw new Error("Las variables de liberación no pueden sustituir los identificadores existentes de app.json.");
  }
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
  if (!response.ok) throw Object.assign(new Error(`La operación remota falló (HTTP ${response.status}).`), { status: response.status });
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
async function tagCommit(tag, request = githubRequest) {
  let ref;
  try { ref = await request(`/git/ref/tags/${tag}`); }
  catch (error) { if (error.status === 404) return null; throw error; }
  let object = ref.object;
  for (let depth = 0; object?.type === "tag" && depth < 10; depth++) {
    if (!SHA.test(object.sha ?? "")) throw new Error("Objeto de tag inválido.");
    object = (await request(`/git/tags/${object.sha}`)).object;
  }
  if (object?.type !== "commit" || !SHA.test(object.sha ?? "")) throw new Error("El tag no apunta a un commit válido.");
  return object.sha;
}
async function ensureTag(tag, sourceSha, request = githubRequest) {
  if (!tag.startsWith("v") || !VERSION.test(tag.slice(1)) || !SHA.test(sourceSha)) throw new Error("Tag o commit inválido.");
  const existing = await tagCommit(tag, request);
  if (existing) {
    if (existing !== sourceSha) throw new Error("El tag existente apunta a otro commit; no se sobrescribe.");
    return;
  }
  try {
    await request("/git/refs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ref: `refs/tags/${tag}`, sha: sourceSha }) });
  } catch (error) {
    // Recupera un POST aceptado cuya respuesta se perdió, o una creación concurrente.
    if (await tagCommit(tag, request) !== sourceSha) throw error;
  }
  if (await tagCommit(tag, request) !== sourceSha) throw new Error("No se pudo confirmar el tag del commit compilado.");
}
function validateBundleVerification(files, signature) {
  const entries = new Set(files.split(/\r?\n/));
  if (!entries.has("BundleConfig.pb") || !entries.has("base/manifest/AndroidManifest.xml")) throw new Error("Estructura AAB incompleta.");
  if (!/^jar verified\./m.test(signature) || /unsigned entries|jar is unsigned|treated as unsigned/i.test(signature)) throw new Error("El AAB no tiene una firma íntegra verificada.");
}
function bundleHash() { return crypto.createHash("sha256").update(fs.readFileSync("release/app.aab")).digest("hex"); }
function validateManifest(manifest, expected, hash) {
  for (const [name, value] of Object.entries(expected)) {
    if (manifest[name] !== value) throw new Error(`El manifiesto no coincide con la procedencia autorizada: ${name}.`);
  }
  if (manifest.schemaVersion !== 1 || !SHA.test(manifest.sourceSha ?? "") || !VERSION.test(manifest.version ?? "") || manifest.sourceBranch !== `release/v${manifest.version}` || !Number.isSafeInteger(manifest.sourcePr) || manifest.sourcePr < 1 || !ID.test(manifest.buildRunId ?? "") || !ID.test(manifest.buildRunAttempt ?? "") || !/^[a-f0-9]{64}$/.test(manifest.sha256 ?? "") || manifest.sha256 !== hash || !ID.test(manifest.versionCode ?? "") || Number(manifest.versionCode) > 2100000000 || !/^[a-f0-9-]{36}$/i.test(manifest.buildId ?? "")) throw new Error("Manifiesto, procedencia o SHA-256 del AAB inválidos.");
  return manifest;
}
function validateStoredArtifact(artifact, manifest, expectedDigest) {
  if (artifact.expired !== false || !(artifact.size_in_bytes > 0) || String(artifact.workflow_run?.id) !== manifest.buildRunId || artifact.name !== `android-aab-${manifest.buildRunId}-${manifest.buildRunAttempt}` || !/^[a-f0-9]{64}$/.test(expectedDigest ?? "") || artifact.digest !== `sha256:${expectedDigest}`) throw new Error("GitHub no confirmó la conservación íntegra del artefacto de esta ejecución.");
}
async function verifyBuildRun(runId) {
  if (!ID.test(runId)) throw new Error("Run ID inválido.");
  const run = await githubRequest(`/actions/runs/${runId}`);
  if (String(run.id) !== runId || run.status !== "completed" || run.conclusion !== "success" || run.event !== "pull_request" || run.path !== ".github/workflows/android-tag.yml" || run.repository?.full_name !== requireValue("GITHUB_REPOSITORY") || run.head_repository?.full_name !== requireValue("GITHUB_REPOSITORY")) throw new Error("La ejecución automática de AAB/tag no fue exitosa o tiene otra procedencia.");
  // head_sha/head_branch de un run pull_request pueden describir la rama origen.
  // El commit integrado se contrasta con el PR y el manifiesto, nunca con main actual.
  return run;
}
async function verifyManifestSource(manifest) {
  await verifyBuildRun(manifest.buildRunId);
  const pr = await githubRequest(`/pulls/${manifest.sourcePr}`);
  validateMergedRelease({ action: "closed", repository: pr.base?.repo, pull_request: pr }, { GITHUB_EVENT_NAME: "pull_request", GITHUB_REF: "refs/heads/main", GITHUB_REPOSITORY: requireValue("GITHUB_REPOSITORY"), GITHUB_SHA: manifest.sourceSha });
  if (pr.head.ref !== manifest.sourceBranch || await tagCommit(`v${manifest.version}`) !== manifest.sourceSha) throw new Error("El PR o tag no corresponde al AAB conservado.");
}
async function verifyEasBuild(manifest) {
  requireValue("EXPO_TOKEN");
  const build = JSON.parse(execFileSync("npx", ["eas-cli@latest", "build:view", manifest.buildId, "--json"], { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] }));
  validateBuild(build, manifest);
  await checkProductionApi();
}
async function main(mode) {
  const buildModes = ["authorize-build", "preflight", "verify-eas-environment", "verify-source", "record-build", "record-bundle", "create-tag"];
  const context = buildModes.includes(mode) ? assertBuildContext() : null;
  if (!context) assertReleaseContext(mode === "verify-promotion" ? "PROMOVER_A_PRODUCCION" : "ENVIAR_A_PRUEBAS_INTERNAS");
  fs.mkdirSync("release", { recursive: true });
  if (mode === "authorize-build") {
    assertCheckout(context.sourceSha);
    validateVersions(context.version);
    await verifyMergedPullRequest(context);
    const existing = await tagCommit(`v${context.version}`);
    if (existing && existing !== context.sourceSha) throw new Error("El tag existente apunta a otro commit; no se recompila ni sobrescribe.");
    writeOutput("version", context.version);
  } else if (mode === "preflight") {
    validateVersions(context.version);
    releaseConfig(requireValue("RELEASE_VERSION"));
    if (context.version !== process.env.RELEASE_VERSION) throw new Error("Versión distinta de la rama release.");
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
  } else if (mode === "verify-source") {
    assertCheckout(context.sourceSha);
  } else if (mode === "record-build") {
    assertCheckout(context.sourceSha);
    const config = releaseConfig(context.version);
    const builds = readJson("release/build.json");
    if (!Array.isArray(builds) || builds.length !== 1) throw new Error("Se esperaba un único build Android.");
    const manifest = { schemaVersion: 1, ...context, version: config.version, packageName: config.android.package, projectId: config.extra.eas.projectId, owner: config.owner, buildRunId: requireValue("GITHUB_RUN_ID"), buildRunAttempt: requireValue("GITHUB_RUN_ATTEMPT") };
    const build = validateBuild(builds[0], manifest);
    fs.writeFileSync("release/manifest.json", JSON.stringify({ ...manifest, buildId: build.buildId, versionCode: build.versionCode }, null, 2) + "\n");
    writeOutput("build_id", build.buildId);
    writeOutput("artifact_url", build.artifactUrl);
  } else if (mode === "record-bundle") {
    validateBundleVerification(fs.readFileSync("release/bundle-files.txt", "utf8"), fs.readFileSync("release/signature-verification.txt", "utf8"));
    const manifest = readJson("release/manifest.json");
    manifest.sha256 = bundleHash();
    validateManifest(manifest, { ...context, ...expectedIdentity(), buildRunId: requireValue("GITHUB_RUN_ID") }, manifest.sha256);
    fs.writeFileSync("release/manifest.json", JSON.stringify(manifest, null, 2) + "\n");
  } else if (mode === "create-tag") {
    assertCheckout(context.sourceSha);
    validateVersions(context.version);
    await verifyMergedPullRequest(context);
    const manifest = validateManifest(readJson("release/manifest.json"), { ...context, ...expectedIdentity(), buildRunId: requireValue("GITHUB_RUN_ID") }, bundleHash());
    const artifactId = requireValue("ARTIFACT_ID");
    if (!ID.test(artifactId)) throw new Error("Artifact ID inválido.");
    validateStoredArtifact(await githubRequest(`/actions/artifacts/${artifactId}`), manifest, requireValue("ARTIFACT_DIGEST"));
    await ensureTag(`v${manifest.version}`, manifest.sourceSha);
    console.log(`Tag v${manifest.version} confirmado en ${manifest.sourceSha}; AAB conservado en GitHub Actions.`);
  } else if (mode === "select-build-artifact") {
    const runId = requireValue("BUILD_RUN_ID");
    await verifyBuildRun(runId);
    const artifacts = [];
    for (let page = 1; ; page++) {
      const result = await githubRequest(`/actions/runs/${runId}/artifacts?per_page=100&page=${page}`);
      artifacts.push(...result.artifacts);
      if (result.artifacts.length < 100) break;
    }
    const artifact = artifacts.filter((item) => item.expired === false && new RegExp(`^android-aab-${runId}-[1-9][0-9]*$`).test(item.name)).sort((a, b) => b.id - a.id)[0];
    if (!artifact) throw new Error("No queda un AAB descargable de la ejecución automática.");
    writeOutput("artifact_id", String(artifact.id));
  } else if (mode === "verify-submission") {
    const manifest = validateManifest(readJson("release/manifest.json"), { sourceSha: requireValue("GITHUB_SHA"), version: requireValue("RELEASE_VERSION"), repository: requireValue("GITHUB_REPOSITORY"), buildRunId: requireValue("BUILD_RUN_ID"), ...expectedIdentity() }, bundleHash());
    await verifyManifestSource(manifest);
    await verifyEasBuild(manifest);
    writeOutput("build_id", manifest.buildId);
  } else if (mode === "verify-promotion") {
    const runId = requireValue("INTERNAL_RUN_ID");
    if (!/^[1-9]\d*$/.test(runId)) throw new Error("Run ID inválido.");
    const manifest = validateManifest(readJson("release/manifest.json"), { sourceSha: requireValue("GITHUB_SHA"), version: requireValue("RELEASE_VERSION"), repository: requireValue("GITHUB_REPOSITORY"), ...expectedIdentity() }, bundleHash());
    if (process.env.INTERNAL_TESTS_PASSED !== "true") throw new Error("Falta confirmar la instalación y pruebas internas.");
    const evidence = new URL(requireValue("SMOKE_TEST_REPORT"));
    if (evidence.protocol !== "https:" || evidence.username || evidence.password) throw new Error("Falta enlace HTTPS al reporte de pruebas internas revisado.");
    const run = await githubRequest(`/actions/runs/${runId}`);
    if (run.conclusion !== "success" || run.event !== "workflow_dispatch" || run.head_branch !== "main" || run.head_sha !== manifest.sourceSha || run.path !== ".github/workflows/android-release.yml") throw new Error("La ejecución de pruebas internas no fue exitosa o no corresponde al artefacto.");
    await verifyManifestSource(manifest);
    await verifyEasBuild(manifest);
    console.log("Build interno, commit, versión y SHA-256 coinciden.");
  } else throw new Error("Modo de liberación desconocido.");
}
if (require.main === module) main(process.argv[2]).catch((error) => { console.error(error.message); process.exitCode = 1; });
module.exports = { main, assertReleaseContext, validateMergedRelease, validateConfig, validateBuild, validateBundleVerification, validateManifest, validateStoredArtifact, tagCommit, ensureTag };
