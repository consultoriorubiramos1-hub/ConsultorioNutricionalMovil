import { perfilFromApi } from "@/modules/perfil/adapters/perfil-adapter";
import type {
  DashboardAppointment,
  DashboardHealth,
  ImcCategory,
  WeightMeasurement,
} from "../models/dashboard.model";

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function text(value: unknown): string | null {
  return typeof value === "string" ? value.trim() || null : null;
}

function positiveNumber(value: unknown): number | null {
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (typeof value === "string" && !value.trim()) return null;
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

// Preserve the SQL calendar day: device time-zone conversion can shift it.
function calendarDate(value: unknown): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T|$)/.exec(text(value) ?? "");
  if (!match) return null;
  const [, year, month, day] = match;
  const checked = new Date(
    Date.UTC(Number(year), Number(month) - 1, Number(day)),
  );
  return checked.getUTCFullYear() === Number(year) &&
    checked.getUTCMonth() + 1 === Number(month) &&
    checked.getUTCDate() === Number(day)
    ? `${year}-${month}-${day}`
    : null;
}

function clockTime(value: unknown): string | null {
  const match = /^(\d{2}):(\d{2})(?::\d{2})?$/.exec(text(value) ?? "");
  return match && Number(match[1]) < 24 && Number(match[2]) < 60
    ? `${match[1]}:${match[2]}`
    : null;
}

export function classifyImc(imc: number): ImcCategory {
  if (imc < 18.5) return "Bajo peso";
  if (imc < 25) return "Saludable";
  if (imc < 30) return "Sobrepeso";
  return "Obesidad";
}

export function healthFromApi(value: unknown): DashboardHealth {
  const data = record(value);
  const patient = record(data?.patient);
  if (!patient || !Array.isArray(data?.followUpEvaluations)) {
    throw new Error("La respuesta del progreso nutricional no es válida.");
  }
  const profile = perfilFromApi({
    first_name: text(patient.first_name),
    second_name: text(patient.second_name),
    first_lastname: text(patient.first_lastname),
    second_lastname: text(patient.second_lastname),
    nombre_completo: text(patient.nombre_completo),
  });
  const measurements: WeightMeasurement[] = [];
  for (const item of data.followUpEvaluations) {
    const evaluation = record(item);
    const anthropometric = record(evaluation?.anthropometric);
    const date = calendarDate(evaluation?.evaluation_date);
    const weight = positiveNumber(anthropometric?.weight);
    if (date && weight !== null) {
      measurements.push({
        date,
        time: clockTime(evaluation?.start_time) ?? "00:00",
        weight,
        heightCm: positiveNumber(anthropometric?.height),
      });
    }
  }
  measurements.sort((a, b) =>
    `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`),
  );
  const first = measurements[0];
  const latest = measurements[measurements.length - 1];
  // The history endpoint supplies height in cm; prefer the current evaluation.
  const heightCm = latest?.heightCm ?? positiveNumber(patient.height);
  const calculatedImc =
    latest && heightCm ? latest.weight / (heightCm / 100) ** 2 : null;
  const imc =
    calculatedImc !== null && Number.isFinite(calculatedImc)
      ? calculatedImc
      : null;
  const weightChange =
    measurements.length >= 2 ? latest.weight - first.weight : null;
  return {
    patientName: profile.nombreCompleto,
    measurements,
    currentWeight: latest?.weight ?? null,
    initialWeight: first?.weight ?? null,
    weightChange,
    weightChangePercent:
      weightChange !== null ? (weightChange / first.weight) * 100 : null,
    lastMeasurementDate: latest?.date ?? null,
    imc,
    imcCategory: imc !== null ? classifyImc(imc) : null,
  };
}

export function nextAppointmentFromApi(
  value: unknown,
  now = new Date(),
): DashboardAppointment | null {
  if (!Array.isArray(value))
    throw new Error("La respuesta de citas no es válida.");
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const part = (type: string) =>
    parts.find((item) => item.type === type)?.value ?? "";
  const clinicNow = `${part("year")}-${part("month")}-${part("day")} ${part("hour")}:${part("minute")}`;
  const appointments: DashboardAppointment[] = [];
  for (const item of value) {
    const appointment = record(item);
    const date = calendarDate(appointment?.appointment_date);
    const time = clockTime(appointment?.start_time);
    const status = text(appointment?.status);
    if (
      date &&
      time &&
      status &&
      !["cancelled", "no_show", "completed"].includes(status) &&
      `${date} ${time}` >= clinicNow
    ) {
      appointments.push({ date, time });
    }
  }
  appointments.sort((a, b) =>
    `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`),
  );
  return appointments[0] ?? null;
}
