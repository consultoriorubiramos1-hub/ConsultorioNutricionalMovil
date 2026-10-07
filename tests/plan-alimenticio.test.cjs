const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

// Contract fixtures stay in tests. The app uses the authenticated real endpoint.
function setup() {
  const calls = [];
  const timers = new Set();
  let respond = async () => ({ ok: true, status: 200, json: async () => ({ ok: true, data: null }) });
  const context = vm.createContext({
    Date, Intl, URL, AbortController,
    process: { env: { EXPO_PUBLIC_API_URL: "https://example.test/" } },
    setTimeout: (callback) => { timers.add(callback); return callback; },
    clearTimeout: (callback) => timers.delete(callback),
    fetch: async (...args) => { calls.push(args); return respond(...args); },
  });
  const cache = new Map();
  function load(relative) {
    const filename = path.resolve(relative);
    if (cache.has(filename)) return cache.get(filename);
    const module = { exports: {} };
    const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
    }).outputText;
    vm.runInContext("(function(require,module,exports){" + compiled + "\n})", context, { filename })(
      (id) => {
        if (id.startsWith(".")) return load(path.join(path.dirname(filename), id + ".ts"));
        throw new Error("Unexpected test import: " + id);
      }, module, module.exports,
    );
    cache.set(filename, module.exports);
    return module.exports;
  }
  return {
    calls, timers, env: context.process.env,
    adapter: load("src/modules/plan-alimenticio/adapters/plan-alimenticio-adapter.ts"),
    format: load("src/modules/plan-alimenticio/utils/plan-alimenticio-format.ts"),
    service: load("src/modules/plan-alimenticio/services/plan-alimenticio-service.ts"),
    response: (body, status = 200) => { respond = async () => ({ ok: status < 400, status, json: async () => body }); },
    fetch: (callback) => { respond = callback; },
  };
}
const plain = (value) => JSON.parse(JSON.stringify(value));

test("adapter tolerates absent, malformed and nullable fields without inventing plan data", () => {
  const { adapter } = setup();
  for (const value of [null, undefined, 3, "bad", [], true]) assert.equal(adapter.nutritionPlanFromApi(value), null);
  const plan = adapter.nutritionPlanFromApi({ id: "id", name: 3, description: null, is_active: "true", meal_times: [], menus: false });
  assert.equal(plan.id, "id");
  assert.equal(plan.name, null);
  assert.equal(plan.isActive, null);
  assert.deepEqual(plain(plan.menus), {});
  assert.deepEqual(plain(plan.mealTimes), {});
  assert.equal(plan.startDate, null);
  assert.equal(adapter.nutritionPlanFromApi({}).description, null);
});

test("adapter converts snake_case and preserves exact multiline indications", () => {
  const { adapter } = setup();
  const description = "  Primera indicación\n\nSegunda indicación\n";
  const plan = adapter.nutritionPlanFromApi({
    name: " Plan asignado ", description, start_date: "2026-10-10T00:00:00.000Z", end_date: null,
    is_active: true, patient_id: 123,
    menus: { MENU_2: { days: ["JUEVES"], meals: { DESAYUNO: { description } } } },
    meal_times: { COMIDA: { start: "14:00:00", end: "15:00:00", label: null } },
  });
  assert.equal(plan.name, "Plan asignado");
  assert.equal(plan.description, description);
  assert.equal(plan.startDate, "2026-10-10");
  assert.equal(plan.endDate, null);
  assert.equal(plan.menus.MENU_2.meals.DESAYUNO.description, description);
  assert.equal(plan.mealTimes.COMIDA.start, "14:00");
  assert.equal(plan.isActive, true);
  assert.equal("patientId" in plan, false);
  assert.equal("patient_id" in plan, false);
});

test("menus keep backend days and omit missing menus instead of using default assignments", () => {
  const { adapter } = setup();
  const menus = adapter.menusFromApi({
    MENU_1: { days: ["DOMINGO", null, 42, "LUNES", "LUNES"], meals: { DESAYUNO: { description: " " }, CENA: { description: 12 } } },
    MENU_2: null, MENU_3: { days: null, meals: [] }, MENU_4: "invalid", MENU_5: {},
  });
  assert.deepEqual(Object.keys(menus), ["MENU_1", "MENU_3"]);
  assert.deepEqual(plain(menus.MENU_1.days), ["DOMINGO", "LUNES"]);
  assert.deepEqual(plain(menus.MENU_3.days), []);
  assert.equal(menus.MENU_1.meals.DESAYUNO.description, null);
  assert.equal(menus.MENU_1.meals.CENA.description, null);
  assert.equal(menus.MENU_1.meals.COMIDA, undefined);
});

