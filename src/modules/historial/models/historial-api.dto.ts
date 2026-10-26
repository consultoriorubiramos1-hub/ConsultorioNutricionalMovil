// API fields are deliberately unknown until the adapter validates them.
export interface PatientHistoryApiDto {
  id?: unknown;
  nombre_completo?: unknown;
  first_name?: unknown;
  second_name?: unknown;
  first_lastname?: unknown;
  second_lastname?: unknown;
  age?: unknown;
  gender?: unknown;
  phone?: unknown;
  email?: unknown;
  fecha_nacimiento?: unknown;
  estado_civil?: unknown;
  ocupacion?: unknown;
  height?: unknown;
}
export interface InitialEvaluationApiDto {
  id?: unknown;
  evaluation_date?: unknown;
  consultation_reason?: unknown;
  family_history?: unknown;
  personal_history?: unknown;
  non_pathological_history?: unknown;
  gynecological_history?: unknown;
  dietary_recall?: unknown;
  food_frequency?: unknown;
  feeding_habits?: unknown;
}
export interface FollowUpEvaluationApiDto {
  id?: unknown;
  appointment_id?: unknown;
  evaluation_date?: unknown;
  start_time?: unknown;
  end_time?: unknown;
  status?: unknown;
  anthropometric?: unknown;
  biochemical_params?: unknown;
  nutritional_diagnosis?: unknown;
  intervention_plan?: unknown;
  follow_up?: unknown;
}
export interface MedicalHistoryApiDto {
  patient?: unknown;
  initialEvaluation?: unknown;
  followUpEvaluations?: unknown;
}
export interface MedicalHistoryResponseDto { ok?: unknown; data?: unknown }
