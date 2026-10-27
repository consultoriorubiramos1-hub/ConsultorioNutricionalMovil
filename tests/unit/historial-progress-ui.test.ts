import { createElement, type EffectCallback } from 'react';
import { ActivityIndicator, FlatList, Platform, RefreshControl, StyleSheet } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { router } from 'expo-router';

import { AppButton, AppCard, AppIcon, AppText } from '@/components/ui';
import { WeightChart } from '@/components/ui/weight-chart';
import { Colors } from '@/constants/theme';
import { DashboardMenu } from '@/modules/dashboard/components/dashboard-menu';
import { FollowUpCard } from '@/modules/historial/components/follow-up-card';
import { HistoryFields } from '@/modules/historial/components/history-fields';
import { ProgressSummary } from '@/modules/historial/components/progress-summary';
import { HistorialView } from '@/modules/historial/views/historial-view';
import { clearSessionToken, getSessionToken } from '@/shared/session/session-token';

jest.mock('expo-router', () => ({
  router: { navigate: jest.fn(), replace: jest.fn() },
  useFocusEffect: (effect: EffectCallback) => require('react').useEffect(effect, [effect]),
}));
jest.mock('@/shared/session/session-token', () => ({ getSessionToken: jest.fn(), clearSessionToken: jest.fn() }));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
jest.setTimeout(15000);
let screen: ReactTestRenderer | undefined;
const fetchMock = () => jest.mocked(global.fetch);
const text = () => screen!.root.findAllByType(AppText).map((node) =>
  Array.isArray(node.props.children) ? node.props.children.join('') : node.props.children).join('\n');

function apiHistory(goal = 'Bajar de peso') {
  return {
    patient: { height: '170' },
    initialEvaluation: { evaluation_date: '2026-01-01', consultation_reason: { main_goal: goal } },
    followUpEvaluations: [
      { id: 3, evaluation_date: '2026-04-01', anthropometric: { weight: '79', body_fat_percentage: '25', muscle_percentage: '35', waist_circumference: '80' } },
      { id: 2, evaluation_date: '2026-03-01', anthropometric: { weight: '78' } },
      { id: 1, evaluation_date: '2026-02-01', anthropometric: { weight: '80' } },
    ],
  };
}
function response(data: unknown, status = 200) {
  return { ok: status < 400, status, json: async () => ({ ok: status < 400, data }) } as Response;
}
function respond(data: unknown) { fetchMock().mockResolvedValueOnce(response(data)); }
function cards() { return screen!.root.findAllByType(FollowUpCard); }
function card(date: string) { return cards().find((node) => node.props.measurement.evaluationDate === date)!; }
async function render() { await act(async () => { screen = create(createElement(HistorialView)); }); }
async function refresh() { await act(async () => screen!.root.findAllByType(RefreshControl)[0].props.onRefresh()); }

beforeEach(() => {
  jest.mocked(getSessionToken).mockResolvedValue('session-fixture');
  jest.mocked(clearSessionToken).mockResolvedValue(undefined);
});
afterEach(async () => { await act(async () => screen?.unmount()); screen = undefined; });

