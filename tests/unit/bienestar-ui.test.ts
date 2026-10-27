import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import ts from 'typescript';
import { router } from 'expo-router';
import { createElement, type EffectCallback } from 'react';
import { Platform, RefreshControl } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';

import { AppButton, AppText } from '@/components/ui';
import { WeightChart } from '@/components/ui/weight-chart';
import { DashboardMenu } from '@/modules/dashboard/components/dashboard-menu';
import { DashboardView } from '@/modules/dashboard/views/dashboard-view';
import { FollowUpCard } from '@/modules/historial/components/follow-up-card';
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
const reply = (data: unknown, status = 200) => ({
  ok: status < 400, status, json: async () => ({ ok: status < 400, data }),
}) as Response;
const text = () => screen!.root.findAllByType(AppText)
  .map((node) => Array.isArray(node.props.children) ? node.props.children.join('') : node.props.children).join('\n');

function history() {
  return {
    patient: { first_name: 'Ana', height: '170' },
    initialEvaluation: {
      evaluation_date: '2026-01-01',
      consultation_reason: { main_goal: 'Bajar de peso', treatment_expectations: 'CLINICO_EXPECTATIVAS' },
      family_history: { diabetes: true, other_conditions: 'CLINICO_FAMILIA' },
      personal_history: { current_diseases: 'CLINICO_ENFERMEDAD', current_medications: 'CLINICO_MEDICAMENTO' },
      gynecological_history: { symptoms: 'CLINICO_GINECOLOGIA', pregnancies: 0 },
      non_pathological_history: { physical_activity_type: 'Caminata', daily_hydration: '2 litros', sleep_quality: '8 horas' },
      dietary_recall: { breakfast: 'Avena y fruta' },
      food_frequency: { fruits: 'Diario' },
      feeding_habits: { meal_schedules: '8, 14 y 20 h', eating_anxiety: 'CLINICO_ANSIEDAD', binges: 'CLINICO_ATRACONES' },
    },
    followUpEvaluations: [
      { id: 2, evaluation_date: '2026-10-01', anthropometric: {
        weight: '70', height: '170', body_fat_percentage: '25', muscle_percentage: '35',
        waist_circumference: '80', hip_circumference: '95', gluteus_circumference: '96',
        arm_circumference: '28', leg_circumference: '50', neck_circumference: '32',
        biceps_skinfold_mm: '8', triceps_skinfold_mm: '12',
        blood_pressure_systolic: '120', blood_pressure_diastolic: '80',
      }, biochemical_params: { glucose: '90', other_params: 'CLINICO_LABORATORIO' },
      nutritional_diagnosis: { diagnosis: 'CLINICO_DIAGNOSTICO' },
      intervention_plan: { dietary_strategy: 'CLINICO_INTERVENCION', specific_recommendations: 'CLINICO_RECOMENDACION' },
      follow_up: { observations: 'CLINICO_OBSERVACION', next_appointment_date: '2026-11-01', indicators_to_evaluate: 'CLINICO_INDICADORES' } },
      { id: 1, evaluation_date: '2026-09-01', anthropometric: { weight: '72' } },
    ],
  };
}

beforeEach(() => {
  jest.mocked(getSessionToken).mockResolvedValue('fixture-session');
  jest.mocked(clearSessionToken).mockResolvedValue(undefined);
});
afterEach(async () => { await act(async () => screen?.unmount()); screen = undefined; });

