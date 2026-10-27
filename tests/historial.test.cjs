const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

// Synthetic contract fixtures are confined to tests; the app only queries the real API.
function setup() {
  const calls = [];
  const timers = new Set();
  let response = async () => ({ ok: true, status: 200, json: async () => ({ ok: true, data: { patient: {}, initialEvaluation: null, followUpEvaluations: [] } }) });
  const context = vm.createContext({
    Date, Intl, URL, AbortController,
    process: { env: { EXPO_PUBLIC_API_URL: "https://example.test/" } },
    setTimeout: (callback) => { timers.add(callback); return callback; },
    clearTimeout: (callback) => timers.delete(callback),
    fetch: async (...args) => { calls.push(args); return response(...args); },
  });
  const cache = new Map();
  function load(relativePath) {
    const filename = path.resolve(relativePath);
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
    adapter: load("src/modules/historial/adapters/historial-adapter.ts"),
    format: load("src/modules/historial/utils/historial-format.ts"),
    presentation: load("src/modules/historial/utils/historial-presentation.ts"),
    service: load("src/modules/historial/services/historial-service.ts"),
    respond: (body, status = 200) => { response = async () => ({ ok: status < 400, status, json: async () => body }); },
    fetch: (callback) => { response = callback; },
  };
}
const plain = (value) => JSON.parse(JSON.stringify(value));
const row = (id, date, anthropometric = {}) => ({ id, evaluation_date: date, anthropometric });

test("numeric normalization accepts PostgreSQL decimal strings and preserves zero", () => {
  const { format } = setup();
  for (const [input, expected] of [["70.50", 70.5], [" 0 ", 0], [0, 0], [".5", 0.5], ["1.2e2", 120], [-2, -2]]) {
    assert.equal(format.normalizeNumber(input), expected);
  }
  for (const value of [null, undefined, true, false, "", " ", [], {}, NaN, Infinity, "NaN", "Infinity", "0x10", "1,25", "70 kg", "1e999"]) {
    assert.equal(format.normalizeNumber(value), null);
  }
});

test("calendar dates use Spanish without timezone shifts and reject impossible dates", () => {
  const { format } = setup();
  assert.equal(format.calendarDate("2026-10-07T00:00:00.000Z"), "2026-10-07");
  assert.equal(format.formatHistoryDate("2026-10-07"), "7 de octubre de 2026");
  assert.equal(format.calendarDate("2024-02-29"), "2024-02-29");
  for (const value of [null, "bad", "2026-02-29", "2026-02-30", "2026-13-07", "2026-10-07T99:99", "2026-10-07T00:00junk"]) {
    assert.equal(format.calendarDate(value), null);
    assert.equal(format.formatHistoryDate(value), "Sin fecha registrada");
  }
});

test("gender and Boolean labels never expose raw true/false", () => {
  const { format } = setup();
  assert.equal(format.formatGender(format.normalizeGender(" m ")), "Masculino");
  assert.equal(format.formatGender(format.normalizeGender("F")), "Femenino");
  assert.equal(format.formatGender(format.normalizeGender("unknown")), "No especificado");
  assert.equal(format.formatGender(format.normalizeGender(null)), "No especificado");
  assert.equal(format.formatValue(true), "Sí");
  assert.equal(format.formatValue(false), "No");
  assert.equal(format.formatValue(0), "0");
  assert.equal(format.formatValue(NaN), null);
});