test.each(['ios', 'android'] as const)('API → Adapter → ViewModel restaura resumen e historial de cuatro mediciones con estado accesible en %s', async (platform) => {
  jest.replaceProperty(Platform, 'OS', platform);
  respond(apiHistory());
  await render();
  expect(global.fetch).toHaveBeenCalledWith('https://api.example.test/api/mobile/historial', expect.objectContaining({ method: 'GET' }));
  expect(text()).toContain('Mi progreso nutricional');
  expect(screen!.root.findAll((node) => ['tab', 'tablist'].includes(node.props.accessibilityRole))).toHaveLength(0);
  expect(card('2026-04-01').findByType(HistoryFields).props.fields).toEqual([
    { label: 'Peso', value: '79 kg' }, { label: 'Grasa corporal', value: '25 %' },
    { label: 'Masa muscular', value: '35 %' }, { label: 'Cintura', value: '80 cm' },
  ]);
  expect(card('2026-04-01').findAllByType(AppText).map((node) => node.props.children)).toEqual([
    '1 de abril de 2026', 'Peso', '79 kg', 'Grasa corporal', '25 %',
    'Masa muscular', '35 %', 'Cintura', '80 cm', '+1 kg · En dirección contraria a tu objetivo',
  ]);
  const summary = screen!.root.findByType(ProgressSummary);
  expect(summary.props.indicators).toEqual([
    { label: 'Peso actual', value: '79 kg', evaluationDate: '2026-04-01' },
    { label: 'Grasa corporal', value: '25 %', evaluationDate: '2026-04-01' },
    { label: 'Masa muscular', value: '35 %', evaluationDate: '2026-04-01' },
    { label: 'Cintura', value: '80 cm', evaluationDate: '2026-04-01' },
  ]);
  expect(summary.findAllByType(AppCard)).toHaveLength(4);
  for (const metric of summary.findAllByType(AppCard)) {
    expect(metric.findAllByType(AppIcon)).toHaveLength(1);
    expect(metric.findAllByType(AppText).map((node) => node.props.children)).toContain('1 de abril de 2026');
  }
  expect(text().indexOf('Mis últimas mediciones')).toBeLessThan(text().indexOf('Historial de progreso nutricional'));
  expect(text().indexOf('Historial de progreso nutricional')).toBeLessThan(text().indexOf('Evolución de tu peso'));
  for (const entry of cards()) {
    expect(entry.findAllByType(AppButton)).toHaveLength(0);
    expect(Object.keys(entry.props)).toEqual(['measurement', 'progress']);
    expect(entry.findAll((node) => node.props.onPress || node.props.accessibilityState?.expanded !== undefined)).toHaveLength(0);
    expect(entry.findAllByType(AppText).find((node) => node.props.accessibilityRole === 'header')!.props.accessibilityLabel).toContain(entry.props.progress.description);
  }
  expect(StyleSheet.flatten(card('2026-04-01').findByType(AppCard).props.style)).toMatchObject({ borderWidth: 2, borderColor: Colors.danger });
  expect(StyleSheet.flatten(card('2026-03-01').findByType(AppCard).props.style).borderColor).toBe(Colors.primaryGreen);
  expect(StyleSheet.flatten(card('2026-02-01').findByType(AppCard).props.style).borderColor).toBe(Colors.textSecondary);
  expect(screen!.root.findByType(WeightChart).props.measurements).toEqual([
    { date: '2026-02-01', weight: 80 }, { date: '2026-03-01', weight: 78 }, { date: '2026-04-01', weight: 79 },
  ]);
  expect(text()).toContain('Cambio de peso del 1 de febrero de 2026 al 1 de abril de 2026: -1 kg.');
  const list = screen!.root.findByType(FlatList);
  expect(list.props.scrollEnabled).not.toBe(false);
  expect(list.props.alwaysBounceVertical).toBe(true);
});

test('actualizar conserva fechas y claves, ordena los nuevos datos y recalcula el progreso con el objetivo actualizado', async () => {
  respond(apiHistory());
  await render();
  const keys = cards().map((node) => node.props.measurement.key);
  const updated = apiHistory('Subir de peso');
  updated.followUpEvaluations[0].anthropometric.weight = '77';
  updated.followUpEvaluations.reverse();
  respond(updated);
  await refresh();
  expect(cards().map((node) => node.props.measurement.evaluationDate)).toEqual(['2026-04-01', '2026-03-01', '2026-02-01']);
  expect(cards().map((node) => node.props.measurement.key)).toEqual(keys);
  expect(card('2026-04-01').findByType(HistoryFields).props.fields[0].value).toBe('77 kg');
  expect(text()).toContain('Cambio de peso del 1 de febrero de 2026 al 1 de abril de 2026: -3 kg.');
  expect(card('2026-04-01').props.progress.status).toBe('opposed');
  expect(card('2026-03-01').props.progress.status).toBe('opposed');
  expect(text()).not.toMatch(/CLINICO_|Ver detalles/);
});

test('un registro incompleto conserva fecha y los cuatro campos, sin inventar ceros ni abrir detalles', async () => {
  respond({ patient: {}, initialEvaluation: null, followUpEvaluations: [{ id: 1, evaluation_date: '2026-03-01', anthropometric: null }] });
  await render();
  expect(cards()).toHaveLength(1);
  expect(card('2026-03-01').findByType(HistoryFields).props.fields).toEqual([
    { label: 'Peso', value: '—' }, { label: 'Grasa corporal', value: '—' },
    { label: 'Masa muscular', value: '—' }, { label: 'Cintura', value: '—' },
  ]);
  expect(text()).not.toMatch(/Ver detalles|Ocultar detalles|Antropometría|Falta edad|IMC/);
});

