import { createElement, type EffectCallback } from "react";
import { Platform, RefreshControl, StyleSheet } from "react-native";
import { act, create, type ReactTestRenderer } from "react-test-renderer";

import { AppButton, AppCard, AppText } from "@/components/ui";
import { WeightChart } from "@/components/ui/weight-chart";
import { Colors } from "@/constants/theme";
import { FollowUpCard } from "@/modules/historial/components/follow-up-card";
import { HistorialView } from "@/modules/historial/views/historial-view";
import { getSessionToken } from "@/shared/session/session-token";

jest.mock("expo-router", () => ({
  router: { navigate: jest.fn(), replace: jest.fn() },
  useFocusEffect: (effect: EffectCallback) => require("react").useEffect(effect, [effect]),
}));
jest.mock("@/shared/session/session-token", () => ({
  getSessionToken: jest.fn(), clearSessionToken: jest.fn(),
}));

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
jest.setTimeout(15000);
let screen: ReactTestRenderer | undefined;

function apiHistory(goal = "Bajar de peso") {
  return {
    patient: { height: "170" },
    initialEvaluation: { evaluation_date: "2026-01-01", consultation_reason: { main_goal: goal } },
    followUpEvaluations: [
      { id: 3, evaluation_date: "2026-04-01", anthropometric: { weight: "79", body_fat_percentage: "25", muscle_percentage: "35", waist_circumference: "80" } },
      { id: 2, evaluation_date: "2026-03-01", anthropometric: { weight: "78" } },
      { id: 1, evaluation_date: "2026-02-01", anthropometric: { weight: "80" } },
    ],
  };
}
function respond(data: unknown) {
  jest.mocked(global.fetch).mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ ok: true, data }) } as Response);
}
async function selectTab(label: string) {
  await act(async () => screen!.root.findAll((node) => node.props.accessibilityRole === "tab"
    && node.props.accessibilityLabel === label && typeof node.props.onPress === "function")[0].props.onPress());
}
function evaluationCard(date: string) {
  return screen!.root.findAllByType(FollowUpCard).find((card) => card.props.evaluation.evaluationDate === date)!;
}
function evaluationBorder(date: string) {
  return StyleSheet.flatten(evaluationCard(date).findByType(AppCard).props.style);
}

beforeEach(() => {
  jest.mocked(getSessionToken).mockResolvedValue("session-fixture");
});
afterEach(async () => {
  await act(async () => screen?.unmount());
  screen = undefined;
});

test.each(["ios", "android"] as const)("integra API → Adapter → ViewModel → tarjetas accesibles en %s", async (platform) => {
  jest.replaceProperty(Platform, "OS", platform);
  respond(apiHistory());
  await act(async () => { screen = create(createElement(HistorialView)); });
  await selectTab("Progreso");

  expect(global.fetch).toHaveBeenCalledWith("https://api.example.test/api/mobile/historial", expect.objectContaining({ method: "GET" }));
  const texts = screen!.root.findAllByType(AppText).map((node) => node.props.children);
  for (const label of ["Mis últimas mediciones", "Peso actual", "Grasa corporal", "Masa muscular", "Cintura", "Historial de evaluaciones"]) {
    expect(texts).toContain(label);
  }
  expect(texts).not.toContain("Evolución mensual");
  expect(texts.filter((text) => typeof text === "string").join(" ")).not.toMatch(/Objetivo de peso no determinado|Sin objetivo comparable para este periodo/);
  expect(evaluationBorder("2026-04-01")).toMatchObject({ borderColor: Colors.danger, borderWidth: 2 });
  expect(evaluationBorder("2026-03-01")).toMatchObject({ borderColor: Colors.primaryGreen, borderWidth: 2 });
  expect(evaluationBorder("2026-02-01")).toMatchObject({ borderColor: Colors.textSecondary, borderWidth: 2 });
  expect(evaluationCard("2026-03-01").findAllByType(AppText).find((text) => text.props.accessibilityRole === "header")!.props.accessibilityLabel)
    .toContain("En la dirección de tu objetivo");

  await selectTab("Mi progreso");
  expect(screen!.root.findByType(WeightChart).props.measurements).toHaveLength(3);
  expect(screen!.root.findAllByType(AppText).map((text) => text.props.children)).not.toContain("Evolución mensual");
});

