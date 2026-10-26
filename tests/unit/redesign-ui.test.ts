import { createElement } from 'react';
import { Modal, TextInput } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';

import { AppButton, AppText } from '@/components/ui';
import { WeightChart } from '@/components/ui/weight-chart';
import { LoginView } from '@/modules/auth/views/login-view';
import { PostCard } from '@/modules/muro/components/post-card';
import { nutritionPlanFromApi } from '@/modules/plan-alimenticio/adapters/plan-alimenticio-adapter';
import { PlanDetails } from '@/modules/plan-alimenticio/components/plan-details';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn() } }));
jest.mock('@/modules/auth/viewmodels/use-login-view-model', () => ({
  useLoginViewModel: () => ({ username: 'fixture', password: 'fixture-password', loading: false, error: null, setUsername: jest.fn(), setPassword: jest.fn(), login: jest.fn() }),
}));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
let screen: ReactTestRenderer | undefined;
afterEach(async () => { await act(async () => screen?.unmount()); screen = undefined; });

test('mostrar la contraseña mantiene las credenciales y vuelve a ocultarse', async () => {
  await act(async () => { screen = create(createElement(LoginView)); });
  const password = () => screen!.root.findAllByType(TextInput).find((node) => node.props.accessibilityLabel === 'Contraseña')!;
  expect(password().props.secureTextEntry).toBe(true);
  await act(async () => screen!.root.findAllByProps({ accessibilityLabel: 'Mostrar contraseña' }).find((node) => node.props.onPress)!.props.onPress());
  expect(password().props).toMatchObject({ secureTextEntry: false, value: 'fixture-password' });
  await act(async () => screen!.root.findAllByProps({ accessibilityLabel: 'Ocultar contraseña' }).find((node) => node.props.onPress)!.props.onPress());
  expect(password().props.secureTextEntry).toBe(true);
});

test('el detalle de la comida conserva las indicaciones completas y cierra con Atrás', async () => {
  const description = 'Ingredientes del servidor\n150 g de prueba\n\nPreparación\nPrimera indicación.\nSegunda indicación.';
  const plan = nutritionPlanFromApi({ menus: { MENU_1: { days: ['Lunes'], meals: { DESAYUNO: { description } } } } })!;
  await act(async () => { screen = create(createElement(PlanDetails, { plan, selectedMenu: 'MENU_1', menuOfToday: null, disabled: false, onSelectMenu: jest.fn() })); });
  expect(screen!.root.findByType(Modal).props.visible).toBe(false);
  await act(async () => screen!.root.findAllByType(AppButton).find((node) => node.props.accessibilityLabel === 'Ver preparación de desayuno')!.props.onPress());
  expect(screen!.root.findByType(Modal).props.visible).toBe(true);
  expect(screen!.root.findAllByType(AppText).some((node) => node.props.children === description && node.props.selectable)).toBe(true);
  await act(async () => screen!.root.findByType(Modal).props.onRequestClose());
  expect(screen!.root.findByType(Modal).props.visible).toBe(false);
  expect(global.fetch).not.toHaveBeenCalled();
});

test('la gráfica admite un único registro y describe solamente las mediciones válidas', async () => {
  const measurements = [{ date: '2026-10-02', weight: 64.1 }, { date: 'sin fecha', weight: 80 }, { date: '2026-10-03', weight: NaN }];
  await act(async () => { screen = create(createElement(WeightChart, { measurements })); });
  const labels = screen!.root.findAll((node) => typeof node.props.accessibilityLabel === 'string').map((node) => node.props.accessibilityLabel as string);
  expect(labels.some((label) => label.includes('64.1 kg') && !label.includes('80 kg'))).toBe(true);
  expect(screen!.root.findAllByType(AppText).some((node) => node.props.children === 'Con tu siguiente medición podrás comparar tu evolución.')).toBe(true);
  await act(async () => { screen!.update(createElement(WeightChart, { measurements: [] })); });
  expect(screen!.root.findAllByType(AppText).some((node) => node.props.children === 'Tu gráfica estará disponible cuando tengas mediciones registradas.')).toBe(true);
});

test('el muro permite leer el contenido completo sin perder la descripción ni la acción de like', async () => {
  const onLike = jest.fn();
  const post = { id: 1, title: 'Publicación de prueba', description: 'Resumen de prueba', content: 'Texto completo del servidor\ncon salto de línea.', createdAt: null, images: [], links: [], likesCount: 2, userHasLiked: false };
  await act(async () => { screen = create(createElement(PostCard, { post, liking: false, likeDisabled: false, disabled: false, onLike, onOpenLink: jest.fn() })); });
  const textVisible = (value: string) => screen!.root.findAllByType(AppText).some((node) => node.props.children === value);
  expect(textVisible(post.content)).toBe(false);
  await act(async () => screen!.root.findAllByProps({ accessibilityLabel: 'Leer publicación Publicación de prueba' }).find((node) => node.props.onPress)!.props.onPress());
  expect(textVisible(post.content)).toBe(true);
  expect(textVisible(post.description)).toBe(true);
  await act(async () => screen!.root.findAll((node) => typeof node.props.accessibilityLabel === 'string' && node.props.accessibilityLabel.startsWith('Dar like a') && node.props.onPress)[0].props.onPress());
  expect(onLike).toHaveBeenCalledTimes(1);
});
