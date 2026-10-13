import { followUpEvaluationsFromApi, medicalHistoryFromApi } from "@/modules/historial/adapters/historial-adapter";
import { normalizeNumber } from "@/modules/historial/utils/historial-format";
import { progressIndicators, weightChange } from "@/modules/historial/utils/historial-presentation";
import { healthFromApi } from "@/modules/dashboard/adapters/dashboard-adapter";

describe("Historial y progreso nutricional", () => {
  test("distingue historial vacío válido de contenedor inválido", () => {
    expect(medicalHistoryFromApi({ patient: {}, initialEvaluation: null, followUpEvaluations: [] })).toMatchObject({ initialEvaluation: null, followUpEvaluations: [] });
    expect(medicalHistoryFromApi(null)).toBeNull();
    expect(weightChange([])).toBeNull();
  });
  test("normaliza decimales de PostgreSQL sin convertir null a cero", () => {
    expect(normalizeNumber("70.50")).toBe(70.5);
    expect(normalizeNumber("0")).toBe(0);
    for (const invalid of [null, "", true, "70 kg", Infinity]) expect(normalizeNumber(invalid)).toBeNull();
  });
  test("usa la última medición disponible de cada indicador y calcula diferencia", () => {
    const rows = followUpEvaluationsFromApi([
      { evaluation_date: "2026-10-07", anthropometric: { weight: "70.2" } },
      { evaluation_date: "2026-09-07", anthropometric: { weight: "73.4", waist_circumference: "84" } },
    ]);
    expect(weightChange(rows)).toBe(-3.2);
    expect(progressIndicators(rows)).toContainEqual({ label: "Cintura", value: "84 cm", evaluationDate: "2026-09-07" });
    const dashboard = healthFromApi({ patient: { height: "170" }, followUpEvaluations: [
      { evaluation_date: "2026-10-07", anthropometric: { weight: "70.2" } },
      { evaluation_date: "2026-09-07", anthropometric: { weight: "73.4" } },
    ] });
    expect(dashboard.currentWeight).toBe(70.2);
    expect(dashboard.imc).toBeCloseTo(70.2 / 1.7 ** 2);
  });
});
