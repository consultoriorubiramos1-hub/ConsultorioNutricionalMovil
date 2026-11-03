jest.mock("node:child_process", () => ({ execFileSync: jest.fn() }));

const fs = require("node:fs");
const crypto = require("node:crypto");
const YAML = require("yaml");
const { execFileSync } = require("node:child_process");
const { main, assertReleaseContext, validateMergedRelease, validateConfig, validateBuild, validateBundleVerification, validateManifest, validateStoredArtifact, tagCommit, ensureTag } = require("../../scripts/android-release.cjs");
const { verifyReleaseWorkflows } = require("../../scripts/verify-config.cjs");

const config = { version: "1.0.0", owner: "fixture-owner", android: { package: "org.fixture.nutrition" }, extra: { eas: { projectId: "00000000-0000-0000-0000-000000000001" } } };
const expected = { version: "1.0.0", sourceSha: "a".repeat(40), projectId: config.extra.eas.projectId, packageName: config.android.package, owner: config.owner };
const build = { id: "00000000-0000-0000-0000-000000000002", status: "FINISHED", platform: "ANDROID", gitCommitHash: expected.sourceSha, appVersion: "1.0.0", appBuildVersion: "2", app: { id: expected.projectId, ownerAccount: { name: expected.owner } }, appIdentifier: expected.packageName, buildProfile: "production", distribution: "STORE", artifacts: { applicationArchiveUrl: "https://expo.dev/artifacts/eas/fixture.aab" } };
const repository = { id: 1, full_name: "fixture/repository" };
const env = { GITHUB_EVENT_NAME: "pull_request", GITHUB_REF: "refs/heads/main", GITHUB_SHA: expected.sourceSha, GITHUB_REPOSITORY: repository.full_name };
const event = { action: "closed", repository, pull_request: { number: 7, state: "closed", merged: true, merge_commit_sha: expected.sourceSha, base: { ref: "main", repo: repository }, head: { ref: "release/v1.0.0", repo: repository, sha: "c".repeat(40) } } };
const bundle = Buffer.from("fixture de AAB para pruebas de huella, sin compilar");
const hash = crypto.createHash("sha256").update(bundle).digest("hex");
const manifest = { schemaVersion: 1, ...expected, ...validateMergedRelease(event, env), buildId: build.id, versionCode: "2", buildRunId: "123", buildRunAttempt: "1", sha256: hash };
const digest = "d".repeat(64);
const artifact = { id: 456, name: "android-aab-123-1", expired: false, size_in_bytes: 100, workflow_run: { id: 123 }, digest: `sha256:${digest}` };
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));
const missing = () => Object.assign(new Error("No existe"), { status: 404 });

