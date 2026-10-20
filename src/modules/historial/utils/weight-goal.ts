import type { HistoryValue, WeightGoal, WeightReferenceRange } from "../models/historial.model";
import { normalizedClinicalText } from "./bmi-weight-reference";

export interface WeightGoalState {
  goal: WeightGoal;
  bmiAllowed: boolean;
  range: WeightReferenceRange | null;
}

export function hasGoal(value: HistoryValue | undefined): boolean {
  return value != null && (typeof value !== "string" || value.trim().length > 0);
}

const weightIntent = /\b(?:bajar|perder|reducir|disminuir|subir|aumentar|ganar|mantener|adelgazar|engordar|perdida|ganancia|mantenimiento)\b/;

function standaloneGoal(text: string): WeightGoal {
  if (/^(?:(?:(?:bajar|perder)(?: de| el)?|reducir(?: el)?|disminuir(?: el)?|perdida de|reduccion de) peso(?: corporal)?|(?:bajar|perder|reducir|disminuir) \d+(?:[.,]\d+)?\s*kg|adelgazar)$/.test(text)) return "lose";
  if (/^(?:(?:(?:subir|aumentar|ganar)(?: de| el)?|incrementar(?: el)?|aumento de|ganancia de) peso(?: corporal)?|(?:subir|aumentar|ganar) \d+(?:[.,]\d+)?\s*kg|engordar)$/.test(text)) return "gain";
  if (/^(?:mantener(?: el| mi)? peso(?: corporal)?|mantenimiento de(?:l)? peso(?: corporal)?)$/.test(text)) return "maintain";
  return "unknown";
}

export function weightGoalState(value: HistoryValue | undefined): WeightGoalState {
  const unknown = (bmiAllowed: boolean): WeightGoalState => ({ goal: "unknown", bmiAllowed, range: null });
  if (!hasGoal(value)) return unknown(true);
  if (typeof value !== "string") return unknown(false);
  const text = normalizedClinicalText(value)
    .replace(/^(?:objetivo(?: principal| nutricional)?|meta)\s*:\s*/, "")
    .replace(/^(?:(?:el|la) paciente )?(?:quiero|deseo|busco|quiere|desea|busca)\s+/, "")
    .replace(/[.!]+$/, "").trim();

  // A maintenance range is accepted only when the complete statement explicitly
  // supplies both bounds and kg. No tolerance is synthesized from BMI or weight.
  const range = /^(?:mantener(?: el| mi)? peso(?: corporal)?|mantenimiento del peso) (?:entre|de) (\d+(?:[.,]\d+)?)\s*(?:kg)? (?:y|a) (\d+(?:[.,]\d+)?)\s*kg$/.exec(text);
  if (range) {
    const lowerKg = Number(range[1].replace(",", "."));
    const upperKg = Number(range[2].replace(",", "."));
    return lowerKg > 0 && upperKg >= lowerKg && Number.isFinite(upperKg)
      ? { goal: "maintain", bmiAllowed: false, range: { lowerKg, upperKg } } : unknown(false);
  }
  const complete = standaloneGoal(text);
  if (complete !== "unknown") return { goal: complete, bmiAllowed: false, range: null };
  if (weightIntent.test(text) && /\b(?:no|sin|evitar|antes|anteriormente|queria|tal vez|quizas|podria|si|o)\b/.test(text)) return unknown(false);

  // Accept an explicit goal alongside unrelated habits, without interpreting
  // negated, past, hypothetical, conflicting or body-composition instructions.
  const goals = new Set<WeightGoal>();
  let ambiguous = false;
  for (const part of text.split(/\s*(?:;|\by\b)\s*/)) {
    const [statement, purpose] = part.split(/\s+para\s+/, 2);
    const goal = standaloneGoal(statement);
    if (goal !== "unknown" && (!purpose || !weightIntent.test(purpose))) goals.add(goal);
    else if (weightIntent.test(part)) ambiguous = true;
  }
  if (goals.size === 1 && !ambiguous) return { goal: [...goals][0], bmiAllowed: false, range: null };
  return unknown(!ambiguous && goals.size === 0);
}

export function explicitWeightGoal(value: HistoryValue | undefined): WeightGoal {
  return weightGoalState(value).goal;
}