test("al actualizar el historial se recalculan las tarjetas desde los nuevos datos de la API", async () => {
  respond(apiHistory());
  await act(async () => { screen = create(createElement(HistorialView)); });
  await selectTab("Progreso");
  expect(evaluationBorder("2026-04-01").borderColor).toBe(Colors.danger);
  respond(apiHistory("Subir de peso"));
  await act(async () => screen!.root.findAllByType(RefreshControl)[0].props.onRefresh());
  expect(evaluationCard("2026-04-01").props.progress.description).toContain("Objetivo: subir de peso");
  expect(evaluationBorder("2026-04-01").borderColor).toBe(Colors.primaryGreen);
  expect(evaluationBorder("2026-03-01").borderColor).toBe(Colors.danger);
});

test("un historial incompleto conserva la tarjeta original y explica qué dato falta", async () => {
  respond({ patient: {}, initialEvaluation: null, followUpEvaluations: [
    { evaluation_date: "2026-03-01", anthropometric: null },
  ] });
  await act(async () => { screen = create(createElement(HistorialView)); });
  await selectTab("Progreso");
  expect(screen!.root.findAllByType(FollowUpCard)).toHaveLength(1);
  expect(evaluationCard("2026-03-01").findAllByType(AppText).map((node) => node.props.children))
    .toContain("Falta un peso válido en esta evaluación");
  expect(evaluationCard("2026-03-01").props.progress.description).toContain("Falta un peso válido");
  expect(evaluationBorder("2026-03-01").borderColor).toBe(Colors.textSecondary);
});

test.each([
  ["Bajar de peso", "77", Colors.primaryGreen], ["Bajar de peso", "79", Colors.danger],
  ["Aumentar de peso", "79", Colors.primaryGreen], ["Aumentar de peso", "77", Colors.danger],
  ["Bajar de peso", "78", Colors.textSecondary], ["Mejorar hábitos", "77", Colors.textSecondary],
  ["Mantener el peso", "77", Colors.textSecondary],
])("la tarjeta de evaluación usa el borde correcto para %s con %s kg", async (goal, weight, color) => {
  const data = apiHistory(goal);
  data.followUpEvaluations[0].anthropometric.weight = weight;
  respond(data);
  await act(async () => { screen = create(createElement(HistorialView)); });
  await selectTab("Progreso");
  expect(evaluationBorder("2026-04-01")).toMatchObject({ borderWidth: 2, borderColor: color });
  expect(evaluationCard("2026-04-01").findByType(AppButton).props).toMatchObject({ label: "Ver detalles", variant: "secondary" });
});

test("abrir, cerrar y actualizar detalles conserva el borde y la identidad de cada evaluación", async () => {
  respond(apiHistory());
  await act(async () => { screen = create(createElement(HistorialView)); });
  await selectTab("Progreso");
  const toggle = async (date: string) => {
    await act(async () => evaluationCard(date).findByType(AppButton).props.onPress());
  };
  await toggle("2026-04-01");
  expect(evaluationBorder("2026-04-01")).toMatchObject({ borderWidth: 2, borderColor: Colors.danger });
  expect(evaluationCard("2026-04-01").findByType(AppButton).props.label).toBe("Ocultar detalles");
  expect(evaluationCard("2026-04-01").findAllByType(AppText).map((text) => text.props.children)).toContain("Antropometría");
  await toggle("2026-03-01");
  expect(evaluationCard("2026-04-01").props.expanded).toBe(true);
  expect(evaluationCard("2026-03-01").props.expanded).toBe(true);
  await toggle("2026-04-01");
  expect(evaluationCard("2026-04-01").props.expanded).toBe(false);
  expect(evaluationCard("2026-03-01").props.expanded).toBe(true);
  expect(evaluationBorder("2026-04-01").borderColor).toBe(Colors.danger);
  expect(evaluationBorder("2026-03-01").borderColor).toBe(Colors.primaryGreen);

  const updated = apiHistory();
  updated.followUpEvaluations[0].anthropometric.weight = "77";
  updated.followUpEvaluations.reverse();
  respond(updated);
  await act(async () => screen!.root.findAllByType(RefreshControl)[0].props.onRefresh());
  expect(screen!.root.findAllByType(FollowUpCard).map((card) => card.props.evaluation.evaluationDate))
    .toEqual(["2026-04-01", "2026-03-01", "2026-02-01"]);
  expect(evaluationBorder("2026-04-01").borderColor).toBe(Colors.primaryGreen);
  expect(evaluationCard("2026-04-01").props.expanded).toBe(false);
  expect(evaluationCard("2026-03-01").props.expanded).toBe(true);
  expect(evaluationBorder("2026-03-01").borderColor).toBe(Colors.primaryGreen);
  await toggle("2026-03-01");
  expect(evaluationBorder("2026-03-01").borderColor).toBe(Colors.primaryGreen);
});

