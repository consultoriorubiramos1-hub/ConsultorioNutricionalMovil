import { medicalHistoryFromApi } from "@/modules/historial/adapters/historial-adapter";
import { bmiWeightReference } from "@/modules/historial/utils/bmi-weight-reference";
import { evaluationProgressCards } from "@/modules/historial/utils/historial-presentation";
import { evaluationWeightProgress } from "@/modules/historial/utils/weight-progress";

const asOfDate = "2026-10-19";
function history(previous: number, current: number, goal: unknown = null) {
  return medicalHistoryFromApi({
    patient: { age: 30, gender: "M", height: "170" },
    initialEvaluation: { evaluation_date: "2026-01-01", consultation_reason: { main_goal: goal, onset_date: "2026-01-01" } },
    followUpEvaluations: [
      { id: 2, evaluation_date: "2026-03-14", anthropometric: { weight: current } },
      { id: 1, evaluation_date: "2026-02-14", anthropometric: { weight: previous } },
    ],
  })!;
}

describe("Referencia orientativa de IMC cuando no existe una dirección de peso explícita", () => {
  test.each([
    [76.7, 74, "aligned", "bmi-closer"], [74, 76.7, "opposed", "bmi-farther"],
    [48, 50, "aligned", "bmi-closer"], [50, 48, "opposed", "bmi-farther"],
    [60, 65, "aligned", "bmi-within-range"], [65, 60, "aligned", "bmi-within-range"],
    [76.7, 70, "aligned", "bmi-within-range"], [48, 60, "aligned", "bmi-within-range"],
    [70, 74, "opposed", "bmi-farther"], [60, 50, "opposed", "bmi-farther"],
  ])("%s a %s kg: %s (%s)", (previous, current, status, reason) => {
    const result = evaluationWeightProgress(history(previous, current), asOfDate);
    expect(result[0]).toMatchObject({ status, reason, source: "bmi", goal: "unknown" });
    expect(result[1]).toMatchObject({ status: "neutral", reason: "first-measurement" });
  });

  test("calcula los límites con la estatura en metros y respeta ambos límites sin redondearlos a categorías", () => {
    const source = history(80, 74);
    const reference = bmiWeightReference(source, "2026-02-14", "2026-03-14", asOfDate);
    expect(reference.range?.lowerKg).toBeCloseTo(18.5 * 1.7 ** 2, 10);
    expect(reference.range?.upperKg).toBeCloseTo(24.9 * 1.7 ** 2, 10);
    for (const boundary of [18.5 * 1.7 ** 2, 24.9 * 1.7 ** 2]) {
      expect(evaluationWeightProgress(history(80, boundary), asOfDate)[0]).toMatchObject({ status: "aligned", reason: "bmi-within-range" });
    }
  });

  test.each([60, 18.5 * 1.7 ** 2, 24.9 * 1.7 ** 2])("mantener %s kg durante varios meses conserva verde dentro del rango y sus límites", (weight) => {
    const source = history(weight, weight);
    const template = source.followUpEvaluations[0];
    source.followUpEvaluations = ["2026-02-14", "2026-03-14", "2026-04-14"].map((date, index) => ({
      ...template, key: "unchanged-" + index, evaluationDate: date,
    }));
    const result = evaluationWeightProgress(source, asOfDate);
    expect(result.map((item) => item.status)).toEqual(["aligned", "aligned", "neutral"]);
    for (const item of result.slice(0, 2)) {
      expect(item).toMatchObject({ reason: "bmi-within-range", source: "bmi", weightDifference: 0 });
    }
    expect(result[2]).toMatchObject({ status: "neutral", reason: "first-measurement", weightDifference: null });
    expect(evaluationProgressCards(result)[0].progress.label).toBe("0 kg · Dentro de la referencia general de IMC");
  });

  test.each([
    ["Bajar de peso", 64, 65, "opposed"], ["Subir de peso", 65, 64, "opposed"],
    ["Bajar de peso", 65, 65, "neutral"], ["Subir de peso", 65, 65, "neutral"],
    ["Mantener el peso", 65, 65, "neutral"],
  ])("conserva la prioridad de %s dentro del intervalo: %s a %s kg da %s", (goal, previous, current, status) => {
    expect(evaluationWeightProgress(history(previous, current, goal), asOfDate)[0]).toMatchObject({ status, source: "goal" });
  });

  test("un peso sin cambio fuera del intervalo conserva el estado neutro", () => {
    expect(evaluationWeightProgress(history(80, 80), asOfDate)[0]).toMatchObject({ status: "neutral", reason: "unchanged" });
  });

  test.each(["missing-height", "minor", "pregnancy"])("un peso sin cambio dentro del intervalo no habilita IMC cuando no corresponde: %s", (condition) => {
    const source = history(60, 60);
    if (condition === "missing-height") source.patient.height = null;
    if (condition === "minor") source.patient.age = 17;
    if (condition === "pregnancy") source.initialEvaluation!.consultationReason!.treatmentExpectations = "Embarazo actual";
    expect(evaluationWeightProgress(source, asOfDate)[0]).toMatchObject({ status: "neutral", source: "none" });
  });

  test("distancias iguales a lados opuestos del intervalo no inventan una dirección", () => {
    const source = history(18.5 * 1.7 ** 2 - 2, 24.9 * 1.7 ** 2 + 2);
    expect(evaluationWeightProgress(source, asOfDate)[0]).toMatchObject({ status: "neutral", reason: "bmi-same-distance" });
  });

  test.each(["Aumentar de peso", "Subir de peso para mejorar mis hábitos"])("un objetivo explícito %s tiene prioridad sobre el IMC", (goal) => {
    expect(evaluationWeightProgress(history(76.7, 74, goal), asOfDate)[0]).toMatchObject({ status: "opposed", source: "goal", referenceRange: null });
  });
  test("el objetivo de bajar peso también tiene prioridad cuando ya está dentro del intervalo", () => {
    expect(evaluationWeightProgress(history(65, 64, "Bajar de peso"), asOfDate)[0]).toMatchObject({ status: "aligned", source: "goal" });
  });
  test("mantenimiento sin rango no se sustituye por el rango general de IMC", () => {
    expect(evaluationWeightProgress(history(76.7, 74, "Mantener el peso"), asOfDate)[0]).toMatchObject({ status: "neutral", reason: "maintenance-without-range", source: "goal" });
  });
  test.each([[64, "aligned"], [70, "opposed"], [59, "opposed"], [60, "aligned"], [65, "aligned"]])("mantenimiento con rango explícito de 60 a 65 kg: %s kg da %s", (weight, status) => {
    expect(evaluationWeightProgress(history(64, weight, "Mantener el peso entre 60 y 65 kg"), asOfDate)[0])
      .toMatchObject({ status, source: "goal", referenceRange: { lowerKg: 60, upperKg: 65 } });
  });
  test.each(["No bajar de peso", "Bajar o subir de peso", "Tal vez bajar de peso"])("el IMC no anula instrucciones ambiguas o negativas: %s", (goal) => {
    expect(evaluationWeightProgress(history(76.7, 74, goal), asOfDate)[0]).toMatchObject({ status: "neutral", reason: "ambiguous-goal", source: "none" });
  });
  test.each(["Mejorar hábitos", "Control de peso", null])("usa la referencia con datos adecuados y objetivo sin dirección de peso: %s", (goal) => {
    expect(evaluationWeightProgress(history(76.7, 74, goal), asOfDate)[0]).toMatchObject({ status: "aligned", source: "bmi" });
  });

  test.each([null, 0, -170, 1.7, Infinity, 300])("estatura no utilizable %s: neutro y motivo concreto", (height) => {
    const source = history(76.7, 74);
    source.patient.height = height;
    expect(evaluationWeightProgress(source, asOfDate)[0]).toMatchObject({ status: "neutral", reason: "missing-height" });
  });
  test.each([null, NaN, 30.5, -1])("edad no utilizable %s: neutro", (age) => {
    const source = history(76.7, 74);
    source.patient.age = age;
    expect(evaluationWeightProgress(source, asOfDate)[0]).toMatchObject({ status: "neutral", reason: "missing-age" });
  });
  test.each([10, 17, 18, 65, 80])("edad actual %s no acredita la referencia general en todo el periodo", (age) => {
    const source = history(76.7, 74);
    source.patient.age = age;
    expect(evaluationWeightProgress(source, asOfDate)[0]).toMatchObject({ status: "neutral", reason: "bmi-age-ineligible" });
  });
  test("la fecha de nacimiento permite acreditar edad adulta al cumplir 18; los registros previos siguen neutros", () => {
    const source = history(76.7, 74);
    source.patient.birthDate = "2008-02-14";
    expect(evaluationWeightProgress(source, asOfDate)[0]).toMatchObject({ status: "aligned", source: "bmi" });
    source.patient.birthDate = "2008-03-01";
    expect(evaluationWeightProgress(source, asOfDate)[0]).toMatchObject({ status: "neutral", reason: "bmi-age-ineligible" });
  });
  test("la edad actual de un adulto no se aplica retroactivamente a su adolescencia", () => {
    const source = history(76.7, 74);
    source.patient.birthDate = "2000-01-01";
    source.followUpEvaluations[0].evaluationDate = "2017-03-14";
    source.followUpEvaluations[1].evaluationDate = "2017-02-14";
    expect(evaluationWeightProgress(source, asOfDate)[0]).toMatchObject({ status: "neutral", reason: "bmi-age-ineligible" });
  });

  test.each(["Embarazo actual", "Gestante de 20 semanas", "Lactancia", "Anorexia nerviosa", "Bulimia", "Edema", "Ascitis", "Amputación", "Atleta de alto rendimiento", "Ganancia de masa muscular", "IMC no aplicable"])("no aplica IMC con contexto registrado: %s", (note) => {
    const source = history(76.7, 74);
    source.initialEvaluation!.consultationReason!.treatmentExpectations = note;
    expect(evaluationWeightProgress(source, asOfDate)[0]).toMatchObject({ status: "neutral", reason: "bmi-context-excluded" });
  });
  test("un conteo de embarazos no confirma ni descarta embarazo actual", () => {
    const source = history(76.7, 74);
    source.patient.gender = "F";
    for (const pregnancies of [0, 2, null]) {
      source.initialEvaluation!.gynecologicalHistory = {
        menarcheAge: null, menstrualCycle: null, cycleDuration: null, symptoms: null,
        pregnancies, contraceptivesUse: null, contraceptivesType: null,
      };
      expect(evaluationWeightProgress(source, asOfDate)[0]).toMatchObject({ status: "neutral", reason: "bmi-pregnancy-unknown" });
    }
    source.initialEvaluation!.gynecologicalHistory!.symptoms = "Sin embarazo actual";
    expect(evaluationWeightProgress(source, asOfDate)[0]).toMatchObject({ status: "aligned", source: "bmi" });
  });
  test("un embarazo mencionado en el seguimiento impide la referencia, aunque el registro inicial lo descartase", () => {
    const source = history(76.7, 74);
    source.patient.gender = "F";
    source.initialEvaluation!.consultationReason!.treatmentExpectations = "No embarazada";
    source.followUpEvaluations[0].nutritionalDiagnosis = { diagnosis: "Embarazo de 12 semanas" };
    expect(evaluationWeightProgress(source, asOfDate)[0]).toMatchObject({ status: "neutral", reason: "bmi-context-excluded" });
  });
  test.each(["Sin embarazo confirmado", "No embarazada?", "No se confirma: no embarazada"])("no usa una negación ambigua como confirmación: %s", (note) => {
    const source = history(76.7, 74);
    source.patient.gender = "F";
    source.initialEvaluation!.consultationReason!.treatmentExpectations = note;
    expect(evaluationWeightProgress(source, asOfDate)[0]).toMatchObject({ status: "neutral", reason: "bmi-context-excluded" });
  });
  test("una confirmación de ausencia de embarazo sin fecha o posterior a la referencia no acredita todo el periodo", () => {
    const source = history(76.7, 74);
    source.patient.gender = "F";
    source.initialEvaluation!.evaluationDate = null;
    source.initialEvaluation!.consultationReason!.treatmentExpectations = "No embarazada";
    expect(evaluationWeightProgress(source, asOfDate)[0]).toMatchObject({ status: "neutral", reason: "bmi-pregnancy-unknown" });
    source.initialEvaluation!.consultationReason!.treatmentExpectations = null;
    source.followUpEvaluations[0].nutritionalDiagnosis = { diagnosis: "Sin embarazo actual" };
    expect(evaluationWeightProgress(source, asOfDate)[0]).toMatchObject({ status: "neutral", reason: "bmi-pregnancy-unknown" });
  });
  test("una recomendación de medir masa muscular no se confunde con alta musculatura", () => {
    const source = history(76.7, 74);
    source.initialEvaluation!.consultationReason!.treatmentExpectations = "Evaluar masa muscular";
    expect(evaluationWeightProgress(source, asOfDate)[0]).toMatchObject({ status: "aligned", source: "bmi" });
  });
  test("un seguimiento futuro no se usa como contexto clínico de evaluaciones previas", () => {
    const source = history(76.7, 74);
    source.followUpEvaluations.push({ ...source.followUpEvaluations[0], key: "future", evaluationDate: "2026-04-14", anthropometric: null, nutritionalDiagnosis: { diagnosis: "Embarazo actual" } });
    expect(evaluationWeightProgress(source, asOfDate).find((item) => item.evaluation.evaluationDate === "2026-03-14"))
      .toMatchObject({ status: "aligned", source: "bmi" });
  });
  test("al registrar un nuevo objetivo se mantiene neutro el periodo de transición y se usa después", () => {
    const source = history(76.7, 74);
    source.followUpEvaluations[0].interventionPlan = { nutritionalGoals: "Subir de peso", dietaryStrategy: null, specificRecommendations: null, supplementation: null };
    source.followUpEvaluations.unshift({ ...source.followUpEvaluations[0], key: "april", evaluationDate: "2026-04-14", anthropometric: { ...source.followUpEvaluations[0].anthropometric!, weight: 75 }, interventionPlan: null });
    const result = evaluationWeightProgress(source, asOfDate);
    expect(result[0]).toMatchObject({ status: "aligned", source: "goal", goal: "gain" });
    expect(result[1]).toMatchObject({ status: "neutral", reason: "goal-changed" });
  });
  test("explica rango, procedencia y comparación sin diagnosticar ni reutilizar textos de las tarjetas eliminadas", () => {
    const card = evaluationProgressCards(evaluationWeightProgress(history(76.7, 74), asOfDate))[0];
    expect(card.progress.label).toContain("-2.7 kg");
    expect(card.progress.label).toContain("referencia general de IMC");
    expect(card.progress.description).toContain("53.465 a 71.961 kg");
    expect(card.progress.description).toContain("no es un diagnóstico ni un peso ideal personalizado");
    expect(card.progress.description).toContain("14 de febrero de 2026");
    expect(card.progress.description).not.toMatch(/Objetivo de peso no determinado|Sin objetivo comparable|saludable|enfermo/);
  });
});
