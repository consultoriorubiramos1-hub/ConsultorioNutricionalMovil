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
  assert.equal(workflows["android-release.yml"].jobs.quality.uses, "./.github/workflows/ci.yml");
  assert.equal(workflows["android-release.yml"].jobs.quality.secrets, undefined);
  assert.equal(workflows["android-release.yml"].jobs.internal.needs, "quality");
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
  assert.deepEqual(workflows["android-tag.yml"].on.push.tags, ["v*.*.*"]);
  assert.ok(workflows["android-release.yml"].on.workflow_dispatch.inputs.source_tag);
  assert.equal(workflows["android-tag.yml"].jobs["trigger-internal"].permissions.actions, "write");
  for (const file of ["android-release.yml", "android-promote.yml"]) {
    assert.deepEqual(Object.keys(workflows[file].on), ["workflow_dispatch"], "Despliegue debe ser exclusivamente manual");
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
try { verify(); } catch (error) { console.error(error.message); process.exitCode = 1; }
