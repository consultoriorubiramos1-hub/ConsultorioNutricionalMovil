import * as Linking from "expo-linking";
import { createElement, type EffectCallback } from "react";
import { Alert, Modal, Platform, TextInput } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { act, create, type ReactTestRenderer } from "react-test-renderer";

import { AppButton, AppText } from "@/components/ui";
import { perfilFromApi } from "@/modules/perfil/adapters/perfil-adapter";
import { CancelacionDatosModal } from "@/modules/perfil/components/cancelacion-datos-modal";
import { PerfilTabs } from "@/modules/perfil/components/perfil-tabs";
import { CORREO_PRIVACIDAD, obtenerCorreoPrivacidad } from "@/modules/perfil/config/privacidad";
import { actualizarCuentaPerfil, actualizarDatosPerfil, obtenerPerfil } from "@/modules/perfil/services/perfil-service";
import { PerfilView } from "@/modules/perfil/views/perfil-view";
import { clearSessionToken, getSessionToken } from "@/shared/session/session-token";

jest.mock("expo-linking", () => ({ openURL: jest.fn() }));
jest.mock("expo-router", () => ({
  router: { navigate: jest.fn(), replace: jest.fn() },
  useFocusEffect: (effect: EffectCallback) => require("react").useEffect(effect, [effect]),
}));
jest.mock("@/shared/session/session-token", () => ({ getSessionToken: jest.fn(), clearSessionToken: jest.fn() }));
jest.mock("@/modules/perfil/services/perfil-service", () => ({
  obtenerPerfil: jest.fn(), actualizarDatosPerfil: jest.fn(), actualizarCuentaPerfil: jest.fn(),
}));
jest.mock("@/modules/perfil/config/privacidad", () => ({
  ...jest.requireActual("@/modules/perfil/config/privacidad"),
  obtenerCorreoPrivacidad: jest.fn(),
}));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
jest.setTimeout(15000);

const perfil = {
  ...perfilFromApi({
    first_name: "Ana", second_name: "María", first_lastname: "Pérez", second_lastname: "López",
    email: "paciente@example.test", phone: "5512345678", fecha_nacimiento: "2000-02-09",
  }),
  estado: "Activo", expediente: "fixture-sensitive",
};
const opcion = "Solicitar cancelación de datos personales";
let screen: ReactTestRenderer;

beforeEach(() => {
  jest.mocked(getSessionToken).mockResolvedValue("fixture-secret-token");
  jest.mocked(obtenerPerfil).mockResolvedValue(perfil);
  jest.mocked(obtenerCorreoPrivacidad).mockReturnValue(CORREO_PRIVACIDAD);
  jest.mocked(Linking.openURL).mockResolvedValue(true);
  jest.spyOn(Alert, "alert").mockImplementation(() => {});
});

afterEach(async () => {
  await act(async () => screen?.unmount());
  expect(actualizarCuentaPerfil).not.toHaveBeenCalled();
  expect(actualizarDatosPerfil).not.toHaveBeenCalled();
  expect(clearSessionToken).not.toHaveBeenCalled();
  expect(global.fetch).not.toHaveBeenCalled();
  expect(perfil.estado).toBe("Activo");
});

function button(label: string) {
  return screen.root.findAllByType(AppButton).find((node) => node.props.label === label)!;
}
async function press(label: string) {
  const node = button(label);
  expect(node).toBeDefined();
  expect(node.props.disabled).not.toBe(true);
  await act(async () => { await node.props.onPress(); });
}
function input(label: string) {
  return screen.root.findAllByType(TextInput).find((node) => node.props.accessibilityLabel === label)!;
}
function text() {
  return screen.root.findAllByType(AppText).map((node) => node.props.children).join("\n");
}
async function openForm() {
  await renderProfile();
  await act(async () => screen.root.findByType(PerfilTabs).props.onChange("seguridad"));
  await press(opcion);
}
async function renderProfile() {
  await act(async () => {
    screen = create(createElement(SafeAreaProvider, {
      initialMetrics: {
        frame: { x: 0, y: 0, width: 320, height: 568 },
        insets: { top: 20, bottom: 16, left: 0, right: 0 },
      },
    }, createElement(PerfilView)));
  });
}
async function dialogAction(label: string) {
  const calls = jest.mocked(Alert.alert).mock.calls;
  const buttons = calls[calls.length - 1][2]!;
  await act(async () => { buttons.find((item) => item.text === label)!.onPress?.(); });
}

