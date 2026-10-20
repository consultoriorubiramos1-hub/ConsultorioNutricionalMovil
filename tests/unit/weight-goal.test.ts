import { explicitWeightGoal, weightGoalState } from "@/modules/historial/utils/weight-goal";

describe("Objetivos explícitos, sin adivinar direcciones", () => {
  test.each([
    ["Bajar de peso", "lose"], ["Pérdida de peso", "lose"], ["Reducir el peso corporal", "lose"],
    ["Objetivo principal: Disminuir peso.", "lose"], ["Quiero perder peso", "lose"], ["Adelgazar", "lose"],
    ["Subir de peso", "gain"], ["Aumentar de peso", "gain"], ["Ganancia de peso", "gain"],
    ["  Deseo GANAR peso  ", "gain"], ["Mantener el peso", "maintain"],
    ["Mantener mi peso", "maintain"], ["Mantenimiento del peso", "maintain"],
    ["Bajar de peso y mejorar hábitos", "lose"], ["Mejorar hábitos y aumentar el peso", "gain"],
    ["Bajar de peso para mejorar mis hábitos", "lose"], ["La paciente busca subir de peso", "gain"],
    ["Perder 5 kg", "lose"], ["Mantener el peso entre 60 y 65 kg", "maintain"],
  ])("reconoce %s como %s", (text, expected) => {
    expect(explicitWeightGoal(text)).toBe(expected);
  });

  test.each([
    null, undefined, true, 1, "", "Mejorar hábitos", "Ganar masa muscular", "Perder grasa corporal",
    "No bajar de peso", "No quiero bajar de peso", "Bajar de peso o subir de peso",
    "Antes quería bajar de peso", "Tal vez bajar de peso", "Mantener el peso o perderlo",
    "Bajar de peso sin perder peso", "Bajar de peso\nSubir de peso",
    "Bajar de peso para luego subir de peso", "Bajar de peso y subir de peso",
    "No quiero mejorar hábitos y bajar de peso", "Tal vez mejorar hábitos y bajar de peso",
  ])("no adivina el objetivo a partir de %s", (text) => {
    expect(explicitWeightGoal(text)).toBe("unknown");
  });

  test.each(["No bajar de peso", "Bajar o subir de peso", "Tal vez bajar de peso", "Ganar masa muscular"])("no sustituye %s por una regla de IMC", (goal) => {
    expect(weightGoalState(goal).bmiAllowed).toBe(false);
  });
  test.each([null, "Mejorar hábitos", "Control de peso"])("permite evaluar la elegibilidad de IMC cuando no hay dirección explícita: %s", (goal) => {
    expect(weightGoalState(goal)).toMatchObject({ goal: "unknown", bmiAllowed: true });
  });
  test("solo reconoce rangos de mantenimiento completos y expresados en kg", () => {
    expect(weightGoalState("Mantener el peso entre 60,5 y 65 kg")).toMatchObject({ goal: "maintain", range: { lowerKg: 60.5, upperKg: 65 } });
    for (const invalid of ["Mantener peso entre 65 y 60 kg", "Mantener peso entre 60 y 65", "Mantener peso cerca de 60 kg"]) {
      expect(weightGoalState(invalid)).toMatchObject({ goal: "unknown", bmiAllowed: false, range: null });
    }
  });
});