test("patient data uses the real full name, calendar birth date and latest provided height", () => {
  const { adapter, presentation } = setup();
  const patient = adapter.patientFromApi({
    id: 12, user_id: 99, nombre_completo: "Nombre real", first_name: "Otro", first_lastname: "Nombre",
    age: "28", gender: "F", phone: "5551234567", email: "paciente@example.test",
    fecha_nacimiento: "1998-10-10T00:00:00Z", estado_civil: "Soltera", ocupacion: "Profesora", height: "165.5",
  });
  assert.equal(patient.fullName, "Nombre real");
  assert.equal(patient.age, 28);
  assert.equal(patient.height, 165.5);
  assert.equal(patient.birthDate, "1998-10-10");
  assert.equal("id" in patient, false);
  assert.equal("userId" in patient, false);
  const fields = presentation.patientFields(patient);
  assert.equal(fields.find((field) => field.label === "Estatura").value, "165.5 cm");
  assert.equal(fields.find((field) => field.label === "Fecha de nacimiento").value, "10 de octubre de 1998");
  assert.equal(adapter.patientFromApi({ first_name: " Ana ", second_name: null, first_lastname: " Pérez " }).fullName, "Ana Pérez");
  const partial = adapter.patientFromApi(null);
  assert.equal(partial.height, null);
  assert.equal(partial.age, null);
  assert.equal(presentation.patientFields(partial).length, 1);
});

test("no initial evaluation and no follow-ups are valid history states", () => {
  const { adapter, presentation } = setup();
  const history = adapter.medicalHistoryFromApi({ patient: {}, initialEvaluation: null, followUpEvaluations: [] });
  assert.notEqual(history, null);
  assert.equal(history.initialEvaluation, null);
  assert.deepEqual(plain(history.followUpEvaluations), []);
  assert.deepEqual(plain(presentation.progressIndicators(history.followUpEvaluations)), []);
  assert.equal(presentation.weightChange(history.followUpEvaluations), null);
  assert.equal(adapter.medicalHistoryFromApi({ patient: {} }).initialEvaluation, null);
});

test("invalid top-level containers remain distinguishable from valid empty history", () => {
  const { adapter } = setup();
  for (const value of [null, undefined, [], 12, "bad", {}, { unrelated: true }, { patient: true }, { initialEvaluation: [] }, { followUpEvaluations: {} }]) {
    assert.equal(adapter.medicalHistoryFromApi(value), null);
  }
  for (const value of [null, undefined, {}, "bad"]) assert.deepEqual(plain(adapter.followUpEvaluationsFromApi(value)), []);
});

test("initial adapter preserves clinical data while presentation exposes only wellbeing habits and multiline food notes", () => {
  const { adapter, presentation } = setup();
  const note = "  Primera línea\n\nSegunda línea\n";
  const evaluation = adapter.initialEvaluationFromApi({
    evaluation_date: "2026-09-10",
    consultation_reason: { main_goal: note, onset_date: "2026-01-01", treatment_expectations: "Seguimiento" },
    family_history: { diabetes: true, hypertension: false, other_conditions: null },
    personal_history: { current_diseases: note, current_medications: "Registro" },
    non_pathological_history: { physical_activity_type: "Caminata", daily_hydration: "2 litros", smoking: false },
    dietary_recall: { breakfast: note, morning_snack: null, snacks_beverages: "Registro" },
    food_frequency: { fruits: "Diario", vegetables: 3 },
    feeding_habits: { eating_anxiety: false, emotional_eating: "true", eating_out: "Semanal" },
  });
  assert.equal(evaluation.consultationReason.mainGoal, note);
  assert.equal(evaluation.nonPathologicalHistory.dailyHydration, "2 litros");
  assert.equal(evaluation.feedingHabits.eatingAnxiety, false);
  assert.equal(evaluation.feedingHabits.emotionalEating, true);
  const sections = presentation.initialSections(evaluation);
  assert.equal(evaluation.familyHistory.diabetes, true);
  assert.equal(evaluation.familyHistory.hypertension, false);
  assert.equal(evaluation.personalHistory.currentDiseases, note);
  assert.deepEqual(plain(sections.map((section) => section.key)), ["nonPathologicalHistory", "dietaryRecall", "foodFrequency", "feedingHabits"]);
  assert.equal(sections.find((section) => section.key === "dietaryRecall").fields[0].value, note);
  assert.equal(sections.some((section) => section.key === "consultationReason" || section.key === "familyHistory" || section.key === "personalHistory"), false);
  assert.equal(sections.some((section) => section.key === "gynecologicalHistory"), false);
});

