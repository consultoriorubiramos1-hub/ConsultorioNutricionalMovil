import type {
  AnthropometricData, BiochemicalParams, ConsultationReason, DietaryRecall,
  FamilyHistory, FeedingHabits, FollowUpData, FollowUpEvaluation, FoodFrequency,
  GynecologicalHistory, HistoryValue, InitialEvaluation, InterventionPlan,
  MedicalHistory, NonPathologicalHistory, NutritionalDiagnosis, PatientHistory,
  PersonalHistory,
} from "../models/historial.model";
import type {
  FollowUpEvaluationApiDto, InitialEvaluationApiDto, MedicalHistoryApiDto, PatientHistoryApiDto,
} from "../models/historial-api.dto";
import { calendarDate, normalizeGender, normalizeNumber } from "../utils/historial-format";

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown> : null;
}
function jsonRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "string") return record(value);
  try { return record(JSON.parse(value)); } catch { return null; }
}
function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
function scalar(value: unknown): HistoryValue {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return normalizeNumber(value);
  if (typeof value !== "string" || !value.trim()) return null;
  if (/^true$/i.test(value.trim())) return true;
  if (/^false$/i.test(value.trim())) return false;
  return value; // Preserve line breaks and indentation in clinical notes.
}
function time(value: unknown): string | null {
  const raw = text(value);
  return raw && /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(raw) ? raw.slice(0, 5) : null;
}
function fields<K extends string, V>(
  value: unknown, names: Record<K, string>, normalize: (field: unknown) => V,
): Record<K, V> {
  const raw = jsonRecord(value);
  const result = {} as Record<K, V>;
  for (const [key, apiKey] of Object.entries(names) as [K, string][]) {
    result[key] = normalize(raw?.[apiKey]);
  }
  return result;
}
function present<T extends object>(value: T): T | null {
  return Object.values(value).some((field) => field !== null) ? value : null;
}

export function patientFromApi(value: unknown): PatientHistory {
  const dto: PatientHistoryApiDto = record(value) ?? {};
  const names = [dto.first_name, dto.second_name, dto.first_lastname, dto.second_lastname]
    .map(text).filter((name): name is string => name !== null);
  return {
    fullName: text(dto.nombre_completo) ?? (names.join(" ") || null),
    age: normalizeNumber(dto.age), gender: normalizeGender(dto.gender),
    phone: text(dto.phone), email: text(dto.email),
    birthDate: calendarDate(dto.fecha_nacimiento), maritalStatus: text(dto.estado_civil),
    occupation: text(dto.ocupacion), height: normalizeNumber(dto.height),
  };
}

function consultationReasonFromApi(value: unknown): ConsultationReason | null {
  return present(fields(value, {
    mainGoal: "main_goal",
    onsetDate: "onset_date",
    treatmentExpectations: "treatment_expectations",
  }, scalar));
}

function familyHistoryFromApi(value: unknown): FamilyHistory | null {
  return present(fields(value, {
    diabetes: "diabetes",
    hypertension: "hypertension",
    obesity: "obesity",
    dyslipidemia: "dyslipidemia",
    cardiovascularDisease: "cardiovascular_disease",
    cancer: "cancer",
    pcos: "pcos",
    otherConditions: "other_conditions",
  }, scalar));
}

function personalHistoryFromApi(value: unknown): PersonalHistory | null {
  return present(fields(value, {
    currentDiseases: "current_diseases",
    pastDiseases: "past_diseases",
    surgeries: "surgeries",
    currentMedications: "current_medications",
    supplements: "supplements",
    allergiesIntolerances: "allergies_intolerances",
  }, scalar));
}

function nonPathologicalHistoryFromApi(value: unknown): NonPathologicalHistory | null {
  return present(fields(value, {
    physicalActivityType: "physical_activity_type",
    physicalActivityFrequency: "physical_activity_frequency",
    physicalActivityDuration: "physical_activity_duration",
    alcoholConsumption: "alcohol_consumption",
    smoking: "smoking",
    sleepQuality: "sleep_quality",
    stressLevel: "stress_level",
    dailyHydration: "daily_hydration",
  }, scalar));
}

