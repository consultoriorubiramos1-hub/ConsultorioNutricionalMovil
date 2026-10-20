import type {
  EvaluationProgressReason, EvaluationWeightProgress, FollowUpEvaluation, MedicalHistory,
  WeightProgressSource, WeightProgressStatus, WeightReferenceRange,
} from "../models/historial.model";
import { bmiWeightReference, currentCalendarDate, distanceToWeightRange } from "./bmi-weight-reference";
import { calendarDate } from "./historial-format";
import { hasGoal, weightGoalState, type WeightGoalState } from "./weight-goal";

interface GoalEvent { date: string; state: WeightGoalState }
interface WeightMeasurement { evaluation: FollowUpEvaluation; date: string; weight: number }
const noGoal: WeightGoalState = { goal: "unknown", bmiAllowed: true, range: null };
const ambiguousGoal: WeightGoalState = { goal: "unknown", bmiAllowed: false, range: null };

function sameGoal(a: WeightGoalState, b: WeightGoalState): boolean {
  return a.goal === b.goal && a.bmiAllowed === b.bmiAllowed
    && a.range?.lowerKg === b.range?.lowerKg && a.range?.upperKg === b.range?.upperKg;
}

function goalTimeline(history: MedicalHistory): GoalEvent[] {
  const events: GoalEvent[] = [];
  const initial = history.initialEvaluation;
  const initialDate = calendarDate(initial?.evaluationDate);
  if (initialDate && hasGoal(initial?.consultationReason?.mainGoal)) {
    events.push({ date: initialDate, state: weightGoalState(initial?.consultationReason?.mainGoal) });
  }
  const plans = new Map<string, WeightGoalState[]>();
  for (const evaluation of history.followUpEvaluations) {
    const date = calendarDate(evaluation.evaluationDate);
    const value = evaluation.interventionPlan?.nutritionalGoals;
    if (!date || !hasGoal(value)) continue;
    const states = plans.get(date) ?? [];
    states.push(weightGoalState(value));
    plans.set(date, states);
  }
  for (const [date, states] of plans) {
    // Conflicting same-day plans cannot establish a reliable current goal.
    events.push({ date, state: states.every((state) => sameGoal(state, states[0])) ? states[0] : ambiguousGoal });
  }
  return events.sort((a, b) => a.date.localeCompare(b.date));
}

export function chronologicalEvaluations(evaluations: readonly FollowUpEvaluation[]): FollowUpEvaluation[] {
  // Preserve the API's newest-first order for same-day ties without a time.
  return evaluations.map((evaluation, index) => ({ evaluation, index, date: calendarDate(evaluation.evaluationDate) ?? "" }))
    .sort((a, b) => a.date.localeCompare(b.date)
      || (a.evaluation.startTime ?? "").localeCompare(b.evaluation.startTime ?? "") || b.index - a.index)
    .map(({ evaluation }) => evaluation);
}

interface Outcome {
  status: WeightProgressStatus;
  reason: EvaluationProgressReason;
  source: WeightProgressSource;
  referenceRange: WeightReferenceRange | null;
}