test("JSON-encoded nested objects and broken JSON are handled safely", () => {
  const { adapter } = setup();
  assert.deepEqual(plain(adapter.menusFromApi('{"MENU_4":{"days":["SABADO"],"meals":{}}}').MENU_4.days), ["SABADO"]);
  assert.equal(adapter.mealTimesFromApi('{"CENA":{"start":"19:00"}}').CENA.start, "19:00");
  for (const value of [null, "{", "null", "[]", 7]) {
    assert.deepEqual(plain(adapter.menusFromApi(value)), {});
    assert.deepEqual(plain(adapter.mealTimesFromApi(value)), {});
  }
});

test("schedules validate times and display free choice only when colacion has no schedule", () => {
  const { adapter, format } = setup();
  const times = adapter.mealTimesFromApi({
    DESAYUNO: { start: "08:00", end: "09:00", label: "8-9 AM" },
    COLACION: { start: "", end: "", label: "" },
    COMIDA: { start: "25:00", end: "12:30:99", label: "" },
    CENA: { start: "19:00", label: "" },
  });
  assert.equal(format.formatMealTime("DESAYUNO", times.DESAYUNO), "08:00 - 09:00");
  assert.equal(format.formatMealTime("COLACION", times.COLACION), "A elección");
  assert.equal(format.formatMealTime("COMIDA", times.COMIDA), "Sin horario definido");
  assert.equal(format.formatMealTime("ALMUERZO"), "Sin horario definido");
  assert.equal(format.formatMealTime("CENA", times.CENA), "Desde 19:00");
  assert.equal(format.formatMealTime("COLACION", { label: "Después de comer" }), "Después de comer");
  assert.equal(format.formatMealTime("COLACION", { start: "16:00", end: "17:00" }), "16:00 - 17:00");
  assert.equal(format.MEAL_LABELS.COLACION, "COLACIÓN");
});

test("dates use Spanish calendar days without shifting midnight UTC to the previous date", () => {
  const { format } = setup();
  assert.equal(format.calendarDate("2026-10-10T00:00:00.000Z"), "2026-10-10");
  assert.equal(format.formatPlanDate("2026-10-10"), "10 de octubre de 2026");
  assert.equal(format.calendarDate("2024-02-29"), "2024-02-29");
  for (const value of [null, "2026-02-29", "2026-02-30", "2026-13-01", "2026-10-10T99:99", "2026-10-10T00:00junk", "bad"]) {
    assert.equal(format.calendarDate(value), null);
    assert.equal(format.formatPlanDate(value), "Sin fecha definida");
  }
});

test("today follows actual backend assignments and skips ambiguous or undefined days", () => {
  const { format } = setup();
  const localWednesday = new Date(2026, 9, 7, 12);
  assert.equal(format.todayMenu({ MENU_4: { days: ["MIÉRCOLES"] } }, localWednesday), "MENU_4");
  assert.equal(format.todayMenu({ MENU_1: { days: [] } }, localWednesday), null);
  assert.equal(format.todayMenu({ MENU_1: { days: ["MIERCOLES"] }, MENU_2: { days: ["miércoles"] } }, localWednesday), null);
  assert.equal(format.formatDays(["LUNES", "MIERCOLES"]), "Lunes y Miércoles");
  assert.equal(format.formatDays(["SABADO", "DOMINGO"]), "Sábado y Domingo");
  assert.equal(format.formatDays([]), "Días sin definir");
  assert.equal(format.menuLabel("MENU_3"), "Menú 3");
});

test("service calls only the real GET route with Bearer and no patient identifier", async () => {
  const { service, calls, timers } = setup();
  assert.equal(await service.getActiveNutritionPlan(" token "), null);
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], "https://example.test/api/mobile/plan-alimenticio");
  assert.equal(calls[0][1].method, "GET");
  assert.equal(calls[0][1].headers.Authorization, "Bearer token");
  assert.equal(calls[0][1].headers.Accept, "application/json");
  assert.equal(calls[0][1].body, undefined);
  assert.equal(timers.size, 0);
});