describe("Controles de liberación sin operaciones remotas", () => {
  test("rechaza ejecución local o sin autorización", () => {
    expect(() => assertReleaseContext("ENVIAR_A_PRUEBAS_INTERNAS")).toThrow(/autorización/);
  });
  test("identidad y versión deben ser reales y consistentes", () => {
    expect(validateConfig(config, "1.0.0")).toBe(config);
    expect(() => validateConfig(config, "2.0.0")).toThrow();
    expect(() => validateConfig({ ...config, android: {} }, "1.0.0")).toThrow();
    expect(() => validateConfig(config, "01.0.0")).toThrow();
    expect(validateConfig(config, "1.0.0", expected)).toBe(config);
    for (const field of ["packageName", "projectId", "owner"]) expect(() => validateConfig(config, "1.0.0", { ...expected, [field]: "otro" })).toThrow();
  });
  test("rechaza build de otro commit, versión, proyecto o tipo de artefacto", () => {
    expect(validateBuild(build, expected).versionCode).toBe("2");
    for (const patch of [{ status: "ERRORED" }, { platform: "IOS" }, { gitCommitHash: "b".repeat(40) }, { appVersion: "2.0.0" }, { app: { id: "otro" } }, { appIdentifier: "otro.paquete" }, { buildProfile: "preview" }, { distribution: "INTERNAL" }, { appBuildVersion: "0" }, { artifacts: { buildUrl: "https://expo.dev/fixture.apk" } }]) {
      expect(() => validateBuild({ ...build, ...patch }, expected)).toThrow();
    }
    expect(() => validateBuild(build, { ...expected, versionCode: "3" })).toThrow();
  });

  test("solo acepta la integración de release del mismo repositorio y SHA", () => {
    expect(validateMergedRelease(event, env)).toMatchObject({ version: config.version, sourceSha: expected.sourceSha, sourcePr: 7 });
    for (const patch of [{ GITHUB_EVENT_NAME: "push" }, { GITHUB_EVENT_NAME: "workflow_dispatch" }, { GITHUB_REF: "refs/tags/v1.0.0" }, { GITHUB_SHA: "b".repeat(40) }, { GITHUB_REPOSITORY: "otro/repo" }]) expect(() => validateMergedRelease(event, { ...env, ...patch })).toThrow();
    for (const patch of [{ merged: false }, { state: "open" }, { merge_commit_sha: "b".repeat(40) }, { number: 0 }, { base: { ...event.pull_request.base, ref: "develop" } }, { head: { ...event.pull_request.head, repo: { id: 2, full_name: repository.full_name } } }, { head: { ...event.pull_request.head, repo: { ...repository, full_name: "fork/repository" } } }, { head: { ...event.pull_request.head, repo: null } }]) expect(() => validateMergedRelease({ ...event, pull_request: { ...event.pull_request, ...patch } }, env)).toThrow();
    for (const ref of ["develop", "fix/hotfix-uno", "release/v1.0.0-rc.1", "release/v01.0.0", "release/v1.0.0/extra", "release/v1.0.0\n"]) expect(() => validateMergedRelease({ ...event, pull_request: { ...event.pull_request, head: { ...event.pull_request.head, ref } } }, env)).toThrow();
    expect(() => validateMergedRelease({ ...event, action: "synchronize" }, env)).toThrow();
  });

  test("exige estructura AAB y firma válida, rechaza entradas sin firmar", () => {
    const files = "BundleConfig.pb\nbase/manifest/AndroidManifest.xml\n";
    expect(() => validateBundleVerification(files, "\njar verified.\nWarning: self-signed certificate")).not.toThrow();
    for (const signature of ["jar is unsigned.", "jar verified.\nThis jar contains unsigned entries", "jar verified.\ntreated as unsigned", "signature error", ""]) expect(() => validateBundleVerification(files, signature)).toThrow();
    expect(() => validateBundleVerification("BundleConfig.pb", "jar verified.")).toThrow();
  });

  test("el manifiesto conserva identidad, PR, ejecución y SHA-256", () => {
    expect(validateManifest(manifest, expected, hash)).toBe(manifest);
    for (const patch of [{ sourceSha: "b".repeat(40) }, { version: "2.0.0" }, { packageName: "otro.paquete" }, { projectId: "otro" }, { owner: "otro" }, { schemaVersion: 0 }, { sourceBranch: "develop" }, { sourcePr: 0 }, { buildRunId: "" }, { buildRunAttempt: "0" }, { sha256: "e".repeat(64) }, { versionCode: "0" }, { buildId: "otro" }]) expect(() => validateManifest({ ...manifest, ...patch }, expected, hash)).toThrow();
    expect(() => validateManifest(manifest, { ...expected, buildRunId: "999" }, hash)).toThrow();
  });

  test("rechaza conservación incompleta, caducada o de otra ejecución", () => {
    expect(() => validateStoredArtifact(artifact, manifest, digest)).not.toThrow();
    for (const patch of [{ expired: true }, { size_in_bytes: 0 }, { name: "android-aab-999-1" }, { workflow_run: { id: 999 } }, { digest: `sha256:${hash}` }]) expect(() => validateStoredArtifact({ ...artifact, ...patch }, manifest, digest)).toThrow();
    expect(() => validateStoredArtifact(artifact, manifest, "")).toThrow();
  });

  test("crea el tag del commit exacto e ignora main cambiante", async () => {
    let stored: string | null = null;
    const request = jest.fn(async (path: string, options?: { body: string; method: string }) => {
      if (path === "/git/ref/tags/v1.0.0") {
        if (!stored) throw missing();
        return { object: { type: "commit", sha: stored } };
      }
      expect(path).toBe("/git/refs");
      expect(options?.method).toBe("POST");
      expect(JSON.parse(options!.body)).toEqual({ ref: "refs/tags/v1.0.0", sha: expected.sourceSha });
      stored = expected.sourceSha;
      return {};
    });
    await ensureTag("v1.0.0", expected.sourceSha, request);
    await ensureTag("v1.0.0", expected.sourceSha, request);
    expect(request.mock.calls.filter(([path]) => path === "/git/refs")).toHaveLength(1);
    expect(request.mock.calls.every(([path]) => !path.includes("heads/main"))).toBe(true);
  });

  test("no sobrescribe un tag de otro commit ni confunde errores con ausencia", async () => {
    const request = jest.fn(async () => ({ object: { type: "commit", sha: "b".repeat(40) } }));
    await expect(ensureTag("v1.0.0", expected.sourceSha, request)).rejects.toThrow(/otro commit/);
    expect(request).toHaveBeenCalledTimes(1);
    const denied = jest.fn(async () => { throw Object.assign(new Error("Sin permiso"), { status: 403 }); });
    await expect(ensureTag("v1.0.0", expected.sourceSha, denied)).rejects.toThrow(/Sin permiso/);
    expect(denied).toHaveBeenCalledTimes(1);
  });

  test("recupera una creación concurrente solo si apunta al mismo commit", async () => {
    for (const sha of [expected.sourceSha, "b".repeat(40)]) {
      let created = false;
      const request = jest.fn(async (path: string) => {
        if (path === "/git/refs") { created = true; throw Object.assign(new Error("Conflicto"), { status: 422 }); }
        if (!created) throw missing();
        return { object: { type: "commit", sha } };
      });
      if (sha === expected.sourceSha) await expect(ensureTag("v1.0.0", sha, request)).resolves.toBeUndefined();
      else await expect(ensureTag("v1.0.0", expected.sourceSha, request)).rejects.toThrow(/Conflicto/);
      expect(request.mock.calls.filter(([path]) => path === "/git/refs")).toHaveLength(1);
    }
  });

  test("resuelve tags anotados y rechaza referencias que no son commits", async () => {
    const request = jest.fn(async (path: string) => path.startsWith("/git/ref/") ? { object: { type: "tag", sha: "f".repeat(40) } } : { object: { type: "commit", sha: expected.sourceSha } });
    await expect(tagCommit("v1.0.0", request)).resolves.toBe(expected.sourceSha);
    await expect(tagCommit("v1.0.0", async () => ({ object: { type: "tree", sha: expected.sourceSha } }))).rejects.toThrow();
  });
});

