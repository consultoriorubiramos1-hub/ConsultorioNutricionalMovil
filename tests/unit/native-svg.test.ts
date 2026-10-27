import { readFileSync } from 'node:fs';
import { Children, createElement } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import Svg, { Circle, LinearGradient, Path, Polygon, Polyline, Stop, SvgXml, Text as SvgText } from 'react-native-svg';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';

import { AppIcon, type IconName } from '@/components/ui/app-icon';
import { AppText } from '@/components/ui/app-text';
import { WeightChart } from '@/components/ui/weight-chart';
import { Colors } from '@/constants/theme';

// Catálogo de referencia tomado antes de cambiar el renderer: protege nombres y formas.
const iconPaths: Record<IconName, string> = {
  "menu": "<path d=\"M4 6h16M4 12h16M4 18h16\"/>",
  "back": "<path d=\"m14 5-7 7 7 7\"/>",
  "chevron": "<path d=\"m9 5 7 7-7 7\"/>",
  "down": "<path d=\"m5 9 7 7 7-7\"/>",
  "close": "<path d=\"m6 6 12 12M18 6 6 18\"/>",
  "home": "<path d=\"m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z\"/>",
  "user": "<circle cx=\"12\" cy=\"7\" r=\"4\"/><path d=\"M4 21v-2a8 8 0 0 1 16 0v2\"/>",
  "calendar": "<rect x=\"3\" y=\"5\" width=\"18\" height=\"16\" rx=\"3\"/><path d=\"M7 3v5M17 3v5M3 11h18\"/>",
  "plan": "<rect x=\"5\" y=\"3\" width=\"14\" height=\"18\" rx=\"2\"/><path d=\"M9 8h6M9 12h6M9 16h3\"/>",
  "chart": "<path d=\"M5 20v-6M12 20V9M19 20V3\"/>",
  "history": "<rect x=\"5\" y=\"5\" width=\"14\" height=\"16\" rx=\"2\"/><rect x=\"9\" y=\"2\" width=\"6\" height=\"6\" rx=\"2\"/><path d=\"M9 14h6M12 11v6\"/>",
  "wall": "<path d=\"M4 3h16v14H9l-5 4zM8 7h8M8 11h6\"/>",
  "logout": "<path d=\"M10 3H4v18h6M9 12h12m-5-5 5 5-5 5\"/>",
  "mail": "<rect x=\"3\" y=\"5\" width=\"18\" height=\"14\" rx=\"2\"/><path d=\"m3 6 9 7 9-7\"/>",
  "lock": "<rect x=\"5\" y=\"10\" width=\"14\" height=\"11\" rx=\"2\"/><path d=\"M8 10V6a4 4 0 0 1 8 0v4M12 14v3\"/>",
  "eye": "<path d=\"M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z\"/><circle cx=\"12\" cy=\"12\" r=\"3\"/>",
  "eyeOff": "<path d=\"m3 3 18 18M10 5c7-2 12 7 12 7a20 20 0 0 1-4 4M6 6a20 20 0 0 0-4 6s4 7 10 7a12 12 0 0 0 5-1M10 10a3 3 0 0 0 4 4\"/>",
  "search": "<circle cx=\"10\" cy=\"10\" r=\"7\"/><path d=\"m15 15 6 6\"/>",
  "clock": "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M12 6v6l4 2\"/>",
  "weight": "<rect x=\"4\" y=\"4\" width=\"16\" height=\"17\" rx=\"4\"/><path d=\"M8 4a4 4 0 0 0 8 0M12 5V3\"/>",
  "fork": "<path d=\"M4 3v6a3 3 0 0 0 6 0V3M7 3v18M20 3c-4 2-5 6-5 10h5M20 3v18\"/>",
  "bowl": "<path d=\"M3 12h18a9 9 0 0 1-18 0ZM8 8c-3-2 2-3 0-6M13 8c-3-2 2-3 0-6M17 8c-3-2 2-3 0-6\"/>",
  "apple": "<path d=\"M12 6c-9-6-13 5-7 13 3 4 5 1 7 1s4 3 7-1c6-8 2-19-7-13ZM12 6c0-4 3-5 5-5\"/>",
  "moon": "<path d=\"M20 15A9 9 0 0 1 9 3a9 9 0 1 0 11 12Z\"/>",
  "shield": "<path d=\"m12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6zM8 11l3 3 5-6\"/>",
  "settings": "<path d=\"m9 3-1 3-3 1v4l-2 2 2 3 3-1 2 3h4l1-3 3-1v-4l2-2-2-3-3 1-2-3z\"/><circle cx=\"11\" cy=\"10\" r=\"3\"/>",
  "upload": "<path d=\"M7 18H5a4 4 0 0 1-1-8 8 8 0 0 1 16-1 5 5 0 0 1 0 10h-3M12 21V9m-4 4 4-4 4 4\"/>",
  "bank": "<path d=\"m2 7 10-5 10 5ZM3 21h18M4 18h16M6 10v5M12 10v5M18 10v5\"/>",
  "check": "<path d=\"m5 12 4 4L19 6\"/>",
  "heart": "<path d=\"M12 21 3 12C-3 3 9-2 12 6c3-8 15-3 9 6z\"/>",
  "phone": "<path d=\"m5 3 4 4-2 3a15 15 0 0 0 7 7l3-2 4 4c-3 6-10 1-14-3S-1 6 5 3Z\"/>",
  "info": "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M12 11v6M12 7v.2\"/>"
};

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
let screen: ReactTestRenderer | undefined;
beforeEach(() => { jest.replaceProperty(Platform, 'OS', 'android'); });
afterEach(async () => { await act(async () => screen?.unmount()); screen = undefined; });

