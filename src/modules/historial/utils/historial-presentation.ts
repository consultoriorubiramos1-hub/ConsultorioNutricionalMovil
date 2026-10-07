import type {
  AnthropometricData, DetailSection, DisplayField, FollowUpEvaluation,
  HistoryValue, InitialEvaluation, InitialSection, PatientHistory, ProgressIndicator,
} from "../models/historial.model";
import {
  calendarDate, formatGender, formatHistoryDate, formatNumber, formatValue,
} from "./historial-format";

type FieldSpec<T> = [keyof T, string, string?];
function displayFields<T extends object>(data: T | null, specs: FieldSpec<T>[]): DisplayField[] {
  if (!data) return [];
  return specs.flatMap(([key, label, unit]) => {
    const raw = data[key];
    const value: HistoryValue = typeof raw === "string" || typeof raw === "number" || typeof raw === "boolean"
      ? raw : null;
    const formatted = formatValue(value);
    return formatted === null ? [] : [{ label, value: formatted + (unit ? " " + unit : "") }];
  });
}
function sectionsWithContent(sections: DetailSection[]): DetailSection[] {
  return sections.filter((section) => section.fields.length > 0);
}

export function patientFields(patient: PatientHistory): DisplayField[] {
  const fields = displayFields(patient, [
    ["age", "Edad", "años"], ["phone", "Teléfono"], ["email", "Correo"],
    ["maritalStatus", "Estado civil"], ["occupation", "Ocupación"], ["height", "Estatura", "cm"],
  ]);
  fields.splice(1, 0, { label: "Género", value: formatGender(patient.gender) });
  if (patient.birthDate) fields.push({ label: "Fecha de nacimiento", value: formatHistoryDate(patient.birthDate) });
  return fields;
}

export function initialSections(evaluation: InitialEvaluation): InitialSection[] {
  const consultation = displayFields(evaluation.consultationReason, [
    ["mainGoal", "Objetivo principal"], ["onsetDate", "Desde cuándo"], ["treatmentExpectations", "Expectativas"],
  ]);
  const onset = consultation.find((field) => field.label === "Desde cuándo");
  if (onset && calendarDate(onset.value)) onset.value = formatHistoryDate(onset.value);
  const gyn = displayFields(evaluation.gynecologicalHistory, [
    ["menarcheAge", "Edad de menarca", "años"], ["menstrualCycle", "Ciclo menstrual"],
    ["cycleDuration", "Duración del ciclo"], ["symptoms", "Síntomas"], ["pregnancies", "Embarazos"],
    ["contraceptivesUse", "Uso de anticonceptivos"],
  ]);
  if (evaluation.gynecologicalHistory?.contraceptivesUse !== false) {
    gyn.push(...displayFields(evaluation.gynecologicalHistory, [["contraceptivesType", "Tipo de anticonceptivo"]]));
  }
  const sections: InitialSection[] = [
    { key: "consultationReason", title: "Motivo de consulta", fields: consultation },
    { key: "familyHistory", title: "Antecedentes heredofamiliares", fields: displayFields(evaluation.familyHistory, [
      ["diabetes", "Diabetes"], ["hypertension", "Hipertensión"], ["obesity", "Obesidad"],
      ["dyslipidemia", "Dislipidemia"], ["cardiovascularDisease", "Enfermedad cardiovascular"],
      ["cancer", "Cáncer"], ["pcos", "SOP"], ["otherConditions", "Otros"],
    ]) },
    { key: "personalHistory", title: "Antecedentes personales patológicos", fields: displayFields(evaluation.personalHistory, [
      ["currentDiseases", "Enfermedades actuales"], ["pastDiseases", "Enfermedades previas"],
      ["surgeries", "Cirugías"], ["currentMedications", "Medicamentos actuales"],
      ["supplements", "Suplementos"], ["allergiesIntolerances", "Alergias/intolerancias"],
    ]) },
    { key: "nonPathologicalHistory", title: "Antecedentes no patológicos", fields: displayFields(evaluation.nonPathologicalHistory, [
      ["physicalActivityType", "Actividad física"], ["physicalActivityFrequency", "Frecuencia"],
      ["physicalActivityDuration", "Duración"], ["alcoholConsumption", "Consumo de alcohol"],
      ["smoking", "Tabaquismo"], ["sleepQuality", "Calidad del sueño"],
      ["stressLevel", "Estrés"], ["dailyHydration", "Hidratación"],
    ]) },
    { key: "gynecologicalHistory", title: "Historia ginecológica", fields: gyn },
    { key: "dietaryRecall", title: "Recordatorio de 24 horas", fields: displayFields(evaluation.dietaryRecall, [
      ["breakfast", "Desayuno"], ["morningSnack", "Colación AM"], ["lunch", "Comida"],
      ["afternoonSnack", "Colación PM"], ["dinner", "Cena"], ["snacksBeverages", "Snacks/bebidas"],
    ]) },
    { key: "foodFrequency", title: "Frecuencia de consumo", fields: displayFields(evaluation.foodFrequency, [
      ["fruits", "Frutas"], ["vegetables", "Verduras"], ["proteins", "Proteínas"],
      ["dairy", "Lácteos"], ["cereals", "Cereales"], ["ultraprocessed", "Ultraprocesados"], ["sugars", "Azúcares"],
    ]) },
    { key: "feedingHabits", title: "Hábitos alimentarios", fields: displayFields(evaluation.feedingHabits, [
      ["mealSchedules", "Horarios de comida"], ["eatingAnxiety", "Ansiedad por comer"],
      ["binges", "Atracones"], ["emotionalEating", "Comer emocional"], ["eatingOut", "Comer fuera de casa"],
    ]) },
  ];
  return sections.filter((section) => section.fields.length > 0);
}

