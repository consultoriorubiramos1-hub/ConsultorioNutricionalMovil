import { mealTimesFromApi, menusFromApi, nutritionPlanFromApi } from "@/modules/plan-alimenticio/adapters/plan-alimenticio-adapter";
import { formatMealTime, todayMenu } from "@/modules/plan-alimenticio/utils/plan-alimenticio-format";

describe("Planes alimenticios", () => {
  test("maneja ausencia de plan y JSON anidado incompleto", () => {
    expect(nutritionPlanFromApi(null)).toBeNull();
    expect(nutritionPlanFromApi({})).toMatchObject({ name: null, menus: {}, mealTimes: {} });
    expect(menusFromApi("{")).toEqual({});
    expect(menusFromApi('{"MENU_1":{"days":["LUNES"]}}').MENU_1?.days).toEqual(["LUNES"]);
  });
  test("conserva indicaciones y convierte las fechas de calendario", () => {
    const text = " Primera línea\nSegunda línea ";
    expect(nutritionPlanFromApi({ description: text, start_date: "2026-10-07T00:00:00Z" })).toMatchObject({ description: text, startDate: "2026-10-07" });
  });
  test("rechaza horarios imposibles y usa las asignaciones del backend", () => {
    const times = mealTimesFromApi({ COMIDA: { start: "25:00", end: "12:30:99" }, CENA: { start: "19:00:00" } });
    expect(formatMealTime("COMIDA", times.COMIDA)).toBe("Sin horario definido");
    expect(formatMealTime("CENA", times.CENA)).toBe("Desde 19:00");
    expect(todayMenu(menusFromApi({ MENU_2: { days: ["MIÉRCOLES"] } }), new Date(2026, 9, 7, 12))).toBe("MENU_2");
    expect(todayMenu({}, new Date(2026, 9, 7, 12))).toBeNull();
  });
});