test.each(Object.keys(iconPaths) as IconName[])('el icono %s conserva su SVG y usa componentes nativos en Android', async (name) => {
  await act(async () => { screen = create(createElement(AppIcon, { name, size: 32, color: '#123456' })); });
  const xml = screen!.root.findByType(SvgXml);
  expect(xml.props.xml).toBe(
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#123456" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">'
    + iconPaths[name] + '</svg>',
  );
  expect(xml.props).toMatchObject({ width: 32, height: 32, accessible: false });
  expect(screen!.root.findByType(Svg).props).toMatchObject({ width: 32, height: 32, viewBox: '0 0 24 24', stroke: '#123456', fill: 'none' });
  expect(screen!.root.findAll((node) => typeof node.type === 'string' && String(node.type) === 'RNSVGSvgViewAndroid')).toHaveLength(1);
  expect(screen!.root.findAllByType(ExpoImage)).toHaveLength(0);
  expect(global.fetch).not.toHaveBeenCalled();
});

test('el icono mantiene tamaño y color predeterminados y responde a cambios de sus props', async () => {
  await act(async () => { screen = create(createElement(AppIcon, { name: 'heart' })); });
  expect(screen!.root.findByType(SvgXml).props).toMatchObject({ width: 24, height: 24 });
  expect(screen!.root.findByType(Svg).props.stroke).toBe(Colors.textSecondary);
  await act(async () => screen!.update(createElement(AppIcon, { name: 'check', size: 16, color: Colors.primaryGreen })));
  expect(screen!.root.findByType(Svg).props).toMatchObject({ width: 16, height: 16, stroke: Colors.primaryGreen });
  expect(screen!.root.findByType(Path).props.d).toBe('m5 12 4 4L19 6');
});