function classify(
  history: MedicalHistory, current: WeightMeasurement, previous: WeightMeasurement | undefined,
  difference: number | null, state: WeightGoalState, changed: boolean, undated: boolean, asOfDate: string,
): Outcome {
  const source = state.goal !== "unknown" ? "goal" : "none";
  const neutral = (reason: EvaluationProgressReason): Outcome => ({ status: "neutral", reason, source, referenceRange: null });
  if (!previous || difference === null) return neutral("first-measurement");
  if (undated) return neutral("undated-goal");
  if (changed) return neutral("goal-changed");
  if (state.goal === "maintain") {
    if (!state.range) return neutral("maintenance-without-range");
    const inside = distanceToWeightRange(current.weight, state.range) === 0;
    return { status: inside ? "aligned" : "opposed", reason: inside ? "maintenance-within-range" : "maintenance-outside-range", source: "goal", referenceRange: state.range };
  }
  if (difference === 0 && (state.goal !== "unknown" || !state.bmiAllowed)) return neutral("unchanged");
  if (state.goal === "lose" || state.goal === "gain") {
    const aligned = state.goal === "lose" ? difference < 0 : difference > 0;
    return { status: aligned ? "aligned" : "opposed", reason: aligned ? "aligned" : "opposed", source: "goal", referenceRange: null };
  }
  if (!state.bmiAllowed) return neutral("ambiguous-goal");

  const reference = bmiWeightReference(history, previous.date, current.date, asOfDate);
  if (!reference.range) return neutral(difference === 0 ? "unchanged" : reference.reason);
  const before = distanceToWeightRange(previous.weight, reference.range);
  const after = distanceToWeightRange(current.weight, reference.range);
  if (difference === 0 && after > 0) return neutral("unchanged");
  // Staying within an applicable reference is favorable, including unchanged
  // weights and both bounds. Use ONE height/range for both measurements.
  const reason = after === 0 ? "bmi-within-range" : after === before ? "bmi-same-distance"
    : after < before ? "bmi-closer" : "bmi-farther";
  return {
    status: reason === "bmi-closer" || reason === "bmi-within-range" ? "aligned" : reason === "bmi-farther" ? "opposed" : "neutral",
    reason, source: "bmi", referenceRange: reference.range,
  };
}

export function evaluationWeightProgress(history: MedicalHistory | null, asOfDate = currentCalendarDate()): EvaluationWeightProgress[] {
  if (!history) return [];
  const sorted = chronologicalEvaluations(history.followUpEvaluations);
  const measurements = sorted.flatMap((evaluation): WeightMeasurement[] => {
    const date = calendarDate(evaluation.evaluationDate);
    const weight = evaluation.anthropometric?.weight;
    return date && weight != null && Number.isFinite(weight) && weight > 0 ? [{ evaluation, date, weight }] : [];
  });
  const events = goalTimeline(history);
  const initial = history.initialEvaluation;
  const undatedInitial = !calendarDate(initial?.evaluationDate)
    && hasGoal(initial?.consultationReason?.mainGoal) && !weightGoalState(initial?.consultationReason?.mainGoal).bmiAllowed;
  const undatedPlan = history.followUpEvaluations.some((evaluation) =>
    !calendarDate(evaluation.evaluationDate) && hasGoal(evaluation.interventionPlan?.nutritionalGoals)
    && !weightGoalState(evaluation.interventionPlan?.nutritionalGoals).bmiAllowed);
  let state = undatedInitial ? ambiguousGoal : noGoal;
  let eventIndex = 0;
  let datedPlanEstablished = false;
  const results = new Map<string, EvaluationWeightProgress>();
  for (const [index, current] of measurements.entries()) {
    const previous = measurements[index - 1];
    const intervalState = state;
    let changed = false;
    while (eventIndex < events.length && events[eventIndex].date <= current.date) {
      const event = events[eventIndex++];
      if (previous && !sameGoal(event.state, intervalState)) changed = true;
      state = event.state;
      datedPlanEstablished = true;
    }
    // Floating-point cleanup only. No invented medical tolerance.
    const difference = previous ? Number((current.weight - previous.weight).toFixed(10)) : null;
    const undated = undatedPlan || (undatedInitial && !datedPlanEstablished);
    const outcome = classify(history, current, previous, difference, state, changed, undated, asOfDate);
    results.set(current.evaluation.key, {
      evaluation: current.evaluation, ...outcome,
      goal: changed || undated ? "unknown" : state.goal,
      weightDifference: difference, previousEvaluationDate: previous?.date ?? null,
    });
  }
  // Keep every original evaluation, including incomplete/undated records. The
  // UI displays newest first and retains the Adapter's unique evaluation keys.
  return sorted.reverse().map((evaluation) => results.get(evaluation.key) ?? {
    evaluation, status: "neutral", reason: !calendarDate(evaluation.evaluationDate) ? "invalid-date" : "missing-weight",
    goal: "unknown", source: "none", referenceRange: null,
    weightDifference: null, previousEvaluationDate: null,
  });
}
