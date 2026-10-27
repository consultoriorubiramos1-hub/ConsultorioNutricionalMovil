import type { DisplayField, FollowUpEvaluation, MedicalHistory, NutritionMeasurement, NutritionProgressCard, ProgressIndicator } from '../models/historial.model';
import { calendarDate, formatHistoryDate, formatNumber, formatWeightChange } from './historial-format';
import { evaluationProgressCards } from './historial-presentation';
import { evaluationWeightProgress } from './weight-progress';

function positive(value: number | null | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;
}

function percentage(value: number | null | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100 ? value : null;
}

export function nutritionMeasurements(evaluations: readonly FollowUpEvaluation[]): NutritionMeasurement[] {
  // Ordena una copia; conserva todas las filas y sus claves, incluso incompletas.
  return evaluations.map((evaluation, index) => ({ evaluation, index, date: calendarDate(evaluation.evaluationDate) }))
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '')
      || (b.evaluation.startTime ?? '').localeCompare(a.evaluation.startTime ?? '') || a.index - b.index)
    .map(({ evaluation, date }) => ({
      key: evaluation.key,
      evaluationDate: date,
      weight: positive(evaluation.anthropometric?.weight),
      bodyFatPercentage: percentage(evaluation.anthropometric?.bodyFatPercentage),
      musclePercentage: percentage(evaluation.anthropometric?.musclePercentage),
      waistCircumference: positive(evaluation.anthropometric?.waistCircumference),
    }));
}

export function measurementFields(measurement: NutritionMeasurement): DisplayField[] {
  const format = (value: number | null, unit: string) => value === null ? '—' : formatNumber(value) + ' ' + unit;
  return [
    { label: 'Peso', value: format(positive(measurement.weight), 'kg') },
    { label: 'Grasa corporal', value: format(percentage(measurement.bodyFatPercentage), '%') },
    { label: 'Masa muscular', value: format(percentage(measurement.musclePercentage), '%') },
    { label: 'Cintura', value: format(positive(measurement.waistCircumference), 'cm') },
  ];
}

export function latestNutritionIndicators(measurements: readonly NutritionMeasurement[]): ProgressIndicator[] {
  const specs = [
    ['weight', 'Peso actual', 'kg'], ['bodyFatPercentage', 'Grasa corporal', '%'],
    ['musclePercentage', 'Masa muscular', '%'], ['waistCircumference', 'Cintura', 'cm'],
  ] as const;
  return specs.map(([key, label, unit]) => {
    const source = measurements.find((measurement) => measurement[key] !== null);
    const value = source?.[key];
    return { label, value: value == null ? '—' : formatNumber(value) + ' ' + unit, evaluationDate: source?.evaluationDate ?? null };
  });
}

export function nutritionProgressCards(history: MedicalHistory | null): NutritionProgressCard[] {
  if (!history) return [];
  const measurements = new Map(nutritionMeasurements(history.followUpEvaluations).map((measurement) => [measurement.key, measurement]));
  // Se reutilizan íntegramente clasificación, comparación, rangos y orden originales.
  const results = evaluationWeightProgress(history);
  return evaluationProgressCards(results).map(({ evaluation, progress }, index) => {
    const result = results[index];
    // No trasladar motivos clínicos de exclusión (p. ej. embarazo) al texto visible.
    const privateContext = ['missing-age', 'missing-height', 'bmi-age-ineligible', 'bmi-context-excluded', 'bmi-pregnancy-unknown'].includes(result.reason);
    const label = privateContext
      ? (result.weightDifference !== null ? formatWeightChange(result.weightDifference) + ' · ' : '') + 'Sin referencia válida para comparar'
      : progress.label;
    return {
      measurement: measurements.get(evaluation.key)!,
      progress: {
        status: progress.status,
        source: progress.source,
        label,
        description: label
          + (result.previousEvaluationDate ? '. Comparado con: ' + formatHistoryDate(result.previousEvaluationDate) : '')
          + (progress.source === 'bmi' ? '. Referencia general de IMC; no es un diagnóstico ni un peso ideal personalizado' : ''),
      },
    };
  });
}

export interface DescriptiveWeightEvolution {
  measurements: { date: string; weight: number }[];
  difference: number | null;
  firstDate: string | null;
  latestDate: string | null;
}

export function descriptiveWeightEvolution(measurements: readonly NutritionMeasurement[]): DescriptiveWeightEvolution {
  const points = measurements.flatMap((measurement) => {
    const date = calendarDate(measurement.evaluationDate);
    const weight = positive(measurement.weight);
    return date && weight !== null ? [{ date, weight }] : [];
  }).sort((a, b) => a.date.localeCompare(b.date));
  const first = points[0];
  const latest = points[points.length - 1];
  // Sin orden intradía en la tarjeta, no inventar qué medición es el extremo.
  const comparable = first && latest && first.date !== latest.date
    && points.filter((point) => point.date === first.date).length === 1
    && points.filter((point) => point.date === latest.date).length === 1;
  const difference = comparable ? latest.weight - first.weight : null;
  const rounded = difference !== null && Number.isFinite(difference) ? Number(difference.toFixed(10)) : null;
  return {
    measurements: points,
    difference: rounded === 0 ? 0 : rounded,
    firstDate: first?.date ?? null,
    latestDate: latest?.date ?? null,
  };
}