test.each(['android', 'ios'] as const)('la gráfica dibuja línea, puntos, cuadrícula, área y etiquetas con SVG nativo en %s', async (platform) => {
  jest.replaceProperty(Platform, 'OS', platform);
  const measurements = [{ date: '2026-02-01', weight: 70 }, { date: '2026-01-01', weight: 72 }];
  const before = JSON.stringify(measurements);
  await act(async () => { screen = create(createElement(WeightChart, { measurements })); });
  const xml = screen!.root.findByType(SvgXml);
  expect(xml.props).toMatchObject({ width: '100%', height: '100%', accessible: false });
  expect(screen!.root.findByType(Svg).props).toMatchObject({ width: '100%', height: '100%', viewBox: '0 0 330 180' });
  const line = screen!.root.findByType(Polyline);
  expect(line.props).toMatchObject({ points: '50,58.5 305,119.5', fill: 'none', stroke: '#77AD2E' });
  expect(String(line.props.strokeWidth)).toBe('2.5');
  expect(screen!.root.findAllByType(Circle).map((point) => [String(point.props.cx), String(point.props.cy), String(point.props.r)]))
    .toEqual([['50', '58.5', '4'], ['305', '119.5', '4']]);
  expect(screen!.root.findAllByType(Circle).every((point) => point.props.fill === '#77AD2E' && point.props.stroke === 'white')).toBe(true);
  const gridLines = screen!.root.findAllByType(Path).filter((path) => path.props.stroke === '#E7E9ED');
  expect(gridLines).toHaveLength(4);
  expect(gridLines.every((grid) => grid.props.strokeDasharray === '4 4')).toBe(true);
  expect(screen!.root.findAllByType(SvgText).map((label) => Children.toArray(label.props.children).join(''))).toEqual(['73.0', '71.7', '70.3', '69.0']);
  expect(screen!.root.findByType(Polygon).props.points).toBe('50,150 50,58.5 305,119.5 305,150');
  expect(screen!.root.findByType(LinearGradient).props.id).toBe('area');
  expect(screen!.root.findAllByType(Stop)).toHaveLength(2);
  const accessibleChart = screen!.root.findAllByType(View).find((node) => node.props.accessibilityRole === 'image')!;
  expect(StyleSheet.flatten(accessibleChart.props.style)).toMatchObject({ width: '100%', aspectRatio: 330 / 180 });
  expect(accessibleChart.props.accessible).toBe(true);
  expect(accessibleChart.props.accessibilityLabel).toContain('72 kg');
  expect(accessibleChart.props.accessibilityLabel).toContain('70 kg');
  expect(screen!.root.findAllByType(ExpoImage)).toHaveLength(0);
  expect(JSON.stringify(measurements)).toBe(before);
  expect(global.fetch).not.toHaveBeenCalled();
});

test.each([
  [{ date: '2026-01-01', weight: 72 }],
  [{ date: '2026-01-01', weight: 72 }, { date: '2026-01-01', weight: 70 }],
])('la gráfica conserva puntos con uno o varios registros del mismo día (%j)', async (...measurements) => {
  await act(async () => { screen = create(createElement(WeightChart, { measurements })); });
  expect(screen!.root.findAllByType(Circle)).toHaveLength(measurements.length);
  expect(screen!.root.findByType(Polyline).props.points).not.toMatch(/NaN|Infinity/);
});

test('la gráfica conserva filtros y estado vacío sin convertir datos ausentes en mediciones', async () => {
  const measurements = [
    { date: '2026-01-01', weight: 72 }, { date: 'sin fecha', weight: 80 },
    { date: '2026-01-02', weight: NaN }, { date: '2026-01-03', weight: 0 },
    { date: '2026-01-04', weight: -1 }, { date: '2026-01-05', weight: Infinity },
  ];
  await act(async () => { screen = create(createElement(WeightChart, { measurements })); });
  expect(screen!.root.findAllByType(Circle)).toHaveLength(1);
  expect(screen!.root.findAllByType(AppText).some((node) => node.props.children === 'Con tu siguiente medición podrás comparar tu evolución.')).toBe(true);
  await act(async () => screen!.update(createElement(WeightChart, { measurements: [] })));
  expect(screen!.root.findAllByType(SvgXml)).toHaveLength(0);
  expect(screen!.root.findAllByType(AppText).some((node) => node.props.children === 'Tu gráfica estará disponible cuando tengas mediciones registradas.')).toBe(true);
});

test.each(['src/components/ui/app-icon.tsx', 'src/components/ui/weight-chart.tsx'])('%s no vuelve a delegar SVG en imágenes o URI', (file) => {
  expect(readFileSync(file, 'utf8')).not.toMatch(/expo-image|data:image\/svg\+xml|SvgUri|encodeURIComponent/);
});
