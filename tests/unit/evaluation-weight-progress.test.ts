import { medicalHistoryFromApi } from "@/modules/historial/adapters/historial-adapter";
import { evaluationProgressCards } from "@/modules/historial/utils/historial-presentation";
import { evaluationWeightProgress } from "@/modules/historial/utils/weight-progress";

function row(id: number, date: string | null, weight: unknown, goal?: unknown, time?: string) {
  return {
    id, evaluation_date: date, start_time: time, anthropometric: weight === undefined ? null : { weight },
    intervention_plan: goal === undefined ? null : { nutritional_goals: goal },
  };
}
function history(rows: ReturnType<typeof row>[], goal: unknown = "Bajar de peso", date: string | null = "2025-01-01") {
  return medicalHistoryFromApi({
    initialEvaluation: { evaluation_date: date, consultation_reason: { main_goal: goal } },
    followUpEvaluations: rows,
  })!;
}

describe("Progreso de cada evaluación con la medición válida anterior", () => {
  test.each([
    ["Bajar de peso", 74, "aligned"], ["Bajar de peso", 78, "opposed"],
    ["Aumentar de peso", 78, "aligned"], ["Aumentar de peso", 74, "opposed"],
    ["Bajar de peso", 76.7, "neutral"], ["Aumentar de peso", 76.7, "neutral"],
    ["Mejorar hábitos", 74, "neutral"], ["Bajar o subir de peso", 74, "neutral"],
    [null, 74, "neutral"], ["Mantener el peso", 76.6, "neutral"], ["Mantener el peso", 90, "neutral"],
  ])("%s: 76.7 a %s kg da %s", (goal, weight, status) => {
    const result = evaluationWeightProgress(history([row(2, "2026-03-14", weight), row(1, "2026-02-14", 76.7)], goal));
    expect(result[0]).toMatchObject({ status, previousEvaluationDate: "2026-02-14" });
    expect(result[1]).toMatchObject({ status: "neutral", reason: "first-measurement", weightDifference: null });
  });

  test("marzo compara con febrero y febrero con enero, aunque la API entregue otro orden", () => {
    const source = history([row(2, "2026-02-14", 76.7), row(3, "2026-03-14", 74), row(1, "2026-01-14", 78)]);
    const before = JSON.stringify(source);
    const result = evaluationWeightProgress(source);
    expect(result.map((item) => item.evaluation.evaluationDate)).toEqual(["2026-03-14", "2026-02-14", "2026-01-14"]);
    expect(result[0]).toMatchObject({ status: "aligned", weightDifference: -2.7, previousEvaluationDate: "2026-02-14" });
    expect(result[1]).toMatchObject({ status: "aligned", weightDifference: -1.3, previousEvaluationDate: "2026-01-14" });
    expect(result[2]).toMatchObject({ status: "neutral", previousEvaluationDate: null });
    expect(JSON.stringify(source)).toBe(before);
  });

  test("evalúa cada registro del mismo mes con la medición inmediatamente anterior", () => {
    const source = history([
      row(1, "2026-02-14", 80), row(2, "2026-03-01", 79), row(3, "2026-03-14", 78), row(4, "2026-03-28", 80),
    ]);
    const result = evaluationWeightProgress(source);
    expect(result.map((item) => item.status)).toEqual(["opposed", "aligned", "aligned", "neutral"]);
    expect(result[0]).toMatchObject({ weightDifference: 2, previousEvaluationDate: "2026-03-14" });
  });

  test("ordena meses y años diferentes sin comparar una evaluación con otra futura", () => {
    const result = evaluationWeightProgress(history([
      row(3, "2026-03-14", 77), row(1, "2025-03-14", 80), row(2, "2025-12-14", 78),
    ]));
    expect(result[0]).toMatchObject({ previousEvaluationDate: "2025-12-14", weightDifference: -1 });
    expect(result[1]).toMatchObject({ previousEvaluationDate: "2025-03-14", weightDifference: -2 });
    expect(result[2]).toMatchObject({ status: "neutral", previousEvaluationDate: null });
  });

  test("utiliza la hora para comparar evaluaciones del mismo día", () => {
    const result = evaluationWeightProgress(history([
      row(1, "2026-03-14", 80, undefined, "08:00:00"), row(2, "2026-03-14", 79, undefined, "16:00:00"),
    ]));
    expect(result[0].evaluation.key).toBe('["id","2"]');
    expect(result[0]).toMatchObject({ status: "aligned", weightDifference: -1 });
    expect(result[1]).toMatchObject({ status: "neutral", reason: "first-measurement" });
  });

  test("conserva todas las evaluaciones incompletas y no las usa como referencia de peso", () => {
    const source = history([
      row(1, "2026-01-14", 80), row(2, "2026-02-14", null), row(3, "2026-02-20", undefined),
      row(4, "2026-03-01", "inválido"), row(5, "2026-03-02", 0), row(6, "2026-03-03", -1),
      row(7, "2026-03-14", 78), row(8, null, 100), row(9, "2026-02-30", 90),
    ]);
    const result = evaluationWeightProgress(source);
    expect(result).toHaveLength(9);
    expect(result.find((item) => item.evaluation.key === '["id","7"]')).toMatchObject({ status: "aligned", weightDifference: -2, previousEvaluationDate: "2026-01-14" });
    for (const item of result.filter((item) => ![1, 7].some((id) => item.evaluation.key === `["id","${id}"]`))) {
      expect(item).toMatchObject({ status: "neutral", weightDifference: null });
    }
    expect(result.slice(-2).every((item) => item.reason === "invalid-date")).toBe(true);
    const cards = evaluationProgressCards(result);
    expect(cards.find((item) => item.evaluation.key === '["id","2"]')?.progress.description).toContain("Falta un peso válido");
    expect(cards.find((item) => item.evaluation.key === '["id","8"]')?.progress.description).toContain("Falta una fecha válida");
  });

  test("el cambio de objetivo mantiene los resultados anteriores y deja neutra la transición", () => {
    const result = evaluationWeightProgress(history([
      row(4, "2026-04-14", 78), row(3, "2026-03-14", 77, "Subir de peso"),
      row(2, "2026-02-14", 78), row(1, "2026-01-14", 80),
    ]));
    expect(result[0]).toMatchObject({ status: "aligned", goal: "gain", weightDifference: 1 });
    expect(result[1]).toMatchObject({ status: "neutral", reason: "goal-changed" });
    expect(result[2]).toMatchObject({ status: "aligned", goal: "lose" });
    expect(result[3]).toMatchObject({ status: "neutral", reason: "first-measurement" });
  });

  test("un objetivo de hábitos sustituye la regla de peso anterior", () => {
    const result = evaluationWeightProgress(history([
      row(1, "2026-01-14", 80), row(2, "2026-02-14", null, "Mejorar hábitos"),
      row(3, "2026-03-14", 79), row(4, "2026-04-14", 78),
    ]));
    expect(result[0]).toMatchObject({ status: "neutral", reason: "missing-age" });
    expect(result[1]).toMatchObject({ status: "neutral", reason: "goal-changed" });
  });

  test("faltan fechas del objetivo o hay un plan sin fecha: no atribuye dirección", () => {
    const rows = [row(1, "2026-01-14", 80), row(2, "2026-02-14", 78)];
    expect(evaluationWeightProgress(history(rows, "Bajar de peso", null))[0]).toMatchObject({ status: "neutral", reason: "undated-goal" });
    expect(evaluationWeightProgress(history([...rows, row(3, null, null, "Subir de peso")]))[0]).toMatchObject({ status: "neutral", reason: "undated-goal" });
  });

  test("sin historial o sin seguimientos no crea resultados", () => {
    expect(evaluationWeightProgress(null)).toEqual([]);
    expect(evaluationWeightProgress(history([]))).toEqual([]);
  });
});
