import { MENU_TYPES, type MealTime, type MealType, type MenusData, type MenuType } from "../models/plan-alimenticio.model";

export const MEAL_LABELS: Record<MealType, string> = {
  DESAYUNO: "DESAYUNO", ALMUERZO: "ALMUERZO", COLACION: "COLACIÓN", COMIDA: "COMIDA", CENA: "CENA",
};
const DAY_LABELS: Record<string, string> = {
  LUNES: "Lunes", MARTES: "Martes", MIERCOLES: "Miércoles", JUEVES: "Jueves",
  VIERNES: "Viernes", SABADO: "Sábado", DOMINGO: "Domingo",
};
const LOCAL_WEEKDAYS = ["DOMINGO", "LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO"];
function dayKey(day: string): string {
  return day.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
}
export function formatDays(days: readonly string[]): string {
  const labels = days.map((day) => DAY_LABELS[dayKey(day)] ?? day);
  if (labels.length === 0) return "Días sin definir";
  if (labels.length === 1) return labels[0];
  return labels.slice(0, -1).join(", ") + " y " + labels[labels.length - 1];
}
export function menuLabel(menu: MenuType): string {
  return "Menú " + (MENU_TYPES.indexOf(menu) + 1);
}
export function todayMenu(menus: MenusData, now = new Date()): MenuType | null {
  const day = LOCAL_WEEKDAYS[now.getDay()];
  if (!day) return null;
  const matches = MENU_TYPES.filter((key) => menus[key]?.days.some((value) => dayKey(value) === day));
  return matches.length === 1 ? matches[0] : null;
}
export function calendarDate(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:$|T\d{2}:\d{2})/.exec(value.trim());
  if (!match) return null;
  if (value.includes("T") && Number.isNaN(Date.parse(value))) return null;
  const year = Number(match[1]), month = Number(match[2]), day = Number(match[3]);
  const date = new Date(0);
  date.setFullYear(year, month - 1, day);
  date.setHours(12, 0, 0, 0);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    ? match[1] + "-" + match[2] + "-" + match[3] : null;
}
export function formatPlanDate(value: string | null): string {
  const valid = calendarDate(value);
  if (!valid) return "Sin fecha definida";
  const [year, month, day] = valid.split("-").map(Number);
  const date = new Date(0);
  date.setFullYear(year, month - 1, day);
  date.setHours(12, 0, 0, 0);
  return date.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
}
export function formatMealTime(type: MealType, time?: MealTime): string {
  if (time?.start && time.end) return time.start + " - " + time.end;
  if (time?.label) return time.label;
  if (time?.start) return "Desde " + time.start;
  if (time?.end) return "Hasta " + time.end;
  return type === "COLACION" ? "A elección" : "Sin horario definido";
}
