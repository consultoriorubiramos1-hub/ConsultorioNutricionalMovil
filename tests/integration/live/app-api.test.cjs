const assert = require("node:assert/strict");
const fs = require("node:fs");
const { randomUUID } = require("node:crypto");
const { before, after, test } = require("node:test");
const { readTestEnvironment } = require("../../../scripts/test-environment.cjs");
const { createAppLoader } = require("../../helpers/load-typescript.cjs");

let driver, fixture, auth, citas, apiUrl;
const runId = "mobile-ci-" + randomUUID();
before(async () => {
  const environment = readTestEnvironment();
  apiUrl = environment.apiUrl;
  driver = require(environment.driverPath);
  for (const method of ["prepare", "readAppointment", "cleanup"]) assert.equal(typeof driver[method], "function", `Falta driver.${method}`);
  fixture = await driver.prepare({ runId, apiUrl });
  assert.equal(fixture?.isolation?.kind, "test", "El backend debe verificar su BD de pruebas antes de sembrar fixtures.");
  assert.equal(fixture?.isolation?.apiUrl, apiUrl, "El fixture debe corresponder al mismo backend.");
  assert.equal(typeof fixture?.isolation?.databaseId, "string");
  assert.ok(fixture.isolation.databaseId.length > 0);
  assert.equal(typeof fixture.credentials?.username, "string");
  assert.equal(typeof fixture.credentials?.password, "string");
  assert.ok(fixture.credentials.username && fixture.credentials.password);
  const load = createAppLoader(apiUrl);
  auth = load("src/modules/auth/services/auth.service.ts");
  citas = load("src/modules/citas/services/citas-service.ts");
}, { timeout: 60000 });

// Incluso si prepare falla a mitad, cleanup debe limpiar únicamente runId.
after(async () => {
  if (driver && typeof driver.cleanup === "function") {
    const cleanup = await driver.cleanup({ runId, fixture, apiUrl });
    assert.equal(cleanup?.remainingFixtureRecords, 0, "La limpieza de filas de prueba debe verificarse.");
    assert.equal(cleanup?.remainingReceiptFiles, 0, "La limpieza de comprobantes debe verificarse.");
  }
}, { timeout: 60000 });

test("PI-01 REAL: login App–API válido y rechazo de contraseña incorrecta", { timeout: 60000 }, async () => {
  const valid = await auth.login(fixture.credentials);
  assert.equal(valid.success, true, "La API de pruebas debe autenticar al paciente sintético.");
  assert.ok(valid.token?.length > 0);
  assert.equal(valid.user.rol_id, 2);
  const invalid = await auth.login({ ...fixture.credentials, password: randomUUID() });
  assert.equal(invalid.success, false);
  assert.equal(invalid.status, 401);
});

test("PI-02 REAL: crear, consultar y leer persistencia en BD aislada", { timeout: 120000 }, async () => {
  const login = await auth.login(fixture.credentials);
  assert.equal(login.success, true);
  const slots = await citas.getAvailability(login.token, fixture.appointmentDate);
  assert.ok(slots.length > 0, "El fixture debe provisionar disponibilidad futura real.");
  const bytes = fs.readFileSync(fixture.receiptPath);
  const webFile = new Blob([bytes], { type: "image/png" });
  const input = {
    appointmentDate: fixture.appointmentDate, startTime: slots[0], notes: runId,
    receipt: { uri: "file:///ci-receipt.png", name: "comprobante.png", type: "image/png", size: bytes.length, webFile },
  };
  let created;
  try {
    created = await citas.createAppointment(login.token, input);
    const queried = (await citas.getAppointments(login.token)).find((item) => item.id === created.appointmentId);
    assert.ok(queried, "La nueva cita debe aparecer en una consulta posterior.");
    assert.equal(queried.date, input.appointmentDate);
    assert.equal(queried.startTime, input.startTime);
    assert.equal(queried.notes, runId);
    // El backend externo debe consultar su BD; el GET anterior no lo sustituye.
    const persisted = await driver.readAppointment({ appointmentId: created.appointmentId, runId, fixture });
    assert.equal(persisted?.appointmentId, created.appointmentId);
    assert.equal(persisted?.appointmentDate, input.appointmentDate);
    assert.equal(persisted?.startTime, input.startTime);
    assert.equal(persisted?.notes, runId);
  } finally {
    if (created) await citas.cancelAppointment(login.token, created.appointmentId);
    // after elimina fixtures, comprobantes y filas aun si el POST perdió respuesta.
  }
});