test.each(['android', 'ios'] as const)('progreso limita cada tarjeta a fecha y cuatro mediciones sin detalles ni datos clínicos en %s', async (platform) => {
  jest.replaceProperty(Platform, 'OS', platform);
  const data = history();
  const original = JSON.stringify(data);
  fetchMock().mockResolvedValue(reply(data));
  await act(async () => { screen = create(createElement(HistorialView)); });
  expect(text()).toContain('Mi progreso nutricional');
  const excluded = /CLINICO_|Diagnóstico nutricional|Parámetros bioquímicos|Plan de intervención|Presión arterial|Antecedentes|Historia ginecológica|Próxima cita|mmHg|historial médico/i;
  expect(text()).not.toMatch(excluded);
  const entries = screen!.root.findAllByType(FollowUpCard);
  expect(entries).toHaveLength(2);
  for (const entry of entries) {
    expect(Object.keys(entry.props.measurement).sort()).toEqual([
      'bodyFatPercentage', 'evaluationDate', 'key', 'musclePercentage', 'waistCircumference', 'weight',
    ]);
    expect(entry.findAllByType(AppButton)).toHaveLength(0);
  }
  expect(entries[0].findAllByType(AppText).map((node) => node.props.children)).toEqual([
    '1 de octubre de 2026', 'Peso', '70 kg', 'Grasa corporal', '25 %',
    'Masa muscular', '35 %', 'Cintura', '80 cm', '-2 kg · En la dirección de tu objetivo',
  ]);
  expect(text()).not.toMatch(/Ver detalles|Ocultar detalles|Cadera|Glúteo|Brazo|Pierna|Cuello|Pliegues|Bíceps|Tríceps|Caminata|Avena y fruta|Objetivo:|IMC/);
  expect(screen!.root.findAll((node) => node.props.accessibilityRole === 'tab')).toHaveLength(0);
  expect(screen!.root.findByType(WeightChart).props.measurements).toEqual([
    { date: '2026-09-01', weight: 72 }, { date: '2026-10-01', weight: 70 },
  ]);
  expect(JSON.stringify(data)).toBe(original);
});

test('progreso conserva datos ante error de red y permite recargar; una sesión expirada los retira', async () => {
  fetchMock().mockResolvedValueOnce(reply(history()));
  await act(async () => { screen = create(createElement(HistorialView)); });
  fetchMock().mockRejectedValueOnce(new Error('Sin red'));
  await act(async () => screen!.root.findAllByType(RefreshControl)[0].props.onRefresh());
  expect(text()).toContain('Se muestra la última información consultada.');
  expect(text()).toContain('No se pudo conectar con el servidor.');
  expect(screen!.root.findAllByType(FollowUpCard)).toHaveLength(2);
  fetchMock().mockResolvedValueOnce(reply(history()));
  await act(async () => screen!.root.findAllByType(AppButton).find((node) => node.props.label === 'Reintentar')!.props.onPress());
  expect(text()).not.toContain('Se muestra la última información consultada.');
  fetchMock().mockResolvedValueOnce(reply(null, 401));
  await act(async () => screen!.root.findAllByType(RefreshControl)[0].props.onRefresh());
  expect(screen!.root.findAllByType(FollowUpCard)).toHaveLength(0);
  expect(text()).toContain('Inicia sesión nuevamente');
  expect(clearSessionToken).toHaveBeenCalledTimes(1);
  await act(async () => screen!.root.findAllByType(AppButton).find((node) => node.props.label === 'Iniciar sesión')!.props.onPress());
  expect(router.replace).toHaveBeenCalledWith('/login');
});

test('progreso vacío conserva mensajes y recarga accesibles', async () => {
  fetchMock().mockResolvedValue(reply({ patient: {}, initialEvaluation: null, followUpEvaluations: [] }));
  await act(async () => { screen = create(createElement(HistorialView)); });
  expect(text()).toContain('Aún no tienes mediciones registradas.');
  expect(screen!.root.findAllByType(FollowUpCard)).toHaveLength(0);
  expect(screen!.root.findAllByType(WeightChart)).toHaveLength(0);
  expect(screen!.root.findByType(ProgressSummary).props.indicators).toHaveLength(4);
  expect(screen!.root.findByType(ProgressSummary).props.indicators.every((item: { value: string }) => item.value === '—')).toBe(true);
  expect(screen!.root.findAll((node) => node.props.accessibilityRole === 'tab')).toHaveLength(0);
  expect(screen!.root.findAllByType(RefreshControl)[0].props.enabled).toBe(true);
});