test("solo Seguridad contiene la nueva sección, conserva las tres pestañas y las contraseñas", async () => {
  await renderProfile();
  expect(button(opcion)).toBeUndefined();
  const tabs = screen.root.findByType(PerfilTabs);
  expect(tabs.findAll((node) => node.props.accessibilityRole === "tab" && node.props.onPress)).toHaveLength(3);
  await act(async () => tabs.props.onChange("cuenta"));
  expect(button(opcion)).toBeUndefined();
  await act(async () => tabs.props.onChange("seguridad"));
  expect(text()).toContain("Privacidad y derechos ARCO");
  await act(async () => input("Contraseña actual").props.onChangeText("fixture-password"));
  await press(opcion);
  const form = screen.root.findByType(CancelacionDatosModal);
  expect(form.findByType(Modal).props.visible).toBe(true);
  const fields = form.findAllByType(TextInput);
  expect(fields).toHaveLength(3);
  expect(fields.some((field) => field.props.secureTextEntry)).toBe(false);
  expect(input("Nombre completo del paciente").props).toMatchObject({ value: perfil.nombreCompleto, editable: false });
  expect(input("Correo electrónico").props).toMatchObject({ value: perfil.email, editable: false });
  expect(text()).toContain("Enviar esta solicitud no elimina inmediatamente tu cuenta ni tu expediente nutricional.");
  await press("Cerrar");
  expect(screen.root.findAllByType(CancelacionDatosModal)).toHaveLength(0);
  expect(input("Contraseña actual").props.value).toBe("fixture-password");
  expect(Linking.openURL).not.toHaveBeenCalled();
});

test.each(["android", "ios"] as const)("%s: escribir, confirmar y abrir solo un correo con datos del perfil", async (os) => {
  jest.replaceProperty(Platform, "OS", os);
  await openForm();
  await act(async () => input("Motivo de la solicitud (opcional)").props.onChangeText("Cancelar mis datos de contacto."));
  await press("Solicitar cancelación");
  expect(Alert.alert).toHaveBeenCalledWith(
    "¿Deseas enviar tu solicitud de cancelación?",
    "El consultorio revisará tu solicitud. Tu cuenta permanecerá activa hasta que se determine y aplique la resolución correspondiente.",
    expect.arrayContaining([expect.objectContaining({ text: "Cancelar" }), expect.objectContaining({ text: "Confirmar solicitud" })]),
    expect.objectContaining({ cancelable: true }),
  );
  expect(Linking.openURL).not.toHaveBeenCalled();
  await dialogAction("Confirmar solicitud");
  await dialogAction("Confirmar solicitud");
  expect(Linking.openURL).toHaveBeenCalledTimes(1);
  const uri = jest.mocked(Linking.openURL).mock.calls[0][0];
  expect(uri.startsWith(`mailto:${CORREO_PRIVACIDAD}?`)).toBe(true);
  const body = new URLSearchParams(uri.split("?")[1]).get("body")!;
  expect(body).toContain(perfil.nombreCompleto);
  expect(body).toContain(perfil.email);
  expect(body).toContain("Cancelar mis datos de contacto.");
  for (const sensitive of [perfil.phone, perfil.fechaNacimiento!, perfil.expediente, "fixture-secret-token", "Activo"]) {
    expect(body).not.toContain(sensitive);
  }
  expect(text()).toContain("presiona Enviar para presentar tu solicitud");
  expect(text()).toContain("no confirma su envío ni recepción");
  expect(text()).not.toMatch(/solicitud enviada|folio|recibida correctamente/i);
});

test("Cancelar o descartar la confirmación no abre correo y conserva el motivo", async () => {
  await openForm();
  await act(async () => input("Motivo de la solicitud (opcional)").props.onChangeText("Mi solicitud"));
  await press("Solicitar cancelación");
  await press("Solicitar cancelación");
  expect(Alert.alert).toHaveBeenCalledTimes(1);
  await dialogAction("Cancelar");
  expect(Linking.openURL).not.toHaveBeenCalled();
  expect(input("Motivo de la solicitud (opcional)").props.value).toBe("Mi solicitud");
  await press("Solicitar cancelación");
  await act(async () => jest.mocked(Alert.alert).mock.calls[1][3]!.onDismiss!());
  await dialogAction("Confirmar solicitud");
  expect(Linking.openURL).not.toHaveBeenCalled();
});