test("gynecological contract retains false and zero without exposing clinical cards", () => {
  const { adapter, presentation } = setup();
  for (const value of [null, {}, { symptoms: " ", menstrual_cycle: null }, [], "broken"]) {
    const evaluation = adapter.initialEvaluationFromApi({ gynecological_history: value });
    assert.equal(evaluation.gynecologicalHistory, null);
    assert.equal(presentation.initialSections(evaluation).length, 0);
  }
  const evaluation = adapter.initialEvaluationFromApi({ gynecological_history: {
    menarche_age: "12", pregnancies: "0", contraceptives_use: false, contraceptives_type: "Dato no aplicable",
  } });
  assert.equal(evaluation.gynecologicalHistory.pregnancies, 0);
  assert.equal(evaluation.gynecologicalHistory.contraceptivesUse, false);
  assert.deepEqual(plain(presentation.initialSections(evaluation)), []);
});

test("broken nested objects and incomplete JSON omit empty content instead of creating placeholder cards", () => {
  const { adapter, presentation } = setup();
  const evaluation = adapter.initialEvaluationFromApi({
    personal_history: "{", family_history: [], food_frequency: { fruits: {} },
    consultation_reason: '{"main_goal":"Registro real"}', feeding_habits: false,
  });
  assert.equal(evaluation.personalHistory, null);
  assert.equal(evaluation.familyHistory, null);
  assert.equal(evaluation.foodFrequency, null);
  assert.equal(evaluation.consultationReason.mainGoal, "Registro real");
  assert.equal(presentation.initialSections(evaluation).length, 0);
  assert.equal(adapter.initialEvaluationFromApi(null), null);
  assert.equal(presentation.initialSections(adapter.initialEvaluationFromApi({})).length, 0);
});

test("follow-up adapter preserves backend order, tolerates malformed rows and creates unique render keys", () => {
  const { adapter } = setup();
  const raw = [row(9, "2026-10-07", { weight: "70.50" }), null, row(3, "2026-09-01"), row(9, null), row(null, null)];
  const copy = JSON.stringify(raw);
  const evaluations = adapter.followUpEvaluationsFromApi(raw);
  assert.deepEqual(plain(evaluations.map((evaluation) => evaluation.evaluationDate)), ["2026-10-07", "2026-09-01", null, null]);
  assert.equal(evaluations[0].anthropometric.weight, 70.5);
  assert.equal(new Set(evaluations.map((evaluation) => evaluation.key)).size, evaluations.length);
  assert.equal(JSON.stringify(raw), copy);
  assert.equal("appointmentId" in evaluations[0], false);
});

test("anthropometry groups available measurements and only uses supported units", () => {
  const { adapter, presentation } = setup();
  const data = adapter.anthropometricFromApi({
    height: "165", weight: "70.5", body_fat_percentage: "24.5", visceral_fat_percentage: "5.1",
    total_water_percentage: "55", muscle_percentage: "35.2", waist_circumference: "80",
    biceps_skinfold_mm: "8", blood_pressure_systolic: "120", blood_pressure_diastolic: "80", right_arm_fat: "2.4",
  });
  const sections = presentation.anthropometricSections(data);
  assert.equal(sections.length, 4);
  assert.equal(data.bloodPressureSystolic, 120);
  assert.equal(data.bloodPressureDiastolic, 80);
  assert.equal(sections.some((section) => section.title === "Presión arterial"), false);
  assert.equal(sections.find((section) => section.title === "Distribución corporal").fields[0].value, "2.4");
  assert.equal(sections.find((section) => section.title === "Pliegues").fields[0].value, "8 mm");
  const partial = presentation.anthropometricSections(adapter.anthropometricFromApi({ blood_pressure_systolic: 120 }));
  assert.deepEqual(plain(partial), []);
  assert.equal(adapter.anthropometricFromApi({ weight: "NaN", height: " " }), null);
  assert.deepEqual(plain(presentation.anthropometricSections(null)), []);
});

