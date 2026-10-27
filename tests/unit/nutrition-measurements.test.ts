import { followUpEvaluationsFromApi, medicalHistoryFromApi } from '@/modules/historial/adapters/historial-adapter';
import type { NutritionMeasurement } from '@/modules/historial/models/historial.model';
import { descriptiveWeightEvolution, latestNutritionIndicators, measurementFields, nutritionMeasurements, nutritionProgressCards } from '@/modules/historial/utils/nutrition-measurements';
import { evaluationWeightProgress } from '@/modules/historial/utils/weight-progress';
import { evaluationProgressCards } from '@/modules/historial/utils/historial-presentation';
import { formatWeightChange } from '@/modules/historial/utils/historial-format';

function measurement(date: string | null, weight: number | null): NutritionMeasurement {
  return { key: String(date), evaluationDate: date, weight, bodyFatPercentage: null, musclePercentage: null, waistCircumference: null };
}

test('las últimas mediciones son exactamente cuatro y buscan el registro válido propio de cada indicador', () => {
  const rows = nutritionMeasurements(followUpEvaluationsFromApi([
    { evaluation_date: '2026-04-01', anthropometric: { weight: 79, body_fat_percentage: -1, muscle_percentage: 0 } },
    { evaluation_date: '2026-02-01', anthropometric: { weight: 80, body_fat_percentage: 25 } },
  ]));
  expect(latestNutritionIndicators(rows)).toEqual([
    { label: 'Peso actual', value: '79 kg', evaluationDate: '2026-04-01' },
    { label: 'Grasa corporal', value: '25 %', evaluationDate: '2026-02-01' },
    { label: 'Masa muscular', value: '0 %', evaluationDate: '2026-04-01' },
    { label: 'Cintura', value: '—', evaluationDate: null },
  ]);
  expect(latestNutritionIndicators([])).toHaveLength(4);
  expect(latestNutritionIndicators([]).every((item) => item.value === '—' && item.evaluationDate === null)).toBe(true);
});

test.each([
  ['Bajar de peso', 77], ['Bajar de peso', 79], ['Subir de peso', 79], ['Subir de peso', 77],
  ['Bajar de peso', 78], ['Mantener el peso', 78], ['Mantener el peso entre 77 y 79 kg', 77],
  ['Mantener el peso entre 77 y 79 kg', 79], ['Mantener el peso entre 77 y 79 kg', 80],
  ['Bajar o subir de peso', 77], ['Control de peso', 77],
])('la proyección conserva exactamente estado, orden y cambio de la lógica original con %s a %s kg', (goal, weight) => {
  const history = medicalHistoryFromApi({
    patient: { height: 170, fecha_nacimiento: '1996-01-01', gender: 'M' },
    initialEvaluation: { evaluation_date: '2026-01-01', consultation_reason: { main_goal: goal } },
    followUpEvaluations: [
      { id: 1, evaluation_date: '2026-02-01', anthropometric: { weight: 78 } },
      { id: 2, evaluation_date: '2026-03-01', anthropometric: { weight } },
      { id: 3, evaluation_date: null, anthropometric: { weight: 100 } },
      { id: 4, evaluation_date: '2026-04-01', anthropometric: { weight: -1 } },
    ],
  })!;
  const snapshot = JSON.stringify(history);
  const original = evaluationWeightProgress(history);
  const originalCards = evaluationProgressCards(original);
  const projected = nutritionProgressCards(history);
  expect(projected.map((item) => item.measurement.key)).toEqual(original.map((item) => item.evaluation.key));
  for (const [index, item] of projected.entries()) {
    expect(item.progress.status).toBe(originalCards[index].progress.status);
    expect(item.progress.source).toBe(originalCards[index].progress.source);
    if (original[index].weightDifference !== null) expect(item.progress.label).toContain(formatWeightChange(original[index].weightDifference!));
    expect(Object.keys(item.measurement).sort()).toEqual(['bodyFatPercentage', 'evaluationDate', 'key', 'musclePercentage', 'waistCircumference', 'weight']);
  }
  expect(JSON.stringify(history)).toBe(snapshot);
});

test('la exclusión por contexto clínico conserva el gris sin exponer motivos ni notas sensibles', () => {
  const history = medicalHistoryFromApi({
    patient: { height: 170, fecha_nacimiento: '1996-01-01', gender: 'F' },
    initialEvaluation: { evaluation_date: '2026-01-01', consultation_reason: { main_goal: 'Control de peso' } },
    followUpEvaluations: [
      { id: 2, evaluation_date: '2026-03-01', anthropometric: { weight: 77 }, nutritional_diagnosis: { diagnosis: 'CLINICO_SECRETO' } },
      { id: 1, evaluation_date: '2026-02-01', anthropometric: { weight: 78 } },
    ],
  })!;
  const original = evaluationWeightProgress(history);
  expect(original[0]).toMatchObject({ reason: 'bmi-pregnancy-unknown', status: 'neutral' });
  const projected = nutritionProgressCards(history);
  expect(projected[0].progress.status).toBe('neutral');
  expect(projected[0].progress.label).toBe('-1 kg · Sin referencia válida para comparar');
  expect(JSON.stringify(projected)).not.toMatch(/CLINICO_SECRETO|embarazo|ginecol|diagnosis|nutritionalDiagnosis/i);
});

