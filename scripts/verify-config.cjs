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
  assert.deepEqual(workflows["ci.yml"].on.pull_request.branches, ["develop", "main"]);
  const required = workflows["ci.yml"].jobs["ci-required"];
  assert.equal(required.needs.length, 6);
  assert.ok(required.needs.includes("integration-tests"));
  assert.ok(required.if.includes("always()"));
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
