import type { HistoryValue, PatientHistory } from "../models/historial.model";

export function calendarDate(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const raw = value.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:$|T\d{2}:\d{2})/.exec(raw);
  if (!match || (raw.includes("T") && Number.isNaN(Date.parse(raw)))) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(0);
  date.setFullYear(year, month - 1, day);
  date.setHours(12, 0, 0, 0);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    ? match[1] + "-" + match[2] + "-" + match[3] : null;
}

export function formatHistoryDate(value: string | null): string {
  const valid = calendarDate(value);
  if (!valid) return "Sin fecha registrada";
  const [year, month, day] = valid.split("-").map(Number);
  const date = new Date(0);
  date.setFullYear(year, month - 1, day);
  date.setHours(12, 0, 0, 0);
  return date.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
}

export function normalizeNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const raw = value.trim();
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(raw)) return null;
  const number = Number(raw);
  return Number.isFinite(number) ? number : null;
}

export function normalizeGender(value: unknown): PatientHistory["gender"] {
  if (typeof value !== "string") return null;
  const gender = value.trim().toUpperCase();
  return gender === "M" || gender === "F" ? gender : null;
}

export function formatGender(value: PatientHistory["gender"]): string {
  return value === "M" ? "Masculino" : value === "F" ? "Femenino" : "No especificado";
}

export function formatNumber(value: number): string {
  return value.toLocaleString("es-MX", { maximumFractionDigits: 10 });
}

export function formatValue(value: HistoryValue): string | null {
  if (value === null) return null;
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (typeof value === "number") return Number.isFinite(value) ? formatNumber(value) : null;
  return value.trim() ? value : null;
}

export function formatWeightChange(value: number): string {
  return (value > 0 ? "+" : "") + formatNumber(value) + " kg";
}