export function evaluationSummary(evaluation: FollowUpEvaluation): DisplayField[] {
  return displayFields(evaluation.anthropometric, [
    ["weight", "Peso", "kg"], ["bodyFatPercentage", "Grasa corporal", "%"],
    ["musclePercentage", "Masa muscular", "%"], ["waistCircumference", "Cintura", "cm"],
  ]);
}

export function anthropometricSections(data: AnthropometricData | null): DetailSection[] {
  if (!data) return [];
  const pressure: DisplayField[] = data.bloodPressureSystolic !== null && data.bloodPressureDiastolic !== null
    ? [{ label: "Presión arterial", value: formatNumber(data.bloodPressureSystolic) + " / " + formatNumber(data.bloodPressureDiastolic) + " mmHg" }]
    : displayFields(data, [
      ["bloodPressureSystolic", "Presión sistólica", "mmHg"], ["bloodPressureDiastolic", "Presión diastólica", "mmHg"],
    ]);
  return sectionsWithContent([
    { title: "Mediciones principales", fields: displayFields(data, [
      ["weight", "Peso", "kg"], ["height", "Estatura", "cm"],
      ["bodyFatPercentage", "Grasa corporal", "%"], ["visceralFatPercentage", "Grasa visceral", "%"],
      ["totalWaterPercentage", "Agua corporal", "%"], ["musclePercentage", "Masa muscular", "%"],
    ]) },
    { title: "Circunferencias", fields: displayFields(data, [
      ["waistCircumference", "Cintura", "cm"], ["hipCircumference", "Cadera", "cm"],
      ["gluteusCircumference", "Glúteo", "cm"], ["armCircumference", "Brazo", "cm"],
      ["legCircumference", "Pierna", "cm"], ["neckCircumference", "Cuello", "cm"],
    ]) },
    { title: "Pliegues", fields: displayFields(data, [
      ["bicepsSkinfoldMm", "Bíceps", "mm"], ["tricepsSkinfoldMm", "Tríceps", "mm"],
    ]) },
    { title: "Presión arterial", fields: pressure },
    // Segmental fat/muscle units are not specified by the API contract.
    { title: "Distribución corporal", fields: displayFields(data, [
      ["rightArmFat", "Grasa del brazo derecho"], ["rightArmMuscle", "Músculo del brazo derecho"],
      ["leftArmFat", "Grasa del brazo izquierdo"], ["leftArmMuscle", "Músculo del brazo izquierdo"],
      ["rightLegFat", "Grasa de la pierna derecha"], ["rightLegMuscle", "Músculo de la pierna derecha"],
      ["leftLegFat", "Grasa de la pierna izquierda"], ["leftLegMuscle", "Músculo de la pierna izquierda"],
      ["torsoFat", "Grasa del torso"], ["torsoMuscle", "Músculo del torso"],
    ]) },
  ]);
}

export function evaluationSections(evaluation: FollowUpEvaluation): DetailSection[] {
  const followUp = displayFields(evaluation.followUp, [
    ["indicatorsToEvaluate", "Indicadores a evaluar"], ["observations", "Observaciones"],
  ]);
  if (evaluation.followUp?.nextAppointmentDate) followUp.unshift({
    label: "Próxima cita sugerida", value: formatHistoryDate(evaluation.followUp.nextAppointmentDate),
  });
  return sectionsWithContent([
    ...anthropometricSections(evaluation.anthropometric),
    { title: "Parámetros bioquímicos", fields: displayFields(evaluation.biochemicalParams, [
      ["glucose", "Glucosa"], ["insulin", "Insulina"], ["homaIr", "HOMA-IR"],
      ["totalCholesterol", "Colesterol total"], ["triglycerides", "Triglicéridos"],
      ["hdlCholesterol", "HDL"], ["ldlCholesterol", "LDL"], ["tsh", "TSH"],
      ["t3", "T3"], ["t4", "T4"], ["vitaminD", "Vitamina D"], ["otherParams", "Otros parámetros"],
    ]) },
    { title: "Diagnóstico nutricional", fields: displayFields(evaluation.nutritionalDiagnosis, [["diagnosis", "Diagnóstico"]]) },
    { title: "Plan de intervención", fields: displayFields(evaluation.interventionPlan, [
      ["nutritionalGoals", "Objetivos nutricionales"], ["dietaryStrategy", "Estrategia alimentaria"],
      ["specificRecommendations", "Recomendaciones específicas"], ["supplementation", "Suplementación"],
    ]) },
    { title: "Seguimiento", fields: followUp },
  ]);
}

export function progressIndicators(evaluations: readonly FollowUpEvaluation[]): ProgressIndicator[] {
  const specs: [keyof AnthropometricData, string, string][] = [
    ["weight", "Peso actual", "kg"], ["bodyFatPercentage", "Grasa corporal", "%"],
    ["musclePercentage", "Masa muscular", "%"], ["waistCircumference", "Cintura", "cm"],
  ];
  return specs.flatMap(([key, label, unit]) => {
    const source = evaluations.find((evaluation) => evaluation.anthropometric?.[key] != null);
    const value = source?.anthropometric?.[key];
    return source && value != null
      ? [{ label, value: formatNumber(value) + " " + unit, evaluationDate: source.evaluationDate }] : [];
  });
}

export function weightChange(evaluations: readonly FollowUpEvaluation[]): number | null {
  const weights = evaluations.flatMap((evaluation) => {
    const weight = evaluation.anthropometric?.weight;
    return weight != null ? [weight] : [];
  });
  if (weights.length < 2) return null;
  // Keep the server's newest-first order; avoid decimal floating-point artifacts.
  const difference = weights[0] - weights[weights.length - 1];
  return Number.isFinite(difference) ? Number(difference.toFixed(10)) : null;
}
