const fs = require("node:fs");

// Herramienta manual para el propietario; no se ejecuta desde workflows.
async function main() {
  const token = process.env.GH_ADMIN_TOKEN;
  if (!token) throw new Error("Falta GH_ADMIN_TOKEN con Administration: write; el conector actual no dispone de ese permiso.");
  const url = "https://api.github.com/repos/consultoriorubiramos1-hub/ConsultorioNutricionalMovil/branches/main/protection";
  const headers = { Accept: "application/vnd.github+json", Authorization: `Bearer ${token}`, "X-GitHub-Api-Version": "2022-11-28" };
  const body = fs.readFileSync(".github/main-protection.json", "utf8");
  const changed = await fetch(url, { method: "PUT", headers: { ...headers, "Content-Type": "application/json" }, body, redirect: "error", signal: AbortSignal.timeout(30000) });
  if (!changed.ok) throw new Error(`GitHub rechazó la protección (HTTP ${changed.status}): ${(await changed.json()).message}`);
  const checked = await fetch(url, { headers, redirect: "error", signal: AbortSignal.timeout(30000) });
  if (!checked.ok) throw new Error(`No se pudo verificar la protección aplicada (HTTP ${checked.status}).`);
  const rule = await checked.json();
  if (!rule.required_status_checks?.strict || !rule.required_status_checks.contexts?.includes("ci-required") || !rule.enforce_admins?.enabled || rule.required_pull_request_reviews?.required_approving_review_count < 1 || !rule.required_pull_request_reviews?.dismiss_stale_reviews || !rule.required_pull_request_reviews?.require_last_push_approval) throw new Error("La respuesta no confirma todas las reglas obligatorias.");
  console.log("main protegida y reglas verificadas mediante GET. No se cambiaron commits de main.");
}
if (require.main === module) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
