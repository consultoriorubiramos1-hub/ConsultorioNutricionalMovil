export const MEAL_TYPES = ["DESAYUNO", "ALMUERZO", "COLACION", "COMIDA", "CENA"] as const;
export type MealType = (typeof MEAL_TYPES)[number];
export const MENU_TYPES = ["MENU_1", "MENU_2", "MENU_3", "MENU_4"] as const;
export type MenuType = (typeof MENU_TYPES)[number];

export interface MealTime {
  start: string | null;
  end: string | null;
  label: string | null;
}
export type MealTimes = Partial<Record<MealType, MealTime>>;
export interface MealContent { description: string | null }
export interface MenuData {
  days: string[];
  meals: Partial<Record<MealType, MealContent>>;
}
export type MenusData = Partial<Record<MenuType, MenuData>>;
export interface NutritionPlan {
  id: string | number | null;
  name: string | null;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  menus: MenusData;
  mealTimes: MealTimes;
  isActive: boolean | null;
  createdAt: string | null;
  updatedAt: string | null;
}

// Every raw field is untrusted until the adapter validates it.
export interface MealTimeApiDto { start?: unknown; end?: unknown; label?: unknown }
export interface MealContentApiDto { description?: unknown }
export interface MenuApiDto { days?: unknown; meals?: unknown }
export interface NutritionPlanApiDto {
  id?: unknown;
  patient_id?: unknown;
  name?: unknown;
  description?: unknown;
  start_date?: unknown;
  end_date?: unknown;
  menus?: unknown;
  meal_times?: unknown;
  is_active?: unknown;
  created_at?: unknown;
  updated_at?: unknown;
}
export interface NutritionPlanResponseDto { ok?: unknown; data?: unknown }