test("sin correo del paciente permite motivo vacío y alcance legal general", async () => {
  jest.mocked(obtenerPerfil).mockResolvedValueOnce({ ...perfil, email: "" });
  await openForm();
  expect(input("Correo electrónico").props).toMatchObject({ value: "", editable: false });
  await press("Solicitar cancelación");
  await dialogAction("Confirmar solicitud");
  const body = decodeURIComponent(jest.mocked(Linking.openURL).mock.calls[0][0]);
  expect(body).toContain("No disponible en la cuenta.");
  expect(body).toContain("todos los datos personales que legalmente proceda cancelar");
});

test("sin correo oficial muestra la configuración faltante y deshabilita la solicitud", async () => {
  jest.mocked(obtenerCorreoPrivacidad).mockReturnValue(null);
  await openForm();
  expect(button("Solicitar cancelación").props.disabled).toBe(true);
  expect(text()).toContain("Falta configurar el correo oficial de privacidad");
  expect(Alert.alert).not.toHaveBeenCalled();
  expect(Linking.openURL).not.toHaveBeenCalled();
});

test("sin nombre completo no sustituye la identidad con el usuario de la cuenta", async () => {
  jest.mocked(obtenerPerfil).mockResolvedValueOnce({ ...perfil, nombreCompleto: "", username: "fixture-user" });
  await openForm();
  expect(button("Solicitar cancelación").props.disabled).toBe(true);
  expect(input("Nombre completo del paciente").props.value).toBe("");
  expect(text()).toContain("nombre completo no está disponible");
  expect(Linking.openURL).not.toHaveBeenCalled();
});

test("un error al abrir correo muestra instrucciones y permite reintentar sin éxito falso", async () => {
  jest.mocked(Linking.openURL).mockRejectedValueOnce(new Error("No mail app: fixture-secret"));
  await openForm();
  await press("Solicitar cancelación");
  await dialogAction("Confirmar solicitud");
  expect(text()).toContain("No fue posible abrir la aplicación de correo");
  expect(text()).toContain(CORREO_PRIVACIDAD);
  expect(text()).not.toContain("fixture-secret");
  expect(text()).not.toContain("Se abrió la aplicación");
  expect(button("Solicitar cancelación").props.disabled).toBe(false);
  await press("Solicitar cancelación");
  await dialogAction("Confirmar solicitud");
  expect(Linking.openURL).toHaveBeenCalledTimes(2);
  expect(text()).not.toContain("No fue posible abrir");
});

test("bloquea aperturas repetidas mientras el sistema abre el correo", async () => {
  let resolve!: (value: true) => void;
  jest.mocked(Linking.openURL).mockImplementationOnce(() => new Promise((done) => { resolve = done; }));
  await openForm();
  await press("Solicitar cancelación");
  await dialogAction("Confirmar solicitud");
  expect(button("Abriendo correo...").props.disabled).toBe(true);
  expect(button("Cerrar").props.disabled).toBe(true);
  expect(input("Motivo de la solicitud (opcional)").props.editable).toBe(false);
  await dialogAction("Confirmar solicitud");
  expect(Linking.openURL).toHaveBeenCalledTimes(1);
  await act(async () => resolve(true));
  expect(button("Solicitar cancelación").props.disabled).toBe(false);
});

test("cerrar o Atrás descarta el motivo y una confirmación anterior no envía información", async () => {
  await openForm();
  await act(async () => input("Motivo de la solicitud (opcional)").props.onChangeText("Motivo privado"));
  await press("Solicitar cancelación");
  await act(async () => screen.root.findByType(CancelacionDatosModal).findByType(Modal).props.onRequestClose());
  await dialogAction("Confirmar solicitud");
  expect(Linking.openURL).not.toHaveBeenCalled();
  await press(opcion);
  expect(input("Motivo de la solicitud (opcional)").props.value).toBe("");
  const close = screen.root.findAllByProps({ accessibilityLabel: "Cerrar solicitud de cancelación" }).find((node) => node.props.onPress)!;
  await act(async () => close.props.onPress());
  expect(screen.root.findAllByType(CancelacionDatosModal)).toHaveLength(0);
});