test.each([
  ['Bajar de peso', '77', Colors.primaryGreen], ['Bajar de peso', '79', Colors.danger], ['Aumentar de peso', '79', Colors.primaryGreen],
  ['Aumentar de peso', '77', Colors.danger], ['Bajar de peso', '78', Colors.textSecondary], ['Mejorar hábitos', '77', Colors.textSecondary], ['Mantener el peso', '77', Colors.textSecondary],
])('el objetivo %s con %s kg recupera el borde %s sin acciones de detalle', async (goal, weight, color) => {
  const data = apiHistory(goal);
  data.followUpEvaluations[0].anthropometric.weight = weight;
  respond(data);
  await render();
  expect(StyleSheet.flatten(card('2026-04-01').findByType(AppCard).props.style)).toMatchObject({ borderWidth: 2, borderColor: color });
  for (const entry of cards()) {
    expect(entry.findAllByType(AppButton)).toHaveLength(0);
    expect(entry.findAllByType(AppText).map((node) => node.props.children)).toContain(entry.props.progress.label);
  }
  expect(text()).not.toMatch(/CLINICO_|Ver detalles|Diagnóstico nutricional/);
});

test.each([
  ['77', Colors.primaryGreen, 'Dentro del rango de mantenimiento indicado'],
  ['79', Colors.primaryGreen, 'Dentro del rango de mantenimiento indicado'],
  ['80', Colors.danger, 'Fuera del rango de mantenimiento indicado'],
])('mantenimiento respeta los límites registrados al medir %s kg', async (weight, color, description) => {
  const data = apiHistory('Mantener el peso entre 77 y 79 kg');
  data.followUpEvaluations[0].anthropometric.weight = weight;
  respond(data);
  await render();
  const entry = card('2026-04-01');
  expect(StyleSheet.flatten(entry.findByType(AppCard).props.style).borderColor).toBe(color);
  expect(entry.props.progress.label).toContain(description);
  expect(entry.findAllByType(AppText).map((node) => node.props.children)).toContain(entry.props.progress.label);
});

test('las cuatro tarjetas principales conservan icono, valor y fecha propios, usando — para valores ausentes', async () => {
  respond({ patient: {}, initialEvaluation: null, followUpEvaluations: [
    { id: 2, evaluation_date: '2026-04-01', anthropometric: { weight: 79, muscle_percentage: 0 } },
    { id: 1, evaluation_date: '2026-02-01', anthropometric: { weight: 80, body_fat_percentage: 25 } },
  ] });
  await render();
  const metrics = screen!.root.findByType(ProgressSummary).findAllByType(AppCard);
  expect(metrics).toHaveLength(4);
  expect(metrics.map((metric) => metric.findAllByType(AppText).map((node) => node.props.children))).toEqual([
    ['Peso actual', '79 kg', '1 de abril de 2026'], ['Grasa corporal', '25 %', '1 de febrero de 2026'],
    ['Masa muscular', '0 %', '1 de abril de 2026'], ['Cintura', '—', '—'],
  ]);
  expect(metrics.every((metric) => metric.findAllByType(AppIcon).length === 1)).toBe(true);
});

test('registros sin fecha válida o peso válido mantienen borde gris y no muestran un cambio inventado', async () => {
  respond({ ...apiHistory(), followUpEvaluations: [
    { id: 1, evaluation_date: '2026-01-01', anthropometric: { weight: 80 } },
    { id: 2, evaluation_date: '2026-02-30', anthropometric: { weight: 70 } },
    { id: 3, evaluation_date: '2026-03-01', anthropometric: { weight: -1 } },
  ] });
  await render();
  expect(cards()).toHaveLength(3);
  for (const entry of cards()) {
    expect(entry.props.progress.status).toBe('neutral');
    expect(StyleSheet.flatten(entry.findByType(AppCard).props.style).borderColor).toBe(Colors.textSecondary);
    expect(entry.props.progress.label).not.toMatch(/[+-]\d.*kg/);
  }
  expect(text()).toContain('Sin fecha registrada');
  expect(text()).not.toMatch(/NaN|Infinity|Ver detalles|mmHg/);
});

test('recargar no restaura pestañas ni detalles aunque cambien el orden y las notas del servidor', async () => {
  respond(apiHistory());
  await render();
  const data = apiHistory('CLINICO_OBJETIVO');
  data.followUpEvaluations.reverse();
  respond(data);
  await refresh();
  expect(cards()).toHaveLength(3);
  expect(screen!.root.findAll((node) => node.props.accessibilityRole === 'tab')).toHaveLength(0);
  expect(text()).not.toMatch(/CLINICO_|Ver detalles|Evaluación inicial|Registro inicial|Mi historial/);
});