describe("Barreras de los workflows", () => {
  const workflows = Object.fromEntries(fs.readdirSync(".github/workflows").map((file: string) => [file, YAML.parse(fs.readFileSync(`.github/workflows/${file}`, "utf8"))]));
  test("release → CI → AAB conservado → tag; Play manual sin recompilar", () => {
    expect(() => verifyReleaseWorkflows(workflows)).not.toThrow();
  });
  test.each(["trigger", "fork", "quality", "build", "upload", "digest", "checkout", "permissions", "submit", "manual"])("rechaza regresión de %s", (control) => {
    const changed = clone(workflows) as typeof workflows;
    const automatic = changed["android-tag.yml"];
    if (control === "trigger") automatic.on.push = { tags: ["v*.*.*"] };
    if (control === "fork") automatic.jobs.authorize.if = "github.event.pull_request.merged == true";
    if (control === "quality") automatic.jobs.build.needs = ["authorize"];
    if (control === "build") automatic.jobs.tag.if = "always()";
    if (control === "upload") automatic.jobs.build.steps.at(-1).with["if-no-files-found"] = "warn";
    if (control === "digest") delete automatic.jobs.build.outputs.artifact_digest;
    if (control === "checkout") automatic.jobs.build.steps[0].with.ref = "main";
    if (control === "permissions") changed["android-release.yml"].jobs.internal.permissions = { contents: "write" };
    if (control === "submit") automatic.jobs.build.steps[9].run = "npx eas-cli@latest submit --latest";
    if (control === "manual") changed["android-promote.yml"].on.push = { branches: ["main"] };
    expect(() => verifyReleaseWorkflows(changed)).toThrow();
  });
  test.each([
    { base: "main", head: "release/v1.0.0", repository: repository.full_name, version: "1.0.0", result: 0 },
    { base: "main", head: "release/v2.0.0", repository: repository.full_name, version: "1.0.0", result: 1 },
    { base: "main", head: "release/v1.0.0", repository: "fork/repository", version: "1.0.0", result: 1 },
    { base: "main", head: "develop", repository: repository.full_name, version: "1.0.0", result: 1 },
    { base: "", head: "", ref: "release/v1.0.0", version: "1.0.0", result: 0 },
    { base: "", head: "", ref: "release/v2.0.0", version: "1.0.0", result: 1 },
    { base: "release/v1.0.0", head: "fix/preparacion", version: "1.0.0", result: 0 },
    { base: "release/v1.0.0", head: "fix/preparacion", version: "2.0.0", result: 1 },
  ])("ejecuta la política CI para $base/$head/$ref con versión $version", (fixture) => {
    const command = workflows["ci.yml"].jobs["branch-policy"].steps.find((step: { run?: string }) => step.run).run;
    const source = command.match(/node <<'NODE'\n([\s\S]*)\nNODE\s*$/)[1];
    const stopped = {};
    let exitCode = 0;
    try {
      require("node:vm").runInNewContext(source, {
        process: { env: { BASE: fixture.base, HEAD: fixture.head, GITHUB_REPOSITORY: repository.full_name, HEAD_REPOSITORY: fixture.repository, GITHUB_REF_NAME: fixture.ref, LABELS: "[]" }, exit: (code: number) => { exitCode = code; throw stopped; } },
        require: (name: string) => name === "./app.json" ? { expo: { version: fixture.version } } : { version: fixture.version },
        console: { error() {} },
      });
    } catch (error) { if (error !== stopped) throw error; }
    expect(exitCode).toBe(fixture.result);
  });
});