function dietaryRecallFromApi(value: unknown): DietaryRecall | null {
  return present(fields(value, {
    breakfast: "breakfast",
    morningSnack: "morning_snack",
    lunch: "lunch",
    afternoonSnack: "afternoon_snack",
    dinner: "dinner",
    snacksBeverages: "snacks_beverages",
  }, scalar));
}

function foodFrequencyFromApi(value: unknown): FoodFrequency | null {
  return present(fields(value, {
    fruits: "fruits",
    vegetables: "vegetables",
    proteins: "proteins",
    dairy: "dairy",
    cereals: "cereals",
    ultraprocessed: "ultraprocessed",
    sugars: "sugars",
  }, scalar));
}

function feedingHabitsFromApi(value: unknown): FeedingHabits | null {
  return present(fields(value, {
    mealSchedules: "meal_schedules",
    eatingAnxiety: "eating_anxiety",
    binges: "binges",
    emotionalEating: "emotional_eating",
    eatingOut: "eating_out",
  }, scalar));
}

function interventionPlanFromApi(value: unknown): InterventionPlan | null {
  return present(fields(value, {
    nutritionalGoals: "nutritional_goals",
    dietaryStrategy: "dietary_strategy",
    specificRecommendations: "specific_recommendations",
    supplementation: "supplementation",
  }, scalar));
}

function gynecologicalHistoryFromApi(value: unknown): GynecologicalHistory | null {
  const raw = jsonRecord(value);
  return present({
    menarcheAge: normalizeNumber(raw?.menarche_age),
    menstrualCycle: scalar(raw?.menstrual_cycle),
    cycleDuration: scalar(raw?.cycle_duration),
    symptoms: scalar(raw?.symptoms),
    pregnancies: normalizeNumber(raw?.pregnancies),
    contraceptivesUse: scalar(raw?.contraceptives_use),
    contraceptivesType: scalar(raw?.contraceptives_type),
  });
}

export function initialEvaluationFromApi(value: unknown): InitialEvaluation | null {
  const dto: InitialEvaluationApiDto | null = record(value);
  if (!dto) return null;
  return {
    evaluationDate: calendarDate(dto.evaluation_date),
    consultationReason: consultationReasonFromApi(dto.consultation_reason),
    familyHistory: familyHistoryFromApi(dto.family_history),
    personalHistory: personalHistoryFromApi(dto.personal_history),
    nonPathologicalHistory: nonPathologicalHistoryFromApi(dto.non_pathological_history),
    gynecologicalHistory: gynecologicalHistoryFromApi(dto.gynecological_history),
    dietaryRecall: dietaryRecallFromApi(dto.dietary_recall),
    foodFrequency: foodFrequencyFromApi(dto.food_frequency),
    feedingHabits: feedingHabitsFromApi(dto.feeding_habits),
  };
}

export function anthropometricFromApi(value: unknown): AnthropometricData | null {
  return present(fields(value, {
    height: "height",
    weight: "weight",
    bodyFatPercentage: "body_fat_percentage",
    visceralFatPercentage: "visceral_fat_percentage",
    totalWaterPercentage: "total_water_percentage",
    musclePercentage: "muscle_percentage",
    waistCircumference: "waist_circumference",
    legCircumference: "leg_circumference",
    hipCircumference: "hip_circumference",
    gluteusCircumference: "gluteus_circumference",
    armCircumference: "arm_circumference",
    neckCircumference: "neck_circumference",
    bicepsSkinfoldMm: "biceps_skinfold_mm",
    tricepsSkinfoldMm: "triceps_skinfold_mm",
    bloodPressureSystolic: "blood_pressure_systolic",
    bloodPressureDiastolic: "blood_pressure_diastolic",
    rightArmFat: "right_arm_fat",
    rightArmMuscle: "right_arm_muscle",
    leftArmFat: "left_arm_fat",
    leftArmMuscle: "left_arm_muscle",
    rightLegFat: "right_leg_fat",
    rightLegMuscle: "right_leg_muscle",
    leftLegFat: "left_leg_fat",
    leftLegMuscle: "left_leg_muscle",
    torsoFat: "torso_fat",
    torsoMuscle: "torso_muscle",
  }, normalizeNumber));
}

