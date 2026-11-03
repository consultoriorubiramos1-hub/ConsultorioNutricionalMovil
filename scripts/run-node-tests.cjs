const fs = require("node:fs");
const { spawnSync } = require("node:child_process");
const files = {
  legacy: ["tests/citas.test.cjs", "tests/historial.test.cjs", "tests/muro.test.cjs", "tests/plan-alimenticio.test.cjs", "tests/tooling/export-schema.test.cjs", "tests/tooling/zap-scope.test.cjs", "tests/tooling/rebuild-api.test.cjs", "tests/tooling/prepare-local.test.cjs", "tests/tooling/zap-user.test.cjs", "tests/tooling/emulator-proxy.test.cjs", "tests/tooling/seed-profiles.test.cjs", "tests/tooling/acceptance-preflight.test.cjs", "tests/tooling/acceptance-pa01.test.cjs", "tests/tooling/performance-jmeter.test.cjs"],
  live: ["tests/integration/live/app-api.test.cjs"],
}[process.argv[2]];
if (!files?.length || files.some((file) => !fs.existsSync(file))) {
  console.error("Suite obligatoria ausente.");
  process.exit(1);
}
fs.mkdirSync("test-results", { recursive: true });
const result = spawnSync(process.execPath, [
  "--test", "--test-concurrency=1", "--test-reporter=spec", "--test-reporter-destination=stdout",
  "--test-reporter=junit", `--test-reporter-destination=test-results/${process.argv[2]}.xml`, ...files,
], { stdio: "inherit", env: { ...process.env, TZ: "America/Mexico_City" } });
if (result.error) console.error(result.error.message);
process.exit(result.status ?? 1);