describe("Creación del tag con I/O simulado", () => {
  const originalEnv = process.env;
  const originalFetch = global.fetch;
  let posts: number;
  let remoteTag: string | null;
  let files: Record<string, string | Buffer>;
  beforeEach(() => {
    process.env = { ...originalEnv, ...env, ANDROID_RELEASE_ENABLED: "true", RELEASE_APPROVALS_CONFIGURED: "true", GITHUB_EVENT_PATH: "event.json", GITHUB_RUN_ID: "123", GITHUB_RUN_ATTEMPT: "2", GITHUB_OUTPUT: "outputs", GITHUB_TOKEN: "fixture-token", ANDROID_PACKAGE: expected.packageName, EXPO_PROJECT_ID: expected.projectId, EXPO_OWNER: expected.owner, ARTIFACT_ID: "456", ARTIFACT_DIGEST: digest, RELEASE_VERSION: config.version, EXPO_TOKEN: "fixture-expo-token", EXPO_PUBLIC_API_URL: "https://api.fixture.invalid" };
    posts = 0;
    remoteTag = null;
    files = { "event.json": JSON.stringify(event), "app.json": JSON.stringify({ expo: config }), "package.json": JSON.stringify({ version: config.version }), "release/config.json": JSON.stringify(config), "release/build.json": JSON.stringify([build]), "release/manifest.json": JSON.stringify(manifest), "release/app.aab": bundle, "release/bundle-files.txt": "BundleConfig.pb\nbase/manifest/AndroidManifest.xml\n", "release/signature-verification.txt": "jar verified.\n" };
    const read = fs.readFileSync;
    jest.spyOn(fs, "readFileSync").mockImplementation((...args: unknown[]) => files[String(args[0])] ?? read(...args));
    jest.spyOn(fs, "mkdirSync").mockImplementation(() => undefined);
    jest.spyOn(fs, "appendFileSync").mockImplementation(() => undefined);
    jest.spyOn(fs, "writeFileSync").mockImplementation((...args: unknown[]) => { files[String(args[0])] = String(args[1]); });
    jest.spyOn(fs, "unlinkSync").mockImplementation((path: unknown) => { delete files[String(path)]; });
    execFileSync.mockImplementation((_cmd: string, args: string[]) => args[0] === "rev-parse" ? expected.sourceSha : args[0] === "eas-cli@latest" ? JSON.stringify(build) : "");
    global.fetch = jest.fn(async (url: string, options?: { method: string; body: string }) => {
      let body: unknown;
      let status = 200;
      if (url === "https://api.fixture.invalid/api/mobile/auth/me") { status = 401; body = { ok: false }; }
      else if (url.endsWith("/pulls/7")) body = event.pull_request;
      else if (url.endsWith("/actions/artifacts/456")) body = artifact;
      else if (url.endsWith("/actions/runs/123")) body = { id: 123, status: "completed", conclusion: "success", event: "pull_request", path: ".github/workflows/android-tag.yml", repository, head_repository: repository, head_sha: event.pull_request.head.sha, head_branch: event.pull_request.head.ref };
      else if (url.includes("/actions/runs/123/artifacts?")) body = { artifacts: [artifact, { ...artifact, id: 457, name: "android-aab-123-2" }, { ...artifact, id: 458, name: "android-aab-123-3", expired: true }] };
      else if (url.endsWith("/git/ref/tags/v1.0.0")) { status = remoteTag ? 200 : 404; body = { object: { type: "commit", sha: remoteTag } }; }
      else if (url.endsWith("/git/refs")) { expect(options?.method).toBe("POST"); posts++; remoteTag = JSON.parse(options!.body).sha; body = {}; }
      else throw new Error(`Solicitud inesperada: ${url}`);
      return { ok: status === 200, status, json: async () => body };
    }) as unknown as typeof fetch;
    jest.spyOn(console, "log").mockImplementation(() => undefined);
  });
  afterEach(() => { jest.restoreAllMocks(); process.env = originalEnv; global.fetch = originalFetch; });
  test("reintenta solo tag usando el artefacto de un intento anterior", async () => {
    await main("create-tag");
    expect(posts).toBe(1);
  });
  test("rechaza conflictos de tag antes de iniciar calidad/build", async () => {
    remoteTag = "b".repeat(40);
    await expect(main("authorize-build")).rejects.toThrow(/otro commit/);
    expect(posts).toBe(0);
  });
  test("obtiene la versión de configuración y autoriza sin crear el tag", async () => {
    await main("authorize-build");
    expect(fs.appendFileSync).toHaveBeenCalledWith("outputs", "version=1.0.0\n");
    expect(posts).toBe(0);
  });
  test("rechaza versiones distintas en package.json y rama", async () => {
    files["package.json"] = JSON.stringify({ version: "2.0.0" });
    await expect(main("authorize-build")).rejects.toThrow(/deben coincidir/);
    expect(posts).toBe(0);
  });
  test("preflight conserva los identificadores existentes aunque las variables intenten sustituirlos", async () => {
    process.env.ANDROID_PACKAGE = "org.fixture.otro";
    files["release/config.json"] = JSON.stringify({ ...config, android: { package: process.env.ANDROID_PACKAGE } });
    await expect(main("preflight")).rejects.toThrow(/sustituir/);
    expect(posts).toBe(0);
  });
  test("variables EAS distintas bloquean y se elimina el archivo temporal", async () => {
    files[".env.eas-release.local"] = "EXPO_PUBLIC_API_URL=https://api.fixture.invalid\n";
    process.env.EXPECTED_PRODUCTION_API_URL = "https://otra.fixture.invalid";
    await expect(main("verify-eas-environment")).rejects.toThrow(/ausente o distinto/);
    expect(files[".env.eas-release.local"]).toBeUndefined();
    expect(posts).toBe(0);
  });
  test("un build de otro commit no produce manifiesto nuevo ni tag", async () => {
    files["release/build.json"] = JSON.stringify([{ ...build, gitCommitHash: "b".repeat(40) }]);
    await expect(main("record-build")).rejects.toThrow(/commit/);
    expect(fs.writeFileSync).not.toHaveBeenCalled();
    expect(posts).toBe(0);
  });
  test("un AAB sin firmar impide registrar su huella y crear tag", async () => {
    files["release/signature-verification.txt"] = "jar is unsigned.";
    await expect(main("record-bundle")).rejects.toThrow(/firma/);
    expect(fs.writeFileSync).not.toHaveBeenCalled();
    expect(posts).toBe(0);
  });
  test("un fallo de consulta de conservación impide crear tag", async () => {
    const fetchMock = global.fetch as jest.Mock;
    const request = fetchMock.getMockImplementation()!;
    fetchMock.mockImplementation((url, options) => url.endsWith("/actions/artifacts/456") ? Promise.resolve({ ok: false, status: 503 }) : request(url, options));
    await expect(main("create-tag")).rejects.toThrow(/503/);
    expect(posts).toBe(0);
  });
  test("un PR remoto distinto del evento impide crear tag", async () => {
    const fetchMock = global.fetch as jest.Mock;
    const request = fetchMock.getMockImplementation()!;
    fetchMock.mockImplementation((url, options) => url.endsWith("/pulls/7") ? Promise.resolve({ ok: true, status: 200, json: async () => ({ ...event.pull_request, head: { ...event.pull_request.head, sha: "f".repeat(40) } }) }) : request(url, options));
    await expect(main("create-tag")).rejects.toThrow(/difiere/);
    expect(posts).toBe(0);
  });
  test("el envío manual selecciona el último artefacto no caducado del run exitoso", async () => {
    process.env.GITHUB_EVENT_NAME = "workflow_dispatch";
    process.env.RELEASE_CONFIRMATION = "ENVIAR_A_PRUEBAS_INTERNAS";
    process.env.BUILD_RUN_ID = "123";
    await main("select-build-artifact");
    expect(fs.appendFileSync).toHaveBeenCalledWith("outputs", "artifact_id=457\n");
    expect(posts).toBe(0);
  });
  test("el envío manual verifica el AAB/tag/EAS y devuelve solo su build ID", async () => {
    process.env.GITHUB_EVENT_NAME = "workflow_dispatch";
    process.env.RELEASE_CONFIRMATION = "ENVIAR_A_PRUEBAS_INTERNAS";
    process.env.BUILD_RUN_ID = "123";
    remoteTag = expected.sourceSha;
    await main("verify-submission");
    expect(fs.appendFileSync).toHaveBeenCalledWith("outputs", `build_id=${build.id}\n`);
    expect(execFileSync.mock.calls.some((call: unknown[]) => JSON.stringify(call).includes("build:view"))).toBe(true);
    expect(posts).toBe(0);
  });
  test("no permite envío manual sin el tag del AAB", async () => {
    process.env.GITHUB_EVENT_NAME = "workflow_dispatch";
    process.env.RELEASE_CONFIRMATION = "ENVIAR_A_PRUEBAS_INTERNAS";
    process.env.BUILD_RUN_ID = "123";
    await expect(main("verify-submission")).rejects.toThrow(/tag/);
    expect(fs.appendFileSync).not.toHaveBeenCalled();
  });
  test.each(["checksum", "version", "identity", "run", "artifact", "pr", "checkout", "disabled"])("no crea tag si falla %s", async (control) => {
    if (control === "checksum") files["release/app.aab"] = Buffer.from("alterado");
    if (control === "version") files["app.json"] = JSON.stringify({ expo: { ...config, version: "2.0.0" } });
    if (control === "identity") process.env.ANDROID_PACKAGE = "otro.paquete";
    if (control === "run") process.env.GITHUB_RUN_ID = "999";
    if (control === "artifact") process.env.ARTIFACT_DIGEST = hash;
    if (control === "pr") files["event.json"] = JSON.stringify({ ...event, pull_request: { ...event.pull_request, merged: false } });
    if (control === "checkout") execFileSync.mockReturnValue("b".repeat(40));
    if (control === "disabled") process.env.ANDROID_RELEASE_ENABLED = "false";
    await expect(main("create-tag")).rejects.toThrow();
    expect(posts).toBe(0);
  });
});
