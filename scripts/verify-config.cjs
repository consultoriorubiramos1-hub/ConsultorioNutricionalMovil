const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const YAML = require("yaml");

function check(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr || result.error?.message || "Configuración inválida.");
  return result.stdout;
}
function verifyReleaseWorkflows(workflows) {
  const automatic = workflows["android-tag.yml"];
  const manual = workflows["android-release.yml"];
  const promotion = workflows["android-promote.yml"];
  assert.deepEqual(automatic.on, { pull_request: { branches: ["main"], types: ["closed"] } }, "El AAB debe originarse exclusivamente en el cierre de un PR a main");
  const { authorize, quality, build, tag } = automatic.jobs;
  for (const condition of ["merged == true", "base.ref == 'main'", "startsWith(github.event.pull_request.head.ref, 'release/v')", "head.repo.full_name == github.repository", "base.repo.full_name == github.repository"]) assert.ok(authorize.if.includes(condition), `Falta condición de procedencia: ${condition}`);
  assert.equal(authorize.permissions["pull-requests"], "read");
  assert.ok(authorize.steps.some((step) => step.run === "node scripts/android-release.cjs authorize-build"));
  assert.equal(quality.needs, "authorize");
  assert.equal(quality.uses, "./.github/workflows/ci.yml");
  assert.equal(quality.secrets, undefined, "El CI no recibe Secrets de producción");
  assert.deepEqual(build.needs, ["authorize", "quality"]);
  assert.deepEqual(tag.needs, ["authorize", "quality", "build"]);
  assert.equal(build.environment, "android-internal");
  assert.equal(tag.environment, "android-internal");
  assert.equal(tag.permissions.contents, "write");
  assert.equal(tag.permissions.actions, "read");
  for (const job of [quality, build, tag]) {
    assert.equal(job.if, undefined, "No saltar dependencias fallidas u omitidas");
    assert.equal(job["continue-on-error"], undefined);
  }
  const uploadIndex = build.steps.findIndex((step) => step.uses?.startsWith("actions/upload-artifact@"));
  assert.equal(uploadIndex, build.steps.length - 1, "Conservar el AAB es el último requisito del build");
  const upload = build.steps[uploadIndex];
  assert.equal(upload.if, undefined);
  assert.equal(upload.with["if-no-files-found"], "error");
  assert.equal(upload.with["retention-days"], 90);
  assert.equal(upload.with.name, "android-aab-${{ github.run_id }}-${{ github.run_attempt }}");
  for (const file of ["release/app.aab", "release/manifest.json"]) assert.ok(upload.with.path.split("\n").includes(file));
  assert.equal(build.outputs.artifact_id, "${{ steps.artifact.outputs.artifact-id }}");
  assert.equal(build.outputs.artifact_digest, "${{ steps.artifact.outputs.artifact-digest }}");
  const download = tag.steps.find((step) => step.uses?.startsWith("actions/download-artifact@"));
  assert.equal(download.with["artifact-ids"], "${{ needs.build.outputs.artifact_id }}");
  assert.equal(tag.env.ARTIFACT_DIGEST, "${{ needs.build.outputs.artifact_digest }}");
  assert.equal(tag.steps.at(-1).run, "node scripts/android-release.cjs create-tag");
  const commands = build.steps.map((step) => step.run ?? "").join("\n");
  assert.match(commands, /eas-cli@latest build --platform android --profile production --non-interactive --freeze-credentials --wait --json/);
  for (const control of ["preflight", "verify-eas-environment", "verify-source", "record-build", "record-bundle"]) assert.ok(commands.includes(`android-release.cjs ${control}`));
  assert.ok(commands.indexOf("verify-source") < commands.indexOf("eas-cli@latest build"));
  assert.match(commands, /unzip -t release\/app.aab/);
  assert.match(commands, /jarsigner .* -verify release\/app.aab/);
  assert.doesNotMatch(JSON.stringify(automatic), /eas-cli@latest submit|--auto-submit|promote-google-play|register-release|gh workflow run/);
  for (const [file, workflow] of Object.entries(workflows)) {
    assert.equal(workflow.permissions.contents, "read");
    assert.equal(workflow.on?.push?.tags, undefined, "No compilar a partir de tags");
    assert.notEqual(workflow.permissions.actions, "write");
    for (const [name, job] of Object.entries(workflow.jobs)) {
      if (job.permissions?.contents === "write") assert.ok(file === "android-tag.yml" && name === "tag", "Solo el job tag puede escribir contenido");
      if (["android-tag.yml", "android-release.yml", "android-promote.yml"].includes(file)) {
        for (const [permission, level] of Object.entries(job.permissions ?? {})) {
          if (level === "write") assert.ok(file === "android-tag.yml" && name === "tag" && permission === "contents", "Solo crear el tag requiere escritura");
        }
      }
      assert.notEqual(job.permissions?.actions, "write");
      if (["ci.yml", "android-tag.yml", "android-release.yml", "android-promote.yml"].includes(file)) {
        for (const step of job.steps ?? []) {
          if (step.uses?.startsWith("actions/checkout@")) {
            assert.equal(step.with.ref, "${{ github.sha }}", "Checkout debe usar el commit del evento");
            assert.equal(step.with["persist-credentials"], false);
          }
          if (file === "android-tag.yml") {
            assert.equal(step.if, undefined, "Los pasos automáticos deben propagar fallos");
            assert.equal(step["continue-on-error"], undefined);
          }
        }
      }
    }
  }
  for (const workflow of [manual, promotion]) assert.deepEqual(Object.keys(workflow.on), ["workflow_dispatch"], "Play debe ser exclusivamente manual");
  assert.ok(manual.on.workflow_dispatch.inputs.build_run_id);
  assert.equal(manual.on.workflow_dispatch.inputs.source_tag, undefined);
  const manualCommands = manual.jobs.internal.steps.map((step) => step.run ?? "").join("\n");
  assert.doesNotMatch(manualCommands, /eas-cli@latest build |--latest|register-release/);
  assert.match(manualCommands, /verify-submission/);
  assert.match(manualCommands, /submit --platform android --profile internal --id "\$BUILD_ID"/);
  assert.doesNotMatch(JSON.stringify(promotion), /register-release|contents":"write/);
}
function verify() {
  const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
  const lock = JSON.parse(fs.readFileSync("package-lock.json", "utf8"));
  for (const group of ["dependencies", "devDependencies"]) assert.deepEqual(pkg[group], lock.packages[""][group], `package-lock desactualizado (${group})`);
  const expoMajor = pkg.dependencies.expo.match(/\d+/)[0];
  assert.equal(pkg.devDependencies["jest-expo"].match(/\d+/)[0], expoMajor, "jest-expo debe corresponder al SDK");
  const workflows = {};
  for (const file of fs.readdirSync(".github/workflows")) {
    const source = fs.readFileSync(path.join(".github/workflows", file), "utf8");
    const document = YAML.parseDocument(source, { uniqueKeys: true });
    assert.equal(document.errors.length, 0, `${file}: YAML inválido`);
    const workflow = document.toJS();
    workflows[file] = workflow;
    assert.equal(workflow.permissions?.contents, "read");
    for (const job of Object.values(workflow.jobs)) {
      for (const step of job.steps ?? []) {
        if (step.uses) assert.match(step.uses, /^[\w/-]+@[a-f0-9]{40}$/, "Acción externa sin commit fijado");
      }
    }
  }
  assert.deepEqual(workflows["ci.yml"].on.pull_request.branches, ["develop", "main", "release/**"]);
  assert.deepEqual(workflows["ci.yml"].on.push.branches, ["release/**"]);
  const required = workflows["ci.yml"].jobs["ci-required"];
  const requiredJobs = ["branch-policy", "typecheck", "lint", "unit-tests", "integration-mock"];
  assert.deepEqual(required.needs, requiredJobs, "CI debe exigir las cinco comprobaciones acordadas");
  assert.deepEqual(Object.keys(workflows["ci.yml"].jobs).sort(), [...requiredJobs, "ci-required"].sort(), "No ejecutar jobs de API/BD en el CI automático");
  assert.deepEqual(workflows["ci.yml"].on.workflow_call, {}, "CI reutilizable no requiere Secrets de backend");
  assert.equal(pkg.scripts["test:integration"], "npm run test:integration:mock");
  assert.equal(pkg.scripts.test, "npm run test:unit && npm run test:integration");
  assert.equal(pkg.scripts["test:unit"], "npm run test:unit:jest && npm run test:legacy");
  verifyReleaseWorkflows(workflows);
  assert.ok(required.if.includes("always()"));
  // Ejecuta el agregador real del YAML con resultados controlados, sin red.
  // Debe aprobar los cinco éxitos y rechazar fallos, cancelaciones y omisiones.
  const gate = required.steps[0].run.match(/node <<'NODE'\n([\s\S]*)\nNODE\s*$/)?.[1];
  assert.ok(gate, "No se encontró el agregador obligatorio");
  function gateExits(results) {
    let exitCode = 0;
    const stopped = {};
    try {
      require("node:vm").runInNewContext(gate, {
        require: (name) => {
          assert.equal(name, "node:fs");
          return { appendFileSync() {} };
        },
        process: {
          env: { RESULTS: JSON.stringify(results), GITHUB_STEP_SUMMARY: "unused" },
          exit: (code) => { exitCode = code; throw stopped; },
        },
        console: { error() {} },
      });
    } catch (error) { if (error !== stopped) throw error; }
    return exitCode;
  }
  const successes = Object.fromEntries(requiredJobs.map((name) => [name, { result: "success" }]));
  assert.equal(gateExits(successes), 0);
  for (const name of requiredJobs) {
    for (const result of ["failure", "cancelled", "skipped"]) {
      assert.notEqual(gateExits({ ...successes, [name]: { result } }), 0);
    }
    const absent = { ...successes };
    delete absent[name];
    assert.notEqual(gateExits(absent), 0);
  }
  const eas = JSON.parse(fs.readFileSync("eas.json", "utf8"));
  assert.equal(eas.build.production.android.buildType, "app-bundle");
  assert.equal(eas.cli.appVersionSource, "remote");
  assert.equal(eas.submit.internal.android.track, "internal");
  for (const config of ["jest.config.cjs", "jest.integration.config.cjs"]) {
    const files = JSON.parse(check(process.execPath, [require.resolve("jest/bin/jest"), "--config", config, "--listTests", "--json", "--runInBand"]));
    assert.ok(files.length > 0, `${config}: sin pruebas`);
    console.log(`${config}: ${files.length} archivos de pruebas detectados; NO ejecutados.`);
  }
  function syntax(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) syntax(file);
      else if (/\.(cjs|js)$/.test(file)) check(process.execPath, ["--check", file]);
    }
  }
  syntax("scripts"); syntax("tests");
  for (const file of ["app.config.js", "jest.config.cjs", "jest.integration.config.cjs", "eslint.config.js"]) check(process.execPath, ["--check", file]);
  console.log("Sintaxis, descubrimiento de suites, lockfile y controles CI/EAS verificados. Ningún build o despliegue ejecutado.");
}
if (require.main === module) {
  try { verify(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { verifyReleaseWorkflows };
