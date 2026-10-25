import * as Linking from "expo-linking";
import { createElement, type EffectCallback } from "react";
import { Alert, Modal, Platform, ScrollView, TextInput } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { act, create, type ReactTestRenderer } from "react-test-renderer";

import { AppButton, AppText } from "@/components/ui";
import { perfilFromApi } from "@/modules/perfil/adapters/perfil-adapter";
import { CancelacionDatosModal } from "@/modules/perfil/components/cancelacion-datos-modal";
import { OposicionDatosModal } from "@/modules/perfil/components/oposicion-datos-modal";
import { PerfilTabs } from "@/modules/perfil/components/perfil-tabs";
import { PrivacidadArco } from "@/modules/perfil/components/privacidad-arco";
import { CORREO_PRIVACIDAD, obtenerCorreoPrivacidad } from "@/modules/perfil/config/privacidad";
import { OPOSICION_MAX_LENGTH } from "@/modules/perfil/models/oposicion.model";
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

// Fixtures exclusivamente de pruebas. El perfil se congela para detectar mutaciones.
const perfil = Object.freeze({
  ...perfilFromApi({
    first_name: "Ana", second_name: "María", first_lastname: "Pérez", second_lastname: "López",
    email: "paciente@example.test", phone: "5512345678", fecha_nacimiento: "2000-02-09",
  }),
  estado: "Activo", expediente: "fixture-sensitive", id: "fixture-internal-id",
});
const opcion = "Solicitar oposición al tratamiento de datos";
const opcionCancelacion = "Solicitar cancelación de datos personales";
const campoTratamiento = "¿A qué uso de tus datos deseas oponerte?";
const campoMotivo = "Motivo de la oposición";
let screen: ReactTestRenderer | undefined;

beforeEach(() => {
  jest.mocked(getSessionToken).mockResolvedValue("fixture-secret-token");
  jest.mocked(obtenerPerfil).mockResolvedValue(perfil);
  jest.mocked(obtenerCorreoPrivacidad).mockReturnValue(CORREO_PRIVACIDAD);
  jest.mocked(Linking.openURL).mockResolvedValue(true);
  jest.spyOn(Alert, "alert").mockImplementation(() => {});
});

afterEach(async () => {
  await act(async () => screen?.unmount());
  screen = undefined;
  expect(actualizarCuentaPerfil).not.toHaveBeenCalled();
  expect(actualizarDatosPerfil).not.toHaveBeenCalled();
  expect(clearSessionToken).not.toHaveBeenCalled();
  expect(global.fetch).not.toHaveBeenCalled();
  expect(perfil.estado).toBe("Activo");
});

