import { router } from 'expo-router';
import { createElement } from 'react';
import { Modal, ScrollView, TextInput } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';

import { AppButton, AppText } from '@/components/ui';
import { LEGAL_DOCUMENTS } from '@/modules/auth/content/legal-documents';
import type { LegalDocumentId } from '@/modules/auth/models/legal-document.model';
import { saveToken } from '@/modules/auth/services/auth-storage.service';
import { LoginView } from '@/modules/auth/views/login-view';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn() } }));
jest.mock('@/modules/auth/services/auth-storage.service', () => ({ saveToken: jest.fn().mockResolvedValue(undefined) }));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

let screen: ReactTestRenderer;
const documentIds: LegalDocumentId[] = ['privacy', 'terms'];

beforeEach(async () => {
  await act(async () => {
    screen = create(createElement(SafeAreaProvider, {
      initialMetrics: {
        frame: { x: 0, y: 0, width: 320, height: 568 },
        insets: { top: 20, bottom: 16, left: 0, right: 0 },
      },
    }, createElement(LoginView)));
  });
});
afterEach(async () => { await act(async () => screen.unmount()); });

async function pressLink(label: string) {
  const link = screen.root.findAllByProps({ accessibilityLabel: label }).find((node) => node.props.onPress)!;
  await act(async () => { link.props.onPress(); });
}

async function pressButton(label: string) {
  const button = screen.root.findAllByType(AppButton).find((node) => node.props.label === label)!;
  await act(async () => { await button.props.onPress(); });
}

function input(label: string) {
  return screen.root.findAllByType(TextInput).find((node) => node.props.accessibilityLabel === label)!;
}

test.each(documentIds)('%s abre sin autenticación y muestra todos los apartados, párrafos y listas', async (id) => {
  const document = LEGAL_DOCUMENTS[id];
  expect(screen.root.findAllByType(Modal)).toHaveLength(0);
  await pressLink(document.title);
  const modal = screen.root.findByType(Modal);
  expect(modal.props.visible).toBe(true);
  const textNodes = modal.findAllByType(AppText);
  const visibleText = textNodes.map((node) => node.props.children);
  expect(visibleText).toContain(document.subtitle);
  const renderedText = visibleText.map((text) => Array.isArray(text) ? text.join('') : text).join('\n');
  expect(renderedText).toContain('Fecha de aprobación: 30 de septiembre de 2025.');
  expect(renderedText).toContain('Fecha de última actualización: 22 de octubre de 2026.');
  expect(renderedText).not.toMatch(/borrador|pendiente de (revisión|aprobación)|todavía no.*aprobad/i);
  expect(renderedText).not.toMatch(/\[[A-ZÁÉÍÓÚÑ ]+\]/);
  expect(document.sections).toHaveLength(id === 'privacy' ? 10 : 13);
  for (const section of document.sections) {
    expect(visibleText).toContain(section.title);
    for (const block of section.blocks) {
      for (const text of block.kind === 'list' ? block.items : [block.text]) {
        expect(textNodes.some((node) => node.props.children === text && node.props.selectable)).toBe(true);
      }
    }
  }
  const scroll = modal.findByType(ScrollView);
  expect(scroll.props.horizontal).not.toBe(true);
  expect(scroll.props.scrollEnabled).not.toBe(false);
  expect(textNodes.every((node) => node.props.numberOfLines === undefined)).toBe(true);
  expect(modal.findByType(AppButton).props.label).toBe('Entendido');
  expect(global.fetch).not.toHaveBeenCalled();
  expect(saveToken).not.toHaveBeenCalled();
  expect(router.push).not.toHaveBeenCalled();
  expect(router.replace).not.toHaveBeenCalled();
});

test.each(documentIds)('%s se cierra con X, Entendido y Atrás y puede abrirse nuevamente', async (id) => {
  const document = LEGAL_DOCUMENTS[id];
  await pressLink(document.title);
  await pressLink('Cerrar ' + document.title.toLowerCase());
  expect(screen.root.findAllByType(Modal)).toHaveLength(0);

  await pressLink(document.title);
  await pressButton('Entendido');
  expect(screen.root.findAllByType(Modal)).toHaveLength(0);

  await pressLink(document.title);
  await act(async () => { screen.root.findByType(Modal).props.onRequestClose(); });
  expect(screen.root.findAllByType(Modal)).toHaveLength(0);
});

test('consultar ambos documentos conserva las credenciales y permite el login original', async () => {
  await act(async () => {
    input('Correo electrónico o usuario').props.onChangeText(' paciente-prueba ');
    input('Contraseña').props.onChangeText('fixture-password');
  });
  for (const id of documentIds) {
    await pressLink(LEGAL_DOCUMENTS[id].title);
    await pressButton('Entendido');
    expect(input('Correo electrónico o usuario').props.value).toBe(' paciente-prueba ');
    expect(input('Contraseña').props.value).toBe('fixture-password');
  }
  const user = { id: 'fixture-user', username: 'paciente-prueba', email: 'test@example.test', rol_id: 2 };
  (global.fetch as jest.Mock).mockResolvedValueOnce({ status: 200, json: async () => ({ ok: true, data: { token: 'fixture-token', user } }) });
  await pressButton('Iniciar sesión');
  expect(global.fetch).toHaveBeenCalledWith('https://api.example.test/api/mobile/auth/login', expect.objectContaining({
    method: 'POST', body: JSON.stringify({ username: 'paciente-prueba', password: 'fixture-password' }),
  }));
  expect(saveToken).toHaveBeenCalledWith('fixture-token');
  expect(router.replace).toHaveBeenCalledWith('/inicio');
});

test('los documentos no borran errores del login y la recuperación conserva su ruta', async () => {
  await pressButton('Iniciar sesión');
  await pressLink(LEGAL_DOCUMENTS.privacy.title);
  await pressButton('Entendido');
  expect(screen.root.findAllByType(AppText).some((node) => node.props.children === 'Ingresa tu usuario.')).toBe(true);
  const recovery = screen.root.findAll((node) => node.props.accessibilityRole === 'link' && node.props.onPress &&
    node.findAllByType(AppText).some((text) => text.props.children === '¿Olvidaste tu contraseña?'))[0];
  await act(async () => { recovery.props.onPress(); });
  expect(router.push).toHaveBeenCalledWith('/recuperar-contrasena');
  expect(global.fetch).not.toHaveBeenCalled();
});