test.each(["ios", "android"] as const)("sin objetivo de peso usa el IMC elegible en las tarjetas originales de %s", async (platform) => {
  jest.replaceProperty(Platform, "OS", platform);
  const data = {
    ...apiHistory("Control de peso"),
    patient: { height: "170", age: 30, gender: "M", fecha_nacimiento: "1996-01-01" },
    followUpEvaluations: [
      { id: 3, evaluation_date: "2026-03-14", anthropometric: { weight: "74", body_fat_percentage: "25", muscle_percentage: "35", waist_circumference: "80" } },
      { id: 2, evaluation_date: "2026-02-14", anthropometric: { weight: "76.7" } },
      { id: 1, evaluation_date: "2026-01-14", anthropometric: { weight: "78" } },
    ],
  };
  respond(data);
  await act(async () => { screen = create(createElement(HistorialView)); });
  await selectTab("Progreso");
  expect(screen!.root.findAllByType(FollowUpCard)).toHaveLength(3);
  expect(evaluationBorder("2026-03-14")).toMatchObject({ borderWidth: 2, borderColor: Colors.primaryGreen });
  expect(evaluationBorder("2026-02-14").borderColor).toBe(Colors.primaryGreen);
  expect(evaluationBorder("2026-01-14").borderColor).toBe(Colors.textSecondary);
  const march = evaluationCard("2026-03-14");
  expect(march.props.progress.label).toContain("-2.7 kg");
  expect(march.props.progress.label).toContain("referencia general de IMC");
  expect(march.findAllByType(AppText).map((text) => text.props.children)).toContain(march.props.progress.label);
  expect(screen!.root.findAllByType(AppText).map((text) => text.props.children))
    .toContain("El IMC es una referencia general, no un diagnóstico ni un peso ideal personalizado. No sustituye tu plan nutricional.");
  await act(async () => march.findByType(AppButton).props.onPress());
  expect(evaluationBorder("2026-03-14").borderColor).toBe(Colors.primaryGreen);
  expect(evaluationCard("2026-03-14").findAllByType(AppText).map((text) => text.props.children))
    .toContain(evaluationCard("2026-03-14").props.progress.description);
});

test("si falta edad, explica ese dato en la tarjeta original sin mostrar la sección mensual", async () => {
  respond(apiHistory("Mejorar hábitos"));
  await act(async () => { screen = create(createElement(HistorialView)); });
  await selectTab("Progreso");
  const card = evaluationCard("2026-04-01");
  expect(evaluationBorder("2026-04-01").borderColor).toBe(Colors.textSecondary);
  expect(card.findAllByType(AppText).map((text) => text.props.children))
    .toContain(card.props.progress.label);
  expect(card.props.progress.label).toContain("Falta edad o fecha de nacimiento válida");
  expect(screen!.root.findAllByType(AppText).map((text) => text.props.children)).not.toContain("Evolución mensual");
});

test.each([60, 18.5 * 1.7 ** 2, 24.9 * 1.7 ** 2])("las tarjetas mantienen borde verde con %s kg sin cambios dentro del intervalo o sus límites", async (weight) => {
  respond({
    ...apiHistory("Control de peso"),
    patient: { height: "170", gender: "M", fecha_nacimiento: "1996-01-01" },
    followUpEvaluations: ["2026-04-01", "2026-03-01", "2026-02-01"].map((date, index) => ({
      id: index + 1, evaluation_date: date, anthropometric: { weight },
    })),
  });
  await act(async () => { screen = create(createElement(HistorialView)); });
  await selectTab("Progreso");
  expect(evaluationBorder("2026-04-01")).toMatchObject({ borderWidth: 2, borderColor: Colors.primaryGreen });
  expect(evaluationBorder("2026-03-01").borderColor).toBe(Colors.primaryGreen);
  expect(evaluationBorder("2026-02-01").borderColor).toBe(Colors.textSecondary);
  expect(evaluationCard("2026-04-01").props.progress.label).toBe("0 kg · Dentro de la referencia general de IMC");
});
