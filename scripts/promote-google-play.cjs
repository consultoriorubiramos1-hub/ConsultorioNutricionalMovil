const fs = require("node:fs");
const crypto = require("node:crypto");
const { assertReleaseContext } = require("./android-release.cjs");

async function jsonRequest(url, options) {
  const response = await fetch(url, { ...options, redirect: "error", signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`Google Play/OAuth rechazó la operación (HTTP ${response.status}). Revisar permisos y Play Console.`);
  return response.status === 204 ? null : response.json();
}
async function accessToken() {
  let key;
  try { key = JSON.parse(process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON || "null"); }
  catch { throw new Error("El Secret de cuenta de servicio no contiene JSON válido."); }
  if (key?.type !== "service_account" || !key.private_key || !key.client_email) throw new Error("Falta la cuenta de servicio de Google Play en el entorno protegido.");
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const unsigned = encode({ alg: "RS256", typ: "JWT" }) + "." + encode({
    iss: key.client_email, scope: "https://www.googleapis.com/auth/androidpublisher", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600,
  });
  const assertion = unsigned + "." + crypto.sign("RSA-SHA256", Buffer.from(unsigned), key.private_key).toString("base64url");
  const result = await jsonRequest("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
  });
  if (!result.access_token) throw new Error("OAuth no devolvió un token.");
  return result.access_token;
}
async function main() {
  assertReleaseContext("PROMOVER_A_PRODUCCION");
  const manifest = JSON.parse(fs.readFileSync("release/manifest.json", "utf8"));
  if (manifest.packageName !== process.env.ANDROID_PACKAGE || !/^[1-9]\d*$/.test(manifest.versionCode)) throw new Error("Paquete o versionCode no autorizado.");
  const token = await accessToken();
  const base = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(manifest.packageName)}/edits`;
  const request = (suffix, method = "GET", body) => jsonRequest(base + suffix, {
    method, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const edit = await request("", "POST", {});
  let committed = false;
  try {
    const internal = await request(`/${edit.id}/tracks/internal`);
    if (!internal.releases?.some((release) => release.status === "completed" && release.versionCodes?.includes(manifest.versionCode))) throw new Error("La versión probada no está disponible en el canal interno.");
    const production = await request(`/${edit.id}/tracks/production`);
    if (production.releases?.some((release) => release.status !== "completed")) throw new Error("Existe un rollout o borrador de producción pendiente; resolverlo manualmente.");
    if (production.releases?.some((release) => release.versionCodes?.some((code) => Number(code) >= Number(manifest.versionCode)))) throw new Error("La versión ya está publicada o sería un retroceso.");
    // Promueve el versionCode existente. No recompila ni vuelve a cargar el AAB.
    await request(`/${edit.id}/tracks/production`, "PUT", { track: "production", releases: [{ name: manifest.version, versionCodes: [manifest.versionCode], status: "completed" }] });
    await request(`/${edit.id}:validate`, "POST");
    await request(`/${edit.id}:commit`, "POST");
    committed = true;
    fs.writeFileSync("release/promotion.json", JSON.stringify({ versionCode: manifest.versionCode, committed: true, editId: edit.id, committedAt: new Date().toISOString() }, null, 2) + "\n");
    console.log("Promoción aceptada por Google Play. Confirmar revisión y disponibilidad en Play Console.");
  } finally {
    if (!committed) await request(`/${edit.id}`, "DELETE");
  }
}
if (require.main === module) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