function biochemicalParamsFromApi(value: unknown): BiochemicalParams | null {
  const raw = jsonRecord(value);
  return present({
    ...fields(raw, {
      glucose: "glucose",
      insulin: "insulin",
      homaIr: "homa_ir",
      totalCholesterol: "total_cholesterol",
      triglycerides: "triglycerides",
      hdlCholesterol: "hdl_cholesterol",
      ldlCholesterol: "ldl_cholesterol",
      tsh: "tsh",
      t3: "t3",
      t4: "t4",
      vitaminD: "vitamin_d",
    }, normalizeNumber),
    otherParams: scalar(raw?.other_params),
  });
}
function nutritionalDiagnosisFromApi(value: unknown): NutritionalDiagnosis | null {
  const raw = jsonRecord(value);
  const diagnosis = typeof raw?.diagnosis === "string" && raw.diagnosis.trim()
    ? raw.diagnosis : null;
  return diagnosis ? { diagnosis } : null;
}
function followUpFromApi(value: unknown): FollowUpData | null {
  const raw = jsonRecord(value);
  return present({
    nextAppointmentDate: calendarDate(raw?.next_appointment_date),
    indicatorsToEvaluate: scalar(raw?.indicators_to_evaluate),
    observations: scalar(raw?.observations),
  });
}

export function followUpEvaluationsFromApi(value: unknown): FollowUpEvaluation[] {
  if (!Array.isArray(value)) return [];
  const keys = new Set<string>();
  return value.flatMap((item, index): FollowUpEvaluation[] => {
    const dto: FollowUpEvaluationApiDto | null = record(item);
    if (!dto) return [];
    const id = text(dto.id) ?? (typeof dto.id === "number" && Number.isFinite(dto.id) ? String(dto.id) : null);
    let key = JSON.stringify(id === null ? ["index", index] : ["id", id]);
    if (keys.has(key)) key = JSON.stringify(["duplicate", id, index]);
    keys.add(key);
    return [{
      key, evaluationDate: calendarDate(dto.evaluation_date),
      startTime: time(dto.start_time), endTime: time(dto.end_time), status: text(dto.status),
      anthropometric: anthropometricFromApi(dto.anthropometric),
      biochemicalParams: biochemicalParamsFromApi(dto.biochemical_params),
      nutritionalDiagnosis: nutritionalDiagnosisFromApi(dto.nutritional_diagnosis),
      interventionPlan: interventionPlanFromApi(dto.intervention_plan),
      followUp: followUpFromApi(dto.follow_up),
    }];
  });
}

export function medicalHistoryFromApi(value: unknown): MedicalHistory | null {
  const raw = record(value);
  if (!raw || !["patient", "initialEvaluation", "followUpEvaluations"].some((key) => Object.hasOwn(raw, key))) return null;
  const dto: MedicalHistoryApiDto = raw;
  // Malformed containers are not the valid no-evaluations state.
  if (dto.patient != null && !record(dto.patient)) return null;
  if (dto.initialEvaluation != null && !record(dto.initialEvaluation)) return null;
  if (dto.followUpEvaluations != null && !Array.isArray(dto.followUpEvaluations)) return null;
  return {
    patient: patientFromApi(dto.patient),
    initialEvaluation: initialEvaluationFromApi(dto.initialEvaluation),
    followUpEvaluations: followUpEvaluationsFromApi(dto.followUpEvaluations),
  };
}