test.each(['ios', 'android'] as const)('conserva la referencia de IMC elegible original sin convertirla en diagnóstico en %s', async (platform) => {
  jest.replaceProperty(Platform, 'OS', platform);
  respond({
    ...apiHistory('Control de peso'),
    patient: { height: '170', age: 30, gender: 'M', fecha_nacimiento: '1996-01-01' },
    followUpEvaluations: [
      { id: 3, evaluation_date: '2026-03-14', anthropometric: { weight: '74' } },
      { id: 2, evaluation_date: '2026-02-14', anthropometric: { weight: '76.7' } },
      { id: 1, evaluation_date: '2026-01-14', anthropometric: { weight: '78' } },
    ],
  });
  await render();
  expect(cards()).toHaveLength(3);
  expect(text()).toContain('Cambio de peso del 14 de enero de 2026 al 14 de marzo de 2026: -4 kg.');
  expect(card('2026-03-14').props.progress).toMatchObject({ source: 'bmi', status: 'aligned' });
  expect(card('2026-03-14').props.progress.description).toContain('no es un diagnóstico');
  expect(text()).not.toMatch(/Saludable|Sobrepeso|Obesidad|Objetivo:/);
});

test('la ausencia de edad no impide consultar los registros ni genera una referencia clínica', async () => {
  respond(apiHistory('Mejorar hábitos'));
  await render();
  expect(cards()).toHaveLength(3);
  expect(text()).not.toMatch(/Falta edad|Falta estatura|referencia individual|IMC/);
});

test.each([60, 18.5 * 1.7 ** 2, 24.9 * 1.7 ** 2])('con %s kg sin cambios y referencia insuficiente mantiene diferencia cero y borde gris', async (weight) => {
  respond({ ...apiHistory('Control de peso'), followUpEvaluations: ['2026-04-01', '2026-03-01', '2026-02-01']
    .map((date, index) => ({ id: index + 1, evaluation_date: date, anthropometric: { weight } })) });
  await render();
  expect(text()).toContain('Cambio de peso del 1 de febrero de 2026 al 1 de abril de 2026: 0 kg.');
  expect(text()).not.toMatch(/dentro de|fuera de|IMC|clasificación/i);
  expect(card('2026-04-01').props.progress.status).toBe('neutral');
});

test('la carga inicial no muestra estado vacío ni tarjetas y pasa a los registros al resolver', async () => {
  let finish!: (value: Response) => void;
  fetchMock().mockReturnValueOnce(new Promise((resolve) => { finish = resolve; }));
  await render();
  expect(screen!.root.findAllByType(ActivityIndicator)).toHaveLength(1);
  expect(cards()).toHaveLength(0);
  expect(text()).toContain('Cargando tu progreso nutricional…');
  expect(text()).not.toContain('Aún no tienes mediciones registradas.');
  expect(screen!.root.findAllByType(RefreshControl)[0].props.enabled).toBe(false);
  await act(async () => finish(response(apiHistory())));
  expect(screen!.root.findAllByType(ActivityIndicator)).toHaveLength(0);
  expect(cards()).toHaveLength(3);
});

test.each([404, 500])('un error inicial %s muestra recarga y no se confunde con ausencia de datos', async (status) => {
  fetchMock().mockResolvedValueOnce(response(null, status));
  await render();
  expect(text()).toContain('No se pudo actualizar tu progreso nutricional');
  expect(text()).not.toContain('Aún no tienes mediciones registradas.');
  expect(cards()).toHaveLength(0);
  respond(apiHistory());
  await act(async () => screen!.root.findAllByType(AppButton).find((node) => node.props.label === 'Reintentar')!.props.onPress());
  expect(cards()).toHaveLength(3);
});

test('cerrar sesión durante una recarga aborta la consulta y rechaza resultados tardíos', async () => {
  respond(apiHistory());
  await render();
  let finish!: (value: Response) => void;
  fetchMock().mockReturnValueOnce(new Promise((resolve) => { finish = resolve; }));
  await refresh();
  const signal = fetchMock().mock.calls[1][1]!.signal!;
  await act(async () => { await screen!.root.findByType(DashboardMenu).props.onLogout(); });
  expect(signal.aborted).toBe(true);
  expect(clearSessionToken).toHaveBeenCalledTimes(1);
  expect(router.replace).toHaveBeenCalledWith('/login');
  await act(async () => finish(response(apiHistory())));
  expect(cards()).toHaveLength(0);
});
