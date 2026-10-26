import { createElement, type EffectCallback } from "react";
import { Modal, ScrollView } from "react-native";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { router } from "expo-router";

import { AppButton, AppText } from "@/components/ui";
import { AppointmentDatePicker } from "@/modules/citas/components/appointment-date-picker";
import { AppointmentForm } from "@/modules/citas/components/appointment-form";
import { BankTransferCard } from "@/modules/citas/components/bank-transfer-card";
import { BANK_TRANSFER_DETAILS } from "@/modules/citas/config/bank-transfer";
import { createAppointment, getAppointments, getAvailability } from "@/modules/citas/services/citas-service";
import { selectReceipt } from "@/modules/citas/services/receipt-service";
import { CitasView } from "@/modules/citas/views/citas-view";
import { DashboardMenu } from "@/modules/dashboard/components/dashboard-menu";
import { perfilFromApi } from "@/modules/perfil/adapters/perfil-adapter";
import { obtenerPerfil } from "@/modules/perfil/services/perfil-service";
import { PerfilView } from "@/modules/perfil/views/perfil-view";
import { clearSessionToken, getSessionToken } from "@/shared/session/session-token";

jest.mock("expo-router", () => ({
  router: { navigate: jest.fn(), replace: jest.fn(), back: jest.fn() },
  useFocusEffect: (effect: EffectCallback) => require("react").useEffect(effect, [effect]),
}));
jest.mock("@/shared/session/session-token", () => ({
  getSessionToken: jest.fn(), clearSessionToken: jest.fn(),
}));
jest.mock("@/modules/perfil/services/perfil-service", () => ({
  obtenerPerfil: jest.fn(), actualizarDatosPerfil: jest.fn(), actualizarCuentaPerfil: jest.fn(),
}));
jest.mock("@/modules/citas/services/citas-service", () => ({
  ...jest.requireActual("@/modules/citas/services/citas-service"),
  getAppointments: jest.fn(), getAvailability: jest.fn(), createAppointment: jest.fn(),
}));
jest.mock("@/modules/citas/services/receipt-service", () => ({ selectReceipt: jest.fn() }));

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
// La primera renderización compila los componentes nativos del preset de Expo.
jest.setTimeout(15000);
const receipt = { uri: "file:///fixture.png", name: "fixture.png", type: "image/png" as const, size: 1024 };
let screen: ReactTestRenderer | undefined;

beforeEach(() => {
  jest.mocked(getSessionToken).mockResolvedValue("session-fixture");
  jest.mocked(clearSessionToken).mockResolvedValue(undefined);
  jest.mocked(obtenerPerfil).mockResolvedValue(perfilFromApi({ username: "ana", first_name: "Ana", first_lastname: "Pérez" }));
  jest.mocked(getAppointments).mockResolvedValue([]);
  jest.mocked(getAvailability).mockResolvedValue(["13:30:00"]);
  jest.mocked(selectReceipt).mockResolvedValue(receipt);
  jest.mocked(createAppointment).mockResolvedValue({ appointmentId: 7, paymentReference: null, depositAmount: null, message: "Cita solicitada" });
});

afterEach(async () => {
  await act(async () => screen?.unmount());
  screen = undefined;
  jest.useRealTimers();
});

async function openProfileMenu() {
  await act(async () => { screen = create(createElement(PerfilView)); });
  await act(async () => {
    screen!.root.findAllByProps({ accessibilityLabel: "Abrir menú de navegación" })[0].props.onPress();
  });
}

