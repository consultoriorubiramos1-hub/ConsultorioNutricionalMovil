// Scalar content from clinical forms is displayed without clinical interpretation.
export type HistoryValue = string | number | boolean | null;
export type HistorialTab = "initial" | "progress" | "my-progress";
export type InitialSectionKey =
  | "consultationReason" | "familyHistory" | "personalHistory"
  | "nonPathologicalHistory" | "gynecologicalHistory"
  | "dietaryRecall" | "foodFrequency" | "feedingHabits";

export interface PatientHistory {
  fullName: string | null;
  age: number | null;
  gender: "M" | "F" | null;
  phone: string | null;
  email: string | null;
  birthDate: string | null;
  maritalStatus: string | null;
  occupation: string | null;
  height: number | null;
}
export interface ConsultationReason {
  mainGoal: HistoryValue;
  onsetDate: HistoryValue;
  treatmentExpectations: HistoryValue;
}
export interface FamilyHistory {
  diabetes: HistoryValue;
  hypertension: HistoryValue;
  obesity: HistoryValue;
  dyslipidemia: HistoryValue;
  cardiovascularDisease: HistoryValue;
  cancer: HistoryValue;
  pcos: HistoryValue;
  otherConditions: HistoryValue;
}
export interface PersonalHistory {
  currentDiseases: HistoryValue;
  pastDiseases: HistoryValue;
  surgeries: HistoryValue;
  currentMedications: HistoryValue;
  supplements: HistoryValue;
  allergiesIntolerances: HistoryValue;
}
export interface NonPathologicalHistory {
  physicalActivityType: HistoryValue;
  physicalActivityFrequency: HistoryValue;
  physicalActivityDuration: HistoryValue;
  alcoholConsumption: HistoryValue;
  smoking: HistoryValue;
  sleepQuality: HistoryValue;
  stressLevel: HistoryValue;
  dailyHydration: HistoryValue;
}
export interface GynecologicalHistory {
  menarcheAge: number | null;
  menstrualCycle: HistoryValue;
  cycleDuration: HistoryValue;
  symptoms: HistoryValue;
  pregnancies: number | null;
  contraceptivesUse: HistoryValue;
  contraceptivesType: HistoryValue;
}
export interface DietaryRecall {
  breakfast: HistoryValue;
  morningSnack: HistoryValue;
  lunch: HistoryValue;
  afternoonSnack: HistoryValue;
  dinner: HistoryValue;
  snacksBeverages: HistoryValue;
}
export interface FoodFrequency {
  fruits: HistoryValue;
  vegetables: HistoryValue;
  proteins: HistoryValue;
  dairy: HistoryValue;
  cereals: HistoryValue;
  ultraprocessed: HistoryValue;
  sugars: HistoryValue;
}
export interface FeedingHabits {
  mealSchedules: HistoryValue;
  eatingAnxiety: HistoryValue;
  binges: HistoryValue;
  emotionalEating: HistoryValue;
  eatingOut: HistoryValue;
}
export interface InitialEvaluation {
  evaluationDate: string | null;
  consultationReason: ConsultationReason | null;
  familyHistory: FamilyHistory | null;
  personalHistory: PersonalHistory | null;
  nonPathologicalHistory: NonPathologicalHistory | null;
  gynecologicalHistory: GynecologicalHistory | null;
  dietaryRecall: DietaryRecall | null;
  foodFrequency: FoodFrequency | null;
  feedingHabits: FeedingHabits | null;
}
export interface AnthropometricData {
  height: number | null;
  weight: number | null;
  bodyFatPercentage: number | null;
  visceralFatPercentage: number | null;
  totalWaterPercentage: number | null;
  musclePercentage: number | null;
  waistCircumference: number | null;
  legCircumference: number | null;
  hipCircumference: number | null;
  gluteusCircumference: number | null;
  armCircumference: number | null;
  neckCircumference: number | null;
  bicepsSkinfoldMm: number | null;
  tricepsSkinfoldMm: number | null;
  bloodPressureSystolic: number | null;
  bloodPressureDiastolic: number | null;
  rightArmFat: number | null;
  rightArmMuscle: number | null;
  leftArmFat: number | null;
  leftArmMuscle: number | null;
  rightLegFat: number | null;
  rightLegMuscle: number | null;
  leftLegFat: number | null;
  leftLegMuscle: number | null;
  torsoFat: number | null;
  torsoMuscle: number | null;
}
export interface BiochemicalParams {
  glucose: number | null;
  insulin: number | null;
  homaIr: number | null;
  totalCholesterol: number | null;
  triglycerides: number | null;
  hdlCholesterol: number | null;
  ldlCholesterol: number | null;
  tsh: number | null;
  t3: number | null;
  t4: number | null;
  vitaminD: number | null;
  otherParams: HistoryValue;
}
export interface NutritionalDiagnosis { diagnosis: string | null }
export interface InterventionPlan {
  nutritionalGoals: HistoryValue;
  dietaryStrategy: HistoryValue;
  specificRecommendations: HistoryValue;
  supplementation: HistoryValue;
}
export interface FollowUpData {
  nextAppointmentDate: string | null;
  indicatorsToEvaluate: HistoryValue;
  observations: HistoryValue;
}
export interface FollowUpEvaluation {
  // A local render key; never sent to the API or displayed to the patient.
  key: string;
  evaluationDate: string | null;
  startTime: string | null;
  endTime: string | null;
  status: string | null;
  anthropometric: AnthropometricData | null;
  biochemicalParams: BiochemicalParams | null;
  nutritionalDiagnosis: NutritionalDiagnosis | null;
  interventionPlan: InterventionPlan | null;
  followUp: FollowUpData | null;
}
export interface MedicalHistory {
  patient: PatientHistory;
  initialEvaluation: InitialEvaluation | null;
  followUpEvaluations: FollowUpEvaluation[];
}

export interface DisplayField { label: string; value: string }
export interface DetailSection { title: string; fields: DisplayField[] }
export interface InitialSection extends DetailSection { key: InitialSectionKey }
export interface ProgressIndicator extends DisplayField { evaluationDate: string | null }

export type WeightGoal = "lose" | "gain" | "maintain" | "unknown";
export type WeightProgressStatus = "aligned" | "opposed" | "neutral";
export type WeightProgressSource = "goal" | "bmi" | "none";
export type EvaluationProgressReason =
  | "aligned" | "opposed" | "first-measurement" | "unchanged"
  | "ambiguous-goal" | "goal-changed" | "undated-goal" | "maintenance-without-range"
  | "maintenance-within-range" | "maintenance-outside-range" | "invalid-date" | "missing-weight"
  | "bmi-closer" | "bmi-farther" | "bmi-within-range" | "bmi-same-distance"
  | "missing-age" | "missing-height" | "bmi-age-ineligible" | "bmi-context-excluded" | "bmi-pregnancy-unknown";

export interface WeightReferenceRange { lowerKg: number; upperKg: number }

export interface EvaluationWeightProgress {
  evaluation: FollowUpEvaluation;
  status: WeightProgressStatus;
  reason: EvaluationProgressReason;
  goal: WeightGoal;
  weightDifference: number | null;
  previousEvaluationDate: string | null;
  source: WeightProgressSource;
  referenceRange: WeightReferenceRange | null;
}

export interface EvaluationProgressIndicator {
  status: WeightProgressStatus;
  source: WeightProgressSource;
  label: string;
  description: string;
}

export interface FollowUpCardData {
  evaluation: FollowUpEvaluation;
  progress: EvaluationProgressIndicator;
}
