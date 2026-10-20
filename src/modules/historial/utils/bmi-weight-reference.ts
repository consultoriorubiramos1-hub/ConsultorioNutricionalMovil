import type { EvaluationProgressReason, MedicalHistory, WeightReferenceRange } from "../models/historial.model";
import { calendarDate } from "./historial-format";

type BmiReference = { range: WeightReferenceRange; reason: null }
  | { range: null; reason: EvaluationProgressReason };

export function normalizedClinicalText(value: unknown): string {
  return typeof value === "string"
    ? value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/\s+/g, " ") : "";
}

export function currentCalendarDate(): string {
  const date = new Date();
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
}

function ageOn(birthDate: string, date: string): number {
  return Number(date.slice(0, 4)) - Number(birthDate.slice(0, 4)) - (date.slice(5) < birthDate.slice(5) ? 1 : 0);
}

function ageBounds(history: MedicalHistory, date: string, asOfDate: string): [number, number] | null {
  const birthDate = calendarDate(history.patient.birthDate);
  if (birthDate) return [ageOn(birthDate, date), ageOn(birthDate, date)];
  const age = history.patient.age;
  if (age === null || !Number.isInteger(age) || age < 0 || date > asOfDate) return null;
  // age is current, not the age at a historical evaluation. With no birth date,
  // use both possible birthday bounds rather than treating a current adult as
  // already adult in every past record.
  const latestBirth = String(Number(asOfDate.slice(0, 4)) - age).padStart(4, "0") + asOfDate.slice(4);
  const youngest = ageOn(latestBirth, date);
  return [youngest, date === asOfDate ? youngest : youngest + 1];
}

interface ClinicalText { text: string; date: string | null }
function clinicalTexts(history: MedicalHistory, throughDate: string): ClinicalText[] {
  const texts: ClinicalText[] = [];
  const add = (date: string | null, values: unknown[]) => {
    for (const value of values) {
      const text = normalizedClinicalText(value);
      if (text) texts.push({ text, date });
    }
  };
  const initial = history.initialEvaluation;
  const initialDate = calendarDate(initial?.evaluationDate);
  if (initial && (!initialDate || initialDate <= throughDate)) {
    add(initialDate, [initial.consultationReason?.mainGoal, initial.consultationReason?.treatmentExpectations,
      initial.personalHistory?.currentDiseases, initial.personalHistory?.pastDiseases, initial.personalHistory?.surgeries,
      initial.gynecologicalHistory?.symptoms, initial.gynecologicalHistory?.menstrualCycle,
      initial.nonPathologicalHistory?.physicalActivityType]);
  }
  for (const evaluation of history.followUpEvaluations) {
    const date = calendarDate(evaluation.evaluationDate);
    if (date && date > throughDate) continue;
    add(date, [evaluation.nutritionalDiagnosis?.diagnosis, evaluation.interventionPlan?.nutritionalGoals,
      evaluation.interventionPlan?.dietaryStrategy, evaluation.interventionPlan?.specificRecommendations,
      evaluation.followUp?.observations]);
  }
  return texts;
}

// References for these conservative eligibility checks:
// https://www.nhs.uk/health-assessment-tools/calculate-your-body-mass-index/calculate-bmi-for-adults/
// https://www.nice.org.uk/guidance/ng246/chapter/Identifying-and-assessing-overweight-obesity-and-central-adiposity (caution at 65+)
// https://www.cdc.gov/bmi/adult-calculator/index.html (height input validation)
// This screens documented limitations; it does not diagnose conditions.
export function bmiWeightReference(
  history: MedicalHistory, previousDate: string, date: string, asOfDate: string,
): BmiReference {
  for (const atDate of [previousDate, date]) {
    const bounds = ageBounds(history, atDate, asOfDate);
    if (!bounds) return { range: null, reason: "missing-age" };
    if (bounds[0] < 18 || bounds[1] >= 65) return { range: null, reason: "bmi-age-ineligible" };
  }
  // The existing Adapter and anthropometry screens express height in cm.
  // A value such as 1.70 must not silently become a height of 1.70 cm.
  const heightCm = history.patient.height;
  if (heightCm === null || !Number.isFinite(heightCm) || heightCm < 91.44 || heightCm > 274.32) {
    return { range: null, reason: "missing-height" };
  }

  const texts = clinicalTexts(history, date);
  const pregnancyDenial = /^(?:(?:la )?paciente )?(?:no (?:esta )?embarazada|sin embarazo(?: actual)?|embarazo actual\s*:\s*no|embarazo descartado)[.!]?$/;
  let pregnancyRuledOut = false;
  for (const { text, date: recordedDate } of texts) {
    for (const clause of text.split(";").map((part) => part.trim())) {
      if (pregnancyDenial.test(clause)) {
        // An undated or later denial cannot establish applicability at the
        // baseline measurement. Positive/uncertain mentions still exclude it.
        if (recordedDate && recordedDate <= previousDate) pregnancyRuledOut = true;
        continue;
      }
      if (/\b(?:embaraz\w*|gestacion\w*|gestante\w*|lactancia|posparto|postparto|puerperio|anorexia|bulimia|tca|amput\w*|edema\w*|ascitis|acondroplasia|escoliosis|osteoporosis|culturis\w*|fisicocultur\w*|sarcopenia)\b|trastorno (?:de la conducta )?alimentari|atleta|alto rendimiento|(?:alta|aumentar|ganar|ganancia de|perdida de) masa muscular|imc no aplicable|no (?:usar|aplicar) (?:el )?imc/.test(clause)) {
        return { range: null, reason: "bmi-context-excluded" };
      }
    }
  }
  // pregnancies is a lifetime count, not a current pregnancy status. Neither
  // zero nor a missing value establishes that the general reference applies.
  if (history.patient.gender !== "M" && !pregnancyRuledOut) {
    return { range: null, reason: "bmi-pregnancy-unknown" };
  }

  const squaredHeight = (heightCm / 100) ** 2;
  return { range: { lowerKg: 18.5 * squaredHeight, upperKg: 24.9 * squaredHeight }, reason: null };
}

export function distanceToWeightRange(weight: number, range: WeightReferenceRange): number {
  // Decimal cleanup only; this is not a clinical tolerance or a weight target.
  return Number(Math.max(range.lowerKg - weight, 0, weight - range.upperKg).toFixed(10));
}
