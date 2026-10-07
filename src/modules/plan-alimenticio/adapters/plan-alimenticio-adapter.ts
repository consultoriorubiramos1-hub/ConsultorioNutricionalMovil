import {
  MEAL_TYPES, MENU_TYPES, type MealContentApiDto, type MealTimeApiDto,
  type MealTimes, type MenuApiDto, type MenusData, type NutritionPlan, type NutritionPlanApiDto,
} from "../models/plan-alimenticio.model";
import { calendarDate } from "../utils/plan-alimenticio-format";

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
function description(value: unknown): string | null {
  // Keep the original content, including newlines and indentation.
  return typeof value === "string" && value.trim() ? value : null;
}
function time(value: unknown): string | null {
  const raw = text(value);
  return raw && /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(raw) ? raw.slice(0, 5) : null;
}
export function mealTimesFromApi(value: unknown): MealTimes {
  const raw = jsonRecord(value);
  const result: MealTimes = {};
  for (const type of MEAL_TYPES) {
    const dto: MealTimeApiDto | null = record(raw?.[type]);
    if (dto) result[type] = { start: time(dto.start), end: time(dto.end), label: text(dto.label) };
  }
  return result;
}
export function menusFromApi(value: unknown): MenusData {
  const raw = jsonRecord(value);
  const result: MenusData = {};
  for (const type of MENU_TYPES) {
    const dto: MenuApiDto | null = record(raw?.[type]);
    if (!dto) continue;
    const rawMeals = record(dto.meals);
    const meals: NonNullable<MenusData[typeof type]>["meals"] = {};
    for (const mealType of MEAL_TYPES) {
      const meal: MealContentApiDto | null = record(rawMeals?.[mealType]);
      if (meal) meals[mealType] = { description: description(meal.description) };
    }
    const days = Array.isArray(dto.days)
      ? dto.days.map(text).filter((day): day is string => day !== null) : [];
    result[type] = { days: [...new Set(days)], meals };
  }
  return result;
}
export function nutritionPlanFromApi(value: unknown): NutritionPlan | null {
  const dto: NutritionPlanApiDto | null = record(value);
  if (!dto) return null;
  return {
    id: typeof dto.id === "string" ? text(dto.id)
      : typeof dto.id === "number" && Number.isFinite(dto.id) ? dto.id : null,
    name: text(dto.name), description: description(dto.description),
    startDate: calendarDate(dto.start_date), endDate: calendarDate(dto.end_date),
    menus: menusFromApi(dto.menus), mealTimes: mealTimesFromApi(dto.meal_times),
    isActive: typeof dto.is_active === "boolean" ? dto.is_active : null,
    createdAt: text(dto.created_at), updatedAt: text(dto.updated_at),
  };
}