test("follow-up contract retains labs, diagnosis, intervention and notes while wellbeing presentation excludes them", () => {
  const { adapter, presentation } = setup();
  const note = "Primera indicación\nSegunda indicación";
  const evaluation = adapter.followUpEvaluationsFromApi([{
    ...row(1, "2026-10-07"),
    biochemical_params: { glucose: "90.5", homa_ir: "2.1", vitamin_d: null, other_params: note },
    nutritional_diagnosis: { diagnosis: note },
    intervention_plan: { nutritional_goals: note, dietary_strategy: "Registro", specific_recommendations: note, supplementation: null },
    follow_up: { next_appointment_date: "2026-11-07T00:00:00.000Z", indicators_to_evaluate: "Indicadores", observations: note },
  }])[0];
  const sections = presentation.evaluationSections(evaluation);
  assert.deepEqual(plain(sections), []);
  assert.equal(evaluation.biochemicalParams.glucose, 90.5);
  assert.equal(evaluation.biochemicalParams.vitaminD, null);
  assert.equal(evaluation.nutritionalDiagnosis.diagnosis, note);
  assert.equal(evaluation.interventionPlan.nutritionalGoals, note);
  assert.equal(evaluation.followUp.nextAppointmentDate, "2026-11-07");
  assert.equal(evaluation.followUp.observations, note);
  assert.equal(presentation.evaluationSections(adapter.followUpEvaluationsFromApi([{}])[0]).length, 0);
});

test("each progress indicator finds its own latest real measurement and source date", () => {
  const { adapter, presentation } = setup();
  const evaluations = adapter.followUpEvaluationsFromApi([
    row(3, "2026-10-07", { body_fat_percentage: "24.5" }),
    row(2, "2026-10-01", { weight: "70.5", waist_circumference: "80" }),
    row(1, "2026-09-01", { weight: "74", muscle_percentage: "35.2", waist_circumference: "84" }),
  ]);
  const indicators = presentation.progressIndicators(evaluations);
  assert.equal(indicators.find((item) => item.label === "Peso actual").value, "70.5 kg");
  assert.equal(indicators.find((item) => item.label === "Peso actual").evaluationDate, "2026-10-01");
  assert.equal(indicators.find((item) => item.label === "Grasa corporal").evaluationDate, "2026-10-07");
  assert.equal(indicators.find((item) => item.label === "Masa muscular").value, "35.2 %");
  const onlyWeight = adapter.followUpEvaluationsFromApi([row(1, null, { weight: "70" })]);
  assert.equal(presentation.progressIndicators(onlyWeight).length, 1);
});

test("weight change uses newest and oldest recorded weights without mutating order or judging direction", () => {
  const { adapter, presentation, format } = setup();
  const rows = adapter.followUpEvaluationsFromApi([
    row(4, "2026-10-07"), row(3, "2026-10-01", { weight: "70.2" }),
    row(2, "2026-09-10", { weight: null }), row(1, "2026-09-01", { weight: "73.4" }),
  ]);
  const keys = rows.map((evaluation) => evaluation.key);
  assert.equal(presentation.weightChange(rows), -3.2);
  assert.equal(format.formatWeightChange(presentation.weightChange(rows)), "-3.2 kg");
  assert.deepEqual(rows.map((evaluation) => evaluation.key), keys);
  assert.equal(presentation.weightChange(rows.slice(0, 2)), null);
  assert.equal(presentation.weightChange([]), null);
  assert.equal(format.formatWeightChange(1.5), "+1.5 kg");
  assert.equal(format.formatWeightChange(0), "0 kg");
  const extreme = adapter.followUpEvaluationsFromApi([row(1, null, { weight: 1e308 }), row(2, null, { weight: -1e308 })]);
  assert.equal(presentation.weightChange(extreme), null);
});

test("service calls only authenticated GET /api/mobile/historial without patientId", async () => {
  const { service, calls, timers } = setup();
  const history = await service.getMedicalHistory(" token ");
  assert.equal(history.initialEvaluation, null);
  assert.equal(history.followUpEvaluations.length, 0);
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], "https://example.test/api/mobile/historial");
  assert.equal(calls[0][1].method, "GET");
  assert.equal(calls[0][1].headers.Authorization, "Bearer token");
  assert.equal(calls[0][1].headers.Accept, "application/json");
  assert.equal(calls[0][1].body, undefined);
  assert.equal(timers.size, 0);
});