test('Inicio carga progreso y plan, retira tarjetas clínicas y mantiene todos sus destinos de bienestar', async () => {
  fetchMock().mockImplementation(async (url) => {
    if (String(url).endsWith('/historial')) return reply(history());
    if (String(url).endsWith('/plan-alimenticio')) return reply({ id: 3, name: 'Plan de prueba', is_active: true });
    throw new Error('Petición inesperada: ' + url);
  });
  await act(async () => { screen = create(createElement(DashboardView)); });
  expect(text()).toContain('Mi progreso nutricional');
  expect(text()).toContain('Plan de prueba');
  expect(text()).not.toMatch(/citas|reservar|comprobante|historial médico|CLINICO_/i);
  expect(fetchMock()).toHaveBeenCalledTimes(2);
  expect(fetchMock().mock.calls.every(([url]) => !String(url).includes('/citas'))).toBe(true);
  expect(screen!.root.findByType(WeightChart).props.measurements).toHaveLength(2);
  await act(async () => screen!.root.findAllByType(AppButton).find((node) => node.props.label === 'Ver mi plan')!.props.onPress());
  expect(router.navigate).toHaveBeenLastCalledWith('/plan-alimenticio');
  for (const [label, route] of [['Mi progreso nutricional', '/historial'], ['Mi perfil', '/perfil'], ['Muro', '/muro']] as const) {
    await act(async () => screen!.root.findAllByProps({ accessibilityLabel: 'Abrir menú de navegación' })[0].props.onPress());
    const menu = screen!.root.findByType(DashboardMenu);
    const entry = menu.findAll((node) => node.props.onPress && node.props.accessibilityRole === 'button'
      && node.findAllByType(AppText).some((child) => child.props.children === label))[0];
    await act(async () => entry.props.onPress());
    expect(router.navigate).toHaveBeenLastCalledWith(route);
  }
});

test('ninguna ruta carga formularios, servicios o viewmodels clínicos retirados', () => {
  // Recorre imports de ejecución y reexports reales; las rutas profundas usan
  // estas mismas entradas. Los contratos clínicos de datos permanecen permitidos.
  const seen = new Set<string>();
  function visit(file: string) {
    if (seen.has(file)) return;
    seen.add(file);
    const ast = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
    for (const node of ast.statements) {
      if (!(ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) || !node.moduleSpecifier
        || !ts.isStringLiteral(node.moduleSpecifier)) continue;
      if (ts.isImportDeclaration(node) ? node.importClause?.isTypeOnly : node.isTypeOnly) continue;
      const specifier = node.moduleSpecifier.text;
      const base = specifier.startsWith('@/') ? resolve('src', specifier.slice(2))
        : specifier.startsWith('.') ? resolve(dirname(file), specifier) : null;
      if (!base) continue;
      const target = [base + '.ts', base + '.tsx', resolve(base, 'index.ts'), resolve(base, 'index.tsx')].find(existsSync);
      if (target) visit(target);
    }
  }
  for (const file of readdirSync('src/app').filter((name) => /\.tsx?$/.test(name))) visit(resolve('src/app', file));
  const reachable = [...seen].map((file) => file.replace(/\\/g, '/'));
  expect(reachable.filter((file) => /modules\/citas\/(components|services|viewmodels)\//.test(file))).toEqual([]);
  expect(reachable.filter((file) => /modules\/historial\/components\/(?:initial-evaluation|history-accordion|patient-card)\./.test(file))).toEqual([]);
  expect([...seen].some((file) => file.endsWith('plan-alimenticio-view.tsx'))).toBe(true);
  expect([...seen].some((file) => file.endsWith('perfil-view.tsx'))).toBe(true);
});
