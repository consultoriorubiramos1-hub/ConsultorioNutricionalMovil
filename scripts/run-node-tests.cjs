const fs = require("node:fs");
const { spawnSync } = require("node:child_process");
const files = {
  legacy: ["tests/citas.test.cjs", "tests/historial.test.cjs", "tests/muro.test.cjs", "tests/plan-alimenticio.test.cjs"],
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
