import type {
  AnthropometricData, DetailSection, DisplayField, EvaluationProgressReason, EvaluationWeightProgress,
  FollowUpCardData, FollowUpEvaluation, HistoryValue, InitialEvaluation, InitialSection,
  PatientHistory, ProgressIndicator, WeightGoal,
} from "../models/historial.model";
import {
  calendarDate, formatGender, formatHistoryDate, formatNumber, formatValue, formatWeightChange,
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

const progressStatusLabels: Record<EvaluationProgressReason, string> = {
  aligned: "En la dirección de tu objetivo",
  opposed: "En dirección contraria a tu objetivo",
  "first-measurement": "Sin medición anterior para comparar",
  unchanged: "Sin cambio de peso",
  "ambiguous-goal": "El objetivo registrado requiere interpretación de tu nutrióloga",
  "goal-changed": "El objetivo cambió durante este periodo",
  "undated-goal": "Hay un objetivo sin fecha válida",
  "maintenance-without-range": "Mantenimiento sin rango definido",
  "maintenance-within-range": "Dentro del rango de mantenimiento indicado",
  "maintenance-outside-range": "Fuera del rango de mantenimiento indicado",
  "invalid-date": "Falta una fecha válida para comparar esta evaluación",
  "missing-weight": "Falta un peso válido en esta evaluación",
  "bmi-closer": "Se acerca a la referencia general de IMC",
  "bmi-farther": "Se aleja de la referencia general de IMC",
  "bmi-within-range": "Dentro de la referencia general de IMC",
  "bmi-same-distance": "Sin cambio en la distancia a la referencia general de IMC",
  "missing-age": "Falta edad o fecha de nacimiento válida para comprobar si aplica el IMC",
  "missing-height": "Falta una estatura válida en centímetros para calcular la referencia",
  "bmi-age-ineligible": "La edad en este periodo requiere una referencia individual",
  "bmi-context-excluded": "El contexto registrado requiere una referencia individual de tu nutrióloga",
  "bmi-pregnancy-unknown": "Falta confirmar ausencia de embarazo actual para usar la referencia de IMC",
};
const weightGoalLabels: Record<WeightGoal, string | null> = {
  lose: "Objetivo: bajar de peso", gain: "Objetivo: subir de peso",
  maintain: "Objetivo: mantener el peso", unknown: null,
};

export function evaluationProgressCards(evaluations: readonly EvaluationWeightProgress[]): FollowUpCardData[] {
  return evaluations.map((result) => {
    const label = (result.weightDifference !== null ? formatWeightChange(result.weightDifference) + " · " : "")
      + progressStatusLabels[result.reason];
    const range = result.referenceRange;
    return {
      evaluation: result.evaluation,
      progress: {
        status: result.status, source: result.source, label,
        description: [
          label, weightGoalLabels[result.goal],
          range ? (result.source === "bmi" ? "Referencia por IMC: " : "Rango de mantenimiento indicado: ")
            + formatNumber(Number(range.lowerKg.toPrecision(12))) + " a " + formatNumber(Number(range.upperKg.toPrecision(12))) + " kg" : null,
          result.source === "bmi" ? "Referencia general de IMC de 18.5 a 24.9; no es un diagnóstico ni un peso ideal personalizado. No sustituye las indicaciones de tu nutrióloga" : null,
          result.previousEvaluationDate ? "Comparado con: " + formatHistoryDate(result.previousEvaluationDate) : null,
        ].filter(Boolean).join(". "),
      },
    };
  });
}
