import type { NutritionPlan } from '@/modules/plan-alimenticio/models/plan-alimenticio.model';

export type ImcCategory = "Bajo peso" | "Saludable" | "Sobrepeso" | "Obesidad";

export interface WeightMeasurement {
  date: string;
  time: string;
  weight: number;
  heightCm: number | null;
}

export interface DashboardHealth {
  patientName: string;
  measurements: WeightMeasurement[];
  currentWeight: number | null;
  initialWeight: number | null;
  weightChange: number | null;
  weightChangePercent: number | null;
  lastMeasurementDate: string | null;
  imc: number | null;
  imcCategory: ImcCategory | null;
}

export interface DashboardAppointment {
  date: string;
  time: string;
}

export interface DashboardData {
  plan?: NutritionPlan | null;
  planAvailable?: boolean;
  health: DashboardHealth | null;
  nextAppointment: DashboardAppointment | null;
  appointmentsAvailable: boolean;
  errors: string[];
}