test("service adapts real plan records and accepts incomplete plan objects", async () => {
  const harness = setup();
  harness.response({ ok: true, data: { name: "Plan", menus: { MENU_3: { days: ["MARTES"] } } } });
  const plan = await harness.service.getActiveNutritionPlan("token");
  assert.equal(plan.name, "Plan");
  assert.deepEqual(plain(plan.menus.MENU_3.days), ["MARTES"]);
  harness.response({ ok: true, data: {} });
  assert.notEqual(await harness.service.getActiveNutritionPlan("token"), null);
});

test("missing URL and blank token fail before issuing a request", async () => {
  const harness = setup();
  await assert.rejects(harness.service.getActiveNutritionPlan(" "), (error) => error.status === 401);
  for (const url of [undefined, "invalid", "file:///private", "https://user:secret@example.test/"]) {
    harness.env.EXPO_PUBLIC_API_URL = url;
    await assert.rejects(harness.service.getActiveNutritionPlan("token"), /configuración/);
  }
  assert.equal(harness.calls.length, 0);
});

test("401, 403, 404 and 500 remain errors even with HTML responses and never expose server details", async () => {
  const harness = setup();
  for (const status of [401, 403, 404, 500]) {
    harness.fetch(async () => ({ ok: false, status, json: async () => { throw new Error("SQL token secret URL"); } }));
    await assert.rejects(harness.service.getActiveNutritionPlan("token"), (error) => {
      assert.equal(error.status, status);
      assert.doesNotMatch(error.message, /SQL|secret|token|https?:/i);
      return error instanceof harness.service.PlanAlimenticioApiError;
    });
    assert.equal(harness.timers.size, 0);
  }
});

test("malformed JSON, ok:false and invalid data are errors rather than the no-plan state", async () => {
  const harness = setup();
  harness.fetch(async () => ({ ok: true, status: 200, json: async () => { throw new Error("Unexpected HTML"); } }));
  await assert.rejects(harness.service.getActiveNutritionPlan("token"), /respuesta no válida/);
  for (const body of [null, [], {}, { ok: false, data: null, message: "PostgreSQL stack trace Bearer secret" }, { ok: true }, { ok: true, data: [] }, { ok: true, data: "invalid" }]) {
    harness.response(body);
    await assert.rejects(harness.service.getActiveNutritionPlan("token"), (error) => {
      assert.doesNotMatch(error.message, /PostgreSQL|stack|Bearer|secret/);
      return true;
    });
  }
});

test("network errors use a safe actionable message", async () => {
  const harness = setup();
  harness.fetch(async () => { throw new Error("https://private.test SQL secret"); });
  await assert.rejects(harness.service.getActiveNutritionPlan("token"), /No se pudo conectar con el servidor. Verifica tu conexión/);
  assert.equal(harness.timers.size, 0);
});

test("caller cancellation aborts fetch and cleans up the timeout", async () => {
  const harness = setup();
  const controller = new AbortController();
  harness.fetch((_url, options) => new Promise((_resolve, reject) => {
    options.signal.addEventListener("abort", () => reject(new Error("cancelled")), { once: true });
  }));
  const pending = harness.service.getActiveNutritionPlan("token", controller.signal);
  controller.abort();
  await assert.rejects(pending, /cancelled/);
  assert.equal(harness.calls[0][1].signal.aborted, true);
  assert.equal(harness.timers.size, 0);
  await assert.rejects(harness.service.getActiveNutritionPlan("token", controller.signal), /cancelada/);
  assert.equal(harness.calls.length, 1);
});

test("timeout ends a stalled request or response body with a retryable error", async () => {
  for (const stalledBody of [false, true]) {
    const harness = setup();
    const stall = (signal) => new Promise((_resolve, reject) => {
      signal.addEventListener("abort", () => reject(new Error("aborted")), { once: true });
    });
    harness.fetch((_url, options) => stalledBody
      ? Promise.resolve({ ok: true, status: 200, json: () => stall(options.signal) })
      : stall(options.signal));
    const pending = harness.service.getActiveNutritionPlan("token");
    await new Promise(setImmediate);
    for (const callback of harness.timers) callback();
    await assert.rejects(pending, /tardó demasiado/);
    assert.equal(harness.timers.size, 0);
  }
});