describe("Perfil: menú compartido", () => {
  test.each(["botón de cierre", "fondo", "botón Atrás de Android"])("abrir y cerrar por %s conserva Perfil", async (method) => {
    await openProfileMenu();
    const menu = screen!.root.findByType(DashboardMenu);
    expect(menu.props).toMatchObject({ activeRoute: "/perfil", visible: true });
    await act(async () => {
      if (method === "botón Atrás de Android") menu.findByType(Modal).props.onRequestClose();
      else menu.findAllByProps({ accessibilityLabel: "Cerrar menú" })
        .filter((node) => typeof node.props.onPress === "function")[method === "fondo" ? 0 : 1].props.onPress();
    });
    expect(screen!.root.findByType(DashboardMenu).props.visible).toBe(false);
    expect(router.navigate).not.toHaveBeenCalled();
    expect(router.replace).not.toHaveBeenCalled();
    expect(router.back).not.toHaveBeenCalled();
    expect(obtenerPerfil).toHaveBeenCalledTimes(1);
  });

  test.each([
    ["Inicio", "/inicio"], ["Muro", "/muro"], ["Citas", "/citas"],
    ["Historial médico", "/historial"], ["Plan alimenticio", "/plan-alimenticio"], ["Mi perfil", "/perfil"],
  ])("seleccionar %s cierra el menú y navega cuando corresponde", async (label, route) => {
    await openProfileMenu();
    const item = screen!.root.findByType(DashboardMenu).findAll((node) =>
      node.props.accessibilityRole === "button" && node.props.onPress &&
      node.findAllByType(AppText).some((text) => text.props.children === label));
    expect(item.length).toBeGreaterThan(0);
    await act(async () => item[0].props.onPress());
    expect(screen!.root.findByType(DashboardMenu).props.visible).toBe(false);
    if (route === "/perfil") expect(router.navigate).not.toHaveBeenCalled();
    else expect(router.navigate).toHaveBeenCalledWith(route);
  });

  test("cerrar sesión limpia el token y va a Login", async () => {
    await openProfileMenu();
    await act(async () => screen!.root.findByType(DashboardMenu).findByType(AppButton).props.onPress());
    expect(clearSessionToken).toHaveBeenCalledTimes(1);
    expect(router.replace).toHaveBeenCalledWith("/login");
  });

  test("un error al cerrar sesión conserva Perfil y muestra el error", async () => {
    jest.mocked(clearSessionToken).mockRejectedValueOnce(new Error("storage-fixture"));
    await openProfileMenu();
    await act(async () => { await screen!.root.findByType(DashboardMenu).props.onLogout(); });
    expect(router.replace).not.toHaveBeenCalled();
    expect(screen!.root.findByType(DashboardMenu).props.visible).toBe(false);
    expect(screen!.root.findAllByType(AppText).some((node) => node.props.children === "No fue posible cerrar la sesión. Inténtalo nuevamente.")).toBe(true);
  });
});

describe("Citas: transferencia y comprobante", () => {
  test("muestra la tarjeta antes del comprobante y conserva fecha/hora al adjuntarlo y solicitar", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-10-07T18:00:00Z"));
    await act(async () => { screen = create(createElement(CitasView)); });
    const tab = screen!.root.findAll((node) => node.props.accessibilityRole === "tab" && node.props.onPress)
      .find((node) => node.findAllByType(AppText).some((text) => text.props.children === "Agendar cita"));
    await act(async () => tab!.props.onPress());
    expect(screen!.root.findAllByType(BankTransferCard)).toHaveLength(0);
    await act(async () => screen!.root.findByType(AppointmentDatePicker).props.onChange("2026-10-08"));
    expect(screen!.root.findAllByType(BankTransferCard)).toHaveLength(0);
    await act(async () => screen!.root.findAllByProps({ accessibilityLabel: "Horario 13:30" })[0].props.onPress());
    const form = screen!.root.findByType(AppointmentForm);
    const card = form.findByType(BankTransferCard);
    expect(card.props.details).toBe(BANK_TRANSFER_DETAILS);
    expect(card.findAllByType(AppText).filter((node) => node.props.children === "Pendiente de configurar")).toHaveLength(4);
    expect(card.findAllByType(AppText).some((node) => node.props.children === "Monto de la consulta")).toBe(false);
    const orderedText = form.findAllByType(AppText).map((node) => node.props.children);
    expect(orderedText.indexOf("Datos para transferencia bancaria")).toBeLessThan(orderedText.indexOf("4. Comprobante del anticipo"));
    expect(screen!.root.findAllByType(ScrollView).some((node) => node.findAllByType(AppointmentForm).length > 0 && node.props.horizontal !== true)).toBe(true);
    const button = (label: string) => form.findAllByType(AppButton).find((node) => node.props.label === label)!;
    expect(button("Solicitar cita").props.disabled).toBe(true);
    await act(async () => { await button("Seleccionar comprobante").props.onPress(); });
    expect(selectReceipt).toHaveBeenCalledTimes(1);
    expect(screen!.root.findByType(AppointmentForm).props.vm).toMatchObject({ selectedDate: "2026-10-08", selectedTime: "13:30:00", receipt });
    expect(button("Solicitar cita").props.disabled).toBe(false);
    await act(async () => { await button("Solicitar cita").props.onPress(); });
    expect(createAppointment).toHaveBeenCalledWith("session-fixture", { appointmentDate: "2026-10-08", startTime: "13:30:00", notes: "", receipt });
  });

  test("presenta el importe configurado y omite la cuenta opcional", async () => {
    await act(async () => { screen = create(createElement(BankTransferCard, { details: {
      bankName: "Banco de ejemplo (prueba)", accountHolder: "Titular de ejemplo (prueba)", accountNumber: null,
      clabe: "CLABE de ejemplo (prueba)", consultationAmount: 450,
    } })); });
    const texts = screen!.root.findAllByType(AppText).map((node) => node.props.children);
    expect(texts).toContain("Monto de la consulta");
    expect(texts).not.toContain("Número de cuenta");
    expect(texts).not.toContain("Pendiente de configurar");
    expect(texts.some((value) => Array.isArray(value) && value.join("").includes("450.00 MXN"))).toBe(true);
  });
});