test('proyecta exclusivamente cuatro mediciones, fecha y clave, sin mutar contratos ni perder filas', () => {
  const source = followUpEvaluationsFromApi([
    { id: 1, evaluation_date: '2026-01-01', anthropometric: { weight: '72.50', body_fat_percentage: '25.5', muscle_percentage: '35', waist_circumference: '80.2', blood_pressure_systolic: 120, hip_circumference: 95 }, nutritional_diagnosis: { diagnosis: 'CLINICO' } },
    { id: 2, evaluation_date: '2026-02-01', anthropometric: { weight: '70' } },
    { id: 2, evaluation_date: '2026-02-01', anthropometric: null },
    { id: 3, evaluation_date: '2026-02-30', anthropometric: { weight: '68' } },
  ]);
  const snapshot = JSON.stringify(source);
  const projected = nutritionMeasurements(source);
  expect(projected).toHaveLength(4);
  expect(projected.map((item) => item.evaluationDate)).toEqual(['2026-02-01', '2026-02-01', '2026-01-01', null]);
  expect(new Set(projected.map((item) => item.key)).size).toBe(4);
  expect(projected[2]).toEqual({ key: '["id","1"]', evaluationDate: '2026-01-01', weight: 72.5, bodyFatPercentage: 25.5, musclePercentage: 35, waistCircumference: 80.2 });
  expect(JSON.stringify(projected)).not.toMatch(/CLINICO|bloodPressure|hipCircumference|nutritionalDiagnosis/);
  expect(JSON.stringify(source)).toBe(snapshot);
  expect(source[0].nutritionalDiagnosis?.diagnosis).toBe('CLINICO');
});

test.each([null, -1, 0, NaN, Infinity, -Infinity])('peso y cintura %s se presentan sin registro y no se comparan', (invalid) => {
  const source = followUpEvaluationsFromApi([{ id: 1, evaluation_date: '2026-01-01', anthropometric: { weight: invalid, waist_circumference: invalid } }]);
  const projected = nutritionMeasurements(source)[0];
  expect(projected.weight).toBeNull();
  expect(projected.waistCircumference).toBeNull();
  const fields = measurementFields(projected);
  expect(fields).toHaveLength(4);
  expect(fields[0].value).toBe('—');
  expect(fields[3].value).toBe('—');
  expect(descriptiveWeightEvolution([projected]).difference).toBeNull();
});

test.each([-1, 100.1, NaN, Infinity])('porcentaje %s inválido no aparece como medición válida', (invalid) => {
  const projected = nutritionMeasurements(followUpEvaluationsFromApi([{ anthropometric: { body_fat_percentage: invalid, muscle_percentage: invalid } }]))[0];
  expect(projected.bodyFatPercentage).toBeNull();
  expect(projected.musclePercentage).toBeNull();
  expect(measurementFields(projected).slice(1, 3).map((item) => item.value)).toEqual(['—', '—']);
});

test.each([0, 100, 25.5])('porcentaje registrado %s se conserva sin asignarle clasificación', (value) => {
  const projected = nutritionMeasurements(followUpEvaluationsFromApi([{ anthropometric: { body_fat_percentage: value, muscle_percentage: value } }]))[0];
  expect(projected.bodyFatPercentage).toBe(value);
  expect(projected.musclePercentage).toBe(value);
  expect(measurementFields(projected)[1].value).toBe(value + ' %');
});

test('evolución usa fechas válidas y pesos positivos, ordena una copia y limpia errores decimales', () => {
  const source = [measurement('2026-04-01', 70.2), measurement('2026-01-01', 73.4),
    measurement('2026-02-30', 500), measurement(null, 1), measurement('2026-03-01', -2), measurement('2026-02-01', Infinity)];
  const snapshot = JSON.stringify(source);
  expect(descriptiveWeightEvolution(source)).toEqual({
    measurements: [{ date: '2026-01-01', weight: 73.4 }, { date: '2026-04-01', weight: 70.2 }],
    firstDate: '2026-01-01', latestDate: '2026-04-01', difference: -3.2,
  });
  expect(JSON.stringify(source)).toBe(snapshot);
});

test.each([-2, 0, 2])('describe una variación de %s kg sin calificarla como favorable o contraria', (change) => {
  const result = descriptiveWeightEvolution([measurement('2026-01-01', 70), measurement('2026-02-01', 70 + change)]);
  expect(result.difference).toBe(change);
  expect(Object.keys(result).sort()).toEqual(['difference', 'firstDate', 'latestDate', 'measurements']);
});

test('una variación menor que la precisión mostrada no produce un cero negativo', () => {
  const result = descriptiveWeightEvolution([measurement('2026-01-01', 70), measurement('2026-02-01', 70 - 1e-12)]);
  expect(result.difference).toBe(0);
  expect(Object.is(result.difference, -0)).toBe(false);
});

test.each([
  [], [measurement('2026-01-01', 70)],
  [measurement('2026-01-01', 70), measurement('2026-01-01', 71)],
  [measurement('2026-01-01', 70), measurement('2026-01-01', 71), measurement('2026-02-01', 72)],
  [measurement('2026-01-01', 70), measurement('2026-02-01', 71), measurement('2026-02-01', 72)],
])('no inventa una comparación si faltan extremos distintos e inequívocos (%j)', (...rows) => {
  expect(descriptiveWeightEvolution(rows)).toHaveProperty('difference', null);
});