test("missing URL, invalid URL and blank token fail before sending any request", async () => {
  const harness = setup();
  await assert.rejects(harness.service.getMedicalHistory(" "), (error) => error.status === 401);
  for (const url of [undefined, "invalid", "file:///private", "https://user:secret@example.test/"]) {
    harness.env.EXPO_PUBLIC_API_URL = url;
    await assert.rejects(harness.service.getMedicalHistory("token"), /configuración/);
  }
  assert.equal(harness.calls.length, 0);
});

test("401, 403, 404 and 500 use safe errors even if the server returns HTML", async () => {
  const harness = setup();
  for (const status of [401, 403, 404, 500]) {
    harness.fetch(async () => ({ ok: false, status, json: async () => { throw new Error("PostgreSQL stack token secret"); } }));
    await assert.rejects(harness.service.getMedicalHistory("token"), (error) => {
      assert.equal(error.status, status);
      assert.doesNotMatch(error.message, /PostgreSQL|stack|token|secret|https?:/i);
      return error instanceof harness.service.HistorialApiError;
    });
    assert.equal(harness.timers.size, 0);
  }
});

test("non-JSON, ok:false and invalid data are not treated as valid empty evaluations", async () => {
  const harness = setup();
  harness.fetch(async () => ({ ok: true, status: 200, json: async () => { throw new Error("bad JSON"); } }));
  await assert.rejects(harness.service.getMedicalHistory("token"), /respuesta no válida/);
  for (const body of [null, [], {}, { ok: false, message: "SQL Bearer secret https://internal.test" }, { ok: true }, { ok: true, data: null }, { ok: true, data: [] }, { ok: true, data: {} }, { ok: true, data: { followUpEvaluations: {} } }]) {
    harness.respond(body);
    await assert.rejects(harness.service.getMedicalHistory("token"), (error) => {
      assert.doesNotMatch(error.message, /SQL|Bearer|secret|https?:/i);
      return true;
    });
  }
});

test("network failure exposes only an actionable connection message", async () => {
  const harness = setup();
  harness.fetch(async () => { throw new Error("internal https://private.test PostgreSQL token"); });
  await assert.rejects(harness.service.getMedicalHistory("token"), /No se pudo conectar con el servidor. Verifica tu conexión/);
  assert.equal(harness.timers.size, 0);
});

test("caller cancellation aborts fetch and cleans up timeout listeners", async () => {
  const harness = setup();
  const controller = new AbortController();
  harness.fetch((_url, options) => new Promise((_resolve, reject) => {
    options.signal.addEventListener("abort", () => reject(new Error("cancelled")), { once: true });
  }));
  const pending = harness.service.getMedicalHistory("token", controller.signal);
  controller.abort();
  await assert.rejects(pending, /cancelled/);
  assert.equal(harness.calls[0][1].signal.aborted, true);
  assert.equal(harness.timers.size, 0);
  await assert.rejects(harness.service.getMedicalHistory("token", controller.signal), /cancelada/);
  assert.equal(harness.calls.length, 1);
});

test("timeouts end stalled fetches and stalled JSON bodies with a retryable error", async () => {
  for (const stalledBody of [false, true]) {
    const harness = setup();
    const stall = (signal) => new Promise((_resolve, reject) => {
      signal.addEventListener("abort", () => reject(new Error("aborted")), { once: true });
    });
    harness.fetch((_url, options) => stalledBody
      ? Promise.resolve({ ok: true, status: 200, json: () => stall(options.signal) }) : stall(options.signal));
    const pending = harness.service.getMedicalHistory("token");
    await new Promise(setImmediate);
    for (const callback of harness.timers) callback();
    await assert.rejects(pending, /tardó demasiado/);
    assert.equal(harness.timers.size, 0);
  }
});