function button(label: string) {
  return screen!.root.findAllByType(AppButton).find((node) => node.props.label === label)!;
}
async function press(label: string) {
  const node = button(label);
  expect(node).toBeDefined();
  expect(node.props.disabled).not.toBe(true);
  await act(async () => { await node.props.onPress(); });
}
function input(label: string) {
  return screen!.root.findAllByType(TextInput).find((node) => node.props.accessibilityLabel === label)!;
}
function text() {
  return screen!.root.findAllByType(AppText).map((node) => node.props.children).join("\n");
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
async function openForm() {
  await renderProfile();
  await act(async () => screen!.root.findByType(PerfilTabs).props.onChange("seguridad"));
  await press(opcion);
}
async function fill(tratamiento = "Uso de mis datos de contacto", motivo = "Deseo limitar ese tratamiento") {
  await act(async () => {
    input(campoTratamiento).props.onChangeText(tratamiento);
    input(campoMotivo).props.onChangeText(motivo);
  });
}
function dialog() {
  const calls = jest.mocked(Alert.alert).mock.calls;
  return calls[calls.length - 1];
}
async function dialogAction(label: string) {
  await act(async () => { dialog()[2]!.find((item) => item.text === label)!.onPress?.(); });
}
function correo() {
  const uri = jest.mocked(Linking.openURL).mock.calls[0][0];
  return { uri, query: new URLSearchParams(uri.split("?")[1]) };
}

test("las opciones aparecen solo en Seguridad, en orden, y ambos formularios son independientes", async () => {
  await renderProfile();
  const tabs = screen!.root.findByType(PerfilTabs);
  expect(button(opcion)).toBeUndefined();
  expect(tabs.findAll((node) => node.props.accessibilityRole === "tab" && node.props.onPress)).toHaveLength(3);
  await act(async () => tabs.props.onChange("cuenta"));
  expect(button(opcion)).toBeUndefined();
  await act(async () => tabs.props.onChange("seguridad"));
  const buttons = screen!.root.findByType(PrivacidadArco).findAllByType(AppButton);
  expect(buttons.map((node) => node.props.label)).toEqual([opcionCancelacion, opcion]);
  expect(buttons.every((node) => node.props.variant === "secondary")).toBe(true);
  await act(async () => input("Contraseña actual").props.onChangeText("fixture-password"));

  await press(opcionCancelacion);
  expect(screen!.root.findAllByType(OposicionDatosModal)).toHaveLength(0);
  expect(screen!.root.findByType(CancelacionDatosModal).findAllByType(TextInput)).toHaveLength(3);
  await press("Solicitar cancelación");
  expect(dialog()[0]).toBe("¿Deseas enviar tu solicitud de cancelación?");
  await dialogAction("Cancelar");
  await press("Cerrar");

  await press(opcion);
  expect(screen!.root.findAllByType(CancelacionDatosModal)).toHaveLength(0);
  await fill();
  await press("Solicitar oposición");
  await dialogAction("Cancelar");
  await press("Cerrar");
  await press(opcionCancelacion);
  expect(input("Motivo de la solicitud (opcional)").props.value).toBe("");
  await press("Solicitar cancelación");
  await dialogAction("Confirmar solicitud");
  expect(correo().query.get("subject")).toBe("Solicitud de derecho ARCO - Cancelación");
  expect(correo().query.get("body")).not.toContain("Uso de mis datos de contacto");
  await press("Cerrar");
  expect(input("Contraseña actual").props.value).toBe("fixture-password");
});

test.each(["android", "ios"] as const)("%s: precarga, edición, confirmación y correo solo con datos permitidos", async (os) => {
  jest.replaceProperty(Platform, "OS", os);
  await openForm();
  const form = screen!.root.findByType(OposicionDatosModal);
  expect(form.findByType(Modal).props).toMatchObject({ visible: true, presentationStyle: "fullScreen" });
  expect(form.findAllByType(TextInput)).toHaveLength(4);
  expect(form.findByType(ScrollView).props.keyboardShouldPersistTaps).toBe("handled");
  expect(input("Nombre completo del paciente").props).toMatchObject({ value: perfil.nombreCompleto, editable: false });
  expect(input("Correo electrónico").props).toMatchObject({ value: perfil.email, editable: false });
  expect(input(campoTratamiento).props).toMatchObject({ multiline: true, maxLength: OPOSICION_MAX_LENGTH });
  expect(input(campoMotivo).props).toMatchObject({ multiline: true, maxLength: OPOSICION_MAX_LENGTH });
  expect(form.findAllByType(TextInput).some((field) => field.props.secureTextEntry)).toBe(false);
  expect(text()).toContain("Solicitud de oposición al tratamiento de datos personales");
  expect(text()).toContain("Presentar esta solicitud no elimina tus datos personales ni desactiva tu cuenta automáticamente.");
  expect(text()).not.toMatch(/publicidad|promociones/i);
  await fill("Tratamiento específico & contacto\nÁmbito: dirección", "Motivo personal + revisión #1 &bcc=otro@example.test");
  await press("Solicitar oposición");
  expect(Alert.alert).toHaveBeenCalledWith(
    "¿Deseas presentar tu solicitud de oposición?",
    "El consultorio revisará tu solicitud y te informará la resolución correspondiente. Tu cuenta y tus datos no serán modificados automáticamente.",
    expect.arrayContaining([expect.objectContaining({ text: "Cancelar" }), expect.objectContaining({ text: "Confirmar solicitud" })]),
    expect.objectContaining({ cancelable: true }),
  );
  expect(Linking.openURL).not.toHaveBeenCalled();
  await dialogAction("Confirmar solicitud");
  expect(Linking.openURL).toHaveBeenCalledTimes(1);
  const { uri, query } = correo();
  expect(uri.startsWith(`mailto:${CORREO_PRIVACIDAD}?`)).toBe(true);
  expect([...query.keys()]).toEqual(["subject", "body"]);
  expect(query.get("subject")).toBe("Solicitud de derecho ARCO - Oposición");
  const body = query.get("body")!;
  expect(body).toContain(`Nombre: ${perfil.nombreCompleto}`);
  expect(body).toContain(`Correo de contacto: ${perfil.email}`);
  expect(body).toContain("Tratamiento específico & contacto\nÁmbito: dirección");
  expect(body).toContain("Motivo personal + revisión #1 &bcc=otro@example.test");
  for (const sensitive of [perfil.phone, perfil.fechaNacimiento!, perfil.expediente, perfil.id, "fixture-password", "fixture-secret-token", "Activo"]) {
    expect(body).not.toContain(sensitive);
  }
  expect(text()).toContain("Debes presionar Enviar");
  expect(text()).toContain("no confirma su envío ni recepción");
  expect(text()).not.toMatch(/solicitud enviada|recibida correctamente|folio|aceptada automáticamente/i);
});

test.each(["", " \n\t "])("ambos campos son obligatorios: rechaza %j sin confirmar ni abrir correo", async (empty) => {
  await openForm();
  await fill(empty, empty);
  await press("Solicitar oposición");
  expect(text()).toContain("Indica a qué uso de tus datos deseas oponerte.");
  await fill("Uso específico", empty);
  await press("Solicitar oposición");
  expect(text()).toContain("Explica el motivo de tu oposición.");
  expect(Alert.alert).not.toHaveBeenCalled();
  expect(Linking.openURL).not.toHaveBeenCalled();
});

test.each([campoTratamiento, campoMotivo])("%s no admite superar el límite incluso omitiendo la restricción nativa", async (field) => {
  await openForm();
  await fill();
  await act(async () => input(field).props.onChangeText("a".repeat(OPOSICION_MAX_LENGTH + 1)));
  await press("Solicitar oposición");
  expect(text()).toContain(`como máximo ${OPOSICION_MAX_LENGTH} caracteres`);
  expect(Alert.alert).not.toHaveBeenCalled();
  expect(Linking.openURL).not.toHaveBeenCalled();
});

test("Cancelar y descartar la confirmación conservan los campos sin abrir correo", async () => {
  await openForm();
  await fill();
  await press("Solicitar oposición");
  await press("Solicitar oposición");
  expect(Alert.alert).toHaveBeenCalledTimes(1);
  await dialogAction("Cancelar");
  expect(input(campoTratamiento).props.value).toBe("Uso de mis datos de contacto");
  expect(input(campoMotivo).props.value).toBe("Deseo limitar ese tratamiento");
  await press("Solicitar oposición");
  await act(async () => dialog()[3]!.onDismiss!());
  await dialogAction("Confirmar solicitud");
  expect(Linking.openURL).not.toHaveBeenCalled();
});

test("el mensaje usa los valores validados al abrir la confirmación y bloquea callbacks duplicados", async () => {
  await openForm();
  await fill("  Tratamiento original  ", "  Motivo original  ");
  await press("Solicitar oposición");
  await fill("Edición posterior", "Otro motivo");
  await dialogAction("Confirmar solicitud");
  await dialogAction("Confirmar solicitud");
  expect(Linking.openURL).toHaveBeenCalledTimes(1);
  expect(correo().query.get("body")).toContain("Tratamiento o finalidad a la que me opongo: Tratamiento original\n\nMotivo de la oposición: Motivo original");
  expect(correo().query.get("body")).not.toContain("Edición posterior");
});

test("fallo al abrir correo permite reintentar sin mostrar envío o recepción falsos", async () => {
  jest.mocked(Linking.openURL).mockRejectedValueOnce(new Error("No mail app: fixture-secret"));
  await openForm();
  await fill();
  await press("Solicitar oposición");
  await dialogAction("Confirmar solicitud");
  expect(text()).toContain("No fue posible abrir la aplicación de correo");
  expect(text()).toContain(CORREO_PRIVACIDAD);
  expect(text()).not.toMatch(/fixture-secret|Se abrió la aplicación|solicitud enviada|folio/i);
  expect(input(campoMotivo).props.value).toBe("Deseo limitar ese tratamiento");
  await press("Solicitar oposición");
  await dialogAction("Confirmar solicitud");
  expect(Linking.openURL).toHaveBeenCalledTimes(2);
  expect(text()).not.toContain("No fue posible abrir");
});

test("sin correo oficial bloquea la preparación y explica la configuración faltante", async () => {
  jest.mocked(obtenerCorreoPrivacidad).mockReturnValue(null);
  await openForm();
  await fill();
  expect(button("Solicitar oposición").props.disabled).toBe(true);
  expect(text()).toContain("Falta configurar el correo oficial de privacidad");
  expect(Alert.alert).not.toHaveBeenCalled();
  expect(Linking.openURL).not.toHaveBeenCalled();
});

test("sin nombre completo bloquea la solicitud sin sustituirlo por el usuario", async () => {
  jest.mocked(obtenerPerfil).mockResolvedValueOnce({ ...perfil, nombreCompleto: "", username: "fixture-user" });
  await openForm();
  expect(button("Solicitar oposición").props.disabled).toBe(true);
  expect(input("Nombre completo del paciente").props.value).toBe("");
  expect(text()).toContain("nombre completo no está disponible");
  expect(Linking.openURL).not.toHaveBeenCalled();
});

test("sin correo del paciente permite la solicitud y no inventa una dirección", async () => {
  jest.mocked(obtenerPerfil).mockResolvedValueOnce({ ...perfil, email: "" });
  await openForm();
  expect(input("Correo electrónico").props).toMatchObject({ value: "", editable: false });
  await fill();
  await press("Solicitar oposición");
  await dialogAction("Confirmar solicitud");
  expect(correo().query.get("body")).toContain("Correo de contacto: No disponible en la cuenta.");
  expect(correo().query.get("body")).not.toContain(perfil.email);
});

test.each(["Cerrar", "X", "Atrás"])("%s descarta el formulario e invalida confirmaciones anteriores", async (method) => {
  await openForm();
  await fill();
  await press("Solicitar oposición");
  if (method === "Cerrar") await press("Cerrar");
  else await act(async () => {
    if (method === "Atrás") screen!.root.findByType(OposicionDatosModal).findByType(Modal).props.onRequestClose();
    else screen!.root.findAllByProps({ accessibilityLabel: "Cerrar solicitud de oposición" }).find((node) => node.props.onPress)!.props.onPress();
  });
  await dialogAction("Confirmar solicitud");
  expect(Linking.openURL).not.toHaveBeenCalled();
  expect(screen!.root.findAllByType(OposicionDatosModal)).toHaveLength(0);
  await press(opcion);
  expect(input(campoTratamiento).props.value).toBe("");
  expect(input(campoMotivo).props.value).toBe("");
});

test("durante la apertura bloquea doble pulsación, edición y cierre hasta resolver", async () => {
  let resolve!: (value: true) => void;
  jest.mocked(Linking.openURL).mockImplementationOnce(() => new Promise((done) => { resolve = done; }));
  await openForm();
  await fill();
  await press("Solicitar oposición");
  await dialogAction("Confirmar solicitud");
  expect(button("Abriendo correo...").props.disabled).toBe(true);
  expect(button("Cerrar").props.disabled).toBe(true);
  expect(input(campoTratamiento).props.editable).toBe(false);
  expect(input(campoMotivo).props.editable).toBe(false);
  await dialogAction("Confirmar solicitud");
  await act(async () => screen!.root.findByType(OposicionDatosModal).findByType(Modal).props.onRequestClose());
  expect(screen!.root.findAllByType(OposicionDatosModal)).toHaveLength(1);
  expect(Linking.openURL).toHaveBeenCalledTimes(1);
  await act(async () => resolve(true));
  expect(button("Solicitar oposición").props.disabled).toBe(false);
});
