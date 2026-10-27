import { router } from 'expo-router';
import { createElement } from 'react';
import { Modal, ScrollView, TextInput } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';

import { AppButton, AppText } from '@/components/ui';
import { LEGAL_DOCUMENTS } from '@/modules/auth/content/legal-documents';
import { CORREO_PRIVACIDAD } from '@/modules/perfil/config/privacidad';
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
  expect(renderedText).toContain('Fecha de aprobación original: 30 de septiembre de 2025.');
  expect(renderedText).toContain('Fecha de última actualización: 26 de octubre de 2026.');
  expect(renderedText).not.toMatch(/borrador|pendiente de (revisión|aprobación)|todavía no.*aprobad/i);
  expect(renderedText).not.toMatch(/\[[A-ZÁÉÍÓÚÑ ]+\]/);
  expect(document.sections).toHaveLength(10);
  expect(document.validationStatus).toBe('pending');
  for (const section of document.sections) {
    expect(visibleText).toContain(section.title);
    for (const block of section.blocks) {
      for (const text of block.kind === 'list' ? block.items : [block.text]) {
        expect(textNodes.some((node) => node.props.children === text && node.props.selectable)).toBe(true);
      }
    }
  }
  const scroll = modal.findByType(ScrollView);
  expect(scroll.props.accessibilityLabel).toBe('Contenido de ' + document.title.toLowerCase());
  expect(modal.findAll((node) => node.props.accessibilityViewIsModal === true).length).toBeGreaterThan(0);
  expect(textNodes.filter((node) => node.props.accessibilityRole === 'header').length).toBeGreaterThanOrEqual(11);
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

function documentText(id: LegalDocumentId) {
  return LEGAL_DOCUMENTS[id].sections.flatMap((section) => [section.title,
    ...section.blocks.flatMap((block) => block.kind === 'list' ? block.items : [block.text])]).join('\n');
}

test('términos incluyen los diez apartados de bienestar solicitados sin ofrecer servicios retirados', () => {
  expect(LEGAL_DOCUMENTS.terms.sections.map((section) => section.title)).toEqual([
    '1. Introducción', '2. Acceso a la aplicación', '3. Seguimiento nutricional',
    '4. Información de bienestar y limitaciones', '5. Plan alimenticio', '6. Uso responsable',
    '7. Disponibilidad', '8. Privacidad', '9. Cambios en los términos', '10. Contacto',
  ]);
  const content = documentText('terms');
  for (const paragraph of [
    'Bienvenido a ConsultorioNutricionalMovil, una aplicación orientada al seguimiento nutricional y al bienestar personal.',
    'La aplicación permite al usuario consultar sus mediciones corporales, observar su progreso a lo largo del tiempo, acceder a información sobre alimentación y visualizar los planes alimenticios disponibles en su cuenta.',
    'Estos términos establecen las condiciones generales para utilizar las funcionalidades disponibles.',
    'Para utilizar las funciones que requieren identificación, el usuario deberá contar con una cuenta autorizada y proporcionar sus credenciales de acceso.',
    'El usuario es responsable de mantener la confidencialidad de su contraseña y de informar cualquier uso no autorizado de su cuenta mediante los canales oficiales.',
    'La aplicación permite visualizar información sobre peso corporal, composición corporal, medidas antropométricas y evolución nutricional.',
    'Las mediciones y comparaciones se presentan con fines de seguimiento e información personal. Su interpretación depende de las características de cada usuario y de las condiciones en que fueron obtenidas.',
    'Los indicadores, gráficas y cálculos disponibles en la aplicación tienen carácter informativo y orientativo.',
    'La aplicación no realiza diagnósticos médicos automáticos y la información mostrada no sustituye una evaluación individual realizada por un profesional de salud.',
    'El usuario no debe utilizar estos indicadores como única base para tomar decisiones médicas o modificar tratamientos.',
    'El usuario podrá consultar los planes alimenticios asociados a su cuenta cuando estén disponibles.',
    'Los planes personalizados no deben compartirse como recomendaciones universales, ya que las necesidades nutricionales pueden variar entre personas.',
    'Ante dudas sobre alimentación o necesidades particulares de salud, se recomienda acudir a un profesional competente.',
    'El usuario deberá proporcionar información correcta cuando corresponda, proteger sus credenciales, respetar la privacidad de otras personas y evitar cualquier actividad que afecte la seguridad o el funcionamiento de la aplicación.',
    'El funcionamiento de la aplicación puede verse afectado temporalmente por mantenimiento, problemas de conexión o incidencias técnicas.',
    'Se procurará comunicar y atender los problemas del servicio mediante los canales oficiales disponibles.',
    'El tratamiento de datos personales se describe en el Aviso de Privacidad disponible en la aplicación.',
    'El usuario podrá consultar ese documento para conocer las finalidades del tratamiento de sus datos, los medios de contacto y los procedimientos disponibles para ejercer sus derechos ARCO.',
    'Estos términos podrán actualizarse para reflejar modificaciones reales en las funcionalidades, la operación del servicio o las disposiciones aplicables.',
    'La versión vigente estará disponible para consulta desde la aplicación.',
    'Para dudas relacionadas con la aplicación o el tratamiento de datos personales, el usuario podrá consultar los medios oficiales de contacto publicados por el responsable del servicio.',
  ]) expect(content).toContain(paragraph);
  expect(content).not.toMatch(/reservaci[oó]n|citas|comprobantes|anticipos|reembolsos|suscripciones|penalizaci[oó]n|historial m[eé]dico/i);
  expect(content).toContain('Correo: ' + CORREO_PRIVACIDAD);
  expect(content).toContain('Mi progreso nutricional es una única pantalla de seguimiento.');
  expect(content).toContain('Cada tarjeta histórica muestra la fecha, el peso en kg, la grasa corporal y la masa muscular en porcentaje y la circunferencia de cintura en cm.');
  expect(content).toContain('No ofrece pestañas de evaluación ni acceso a detalles clínicos.');
});

test('privacidad distingue app, sistema conectado y proveedores sin prometer borrado ni consentimiento al entrar', () => {
  const content = documentText('privacy');
  for (const phrase of ['ConsultorioNutricionalMovil', 'Lic. Rubí Ramos Álvarez',
    'Calle Prof. Juan Mojica Ugalde 11-B', 'backend y la aplicación web administrativa',
    'La aplicación móvil no permite reservar citas clínicas ni cargar comprobantes de pago.',
    'Dejar de mostrar los apartados clínicos no elimina sus datos del servidor.',
    'datos personales sensibles relacionados con la salud', 'información ginecológica',
    'resultados bioquímicos y de laboratorio', 'presión arterial', 'por cuenta del responsable',
    'transferencias a terceros', 'programa de correo', 'Acceso:', 'Rectificación:', 'Cancelación:', 'Oposición:',
    'no confirma el envío, la recepción ni la resolución', 'no eliminan automáticamente toda la información',
    'conservación', 'revocación', 'no representa por sí misma el consentimiento expreso y por escrito']) {
    expect(content).toContain(phrase);
  }
  expect(content).toContain(CORREO_PRIVACIDAD);
  expect(content).toContain('Mi progreso nutricional selecciona únicamente la fecha y las cuatro mediciones indicadas');
  expect(content).toContain('En Inicio: peso e índice de masa corporal orientativo, calculado con la estatura registrada');
  expect(content).not.toContain('algunos se utilizan para limitar las referencias orientativas de IMC');
  expect(content).not.toMatch(/cifrado de extremo a extremo|certificad[oa] ISO|garantizamos.*seguridad|eliminamos todos.*inmediatamente/i);
});
