import * as Linking from "expo-linking";

import { cancelacionFromPerfil, cancelacionToMailto } from "@/modules/perfil/adapters/cancelacion-adapter";
import { perfilFromApi } from "@/modules/perfil/adapters/perfil-adapter";
import { CORREO_PRIVACIDAD, obtenerCorreoPrivacidad } from "@/modules/perfil/config/privacidad";
import { abrirCorreoCancelacion } from "@/modules/perfil/services/cancelacion-service";

jest.mock("expo-linking", () => ({ openURL: jest.fn() }));
jest.mock("@/modules/perfil/config/privacidad", () => ({
  ...jest.requireActual("@/modules/perfil/config/privacidad"),
  obtenerCorreoPrivacidad: jest.fn(),
}));

const perfil = perfilFromApi({
  first_name: "Ana", second_name: "María", first_lastname: "Pérez", second_lastname: "López",
  email: "paciente@example.test", phone: "5512345678", fecha_nacimiento: "2000-02-09",
});

beforeEach(() => {
  jest.mocked(obtenerCorreoPrivacidad).mockReturnValue(CORREO_PRIVACIDAD);
  jest.mocked(Linking.openURL).mockResolvedValue(true);
});

test("reutiliza el correo ARCO existente en el aviso de privacidad", () => {
  const { LEGAL_DOCUMENTS } = jest.requireActual("@/modules/auth/content/legal-documents");
  const config = jest.requireActual("@/modules/perfil/config/privacidad");
  expect(config.obtenerCorreoPrivacidad()).toBe(CORREO_PRIVACIDAD);
  const arco = LEGAL_DOCUMENTS.privacy.sections.find((section: { title: string }) => section.title === "7. Derechos ARCO");
  expect(JSON.stringify(arco)).toContain(CORREO_PRIVACIDAD);
});

test("el adapter incluye exclusivamente nombre, correo y motivo, sin mutar el perfil", () => {
  const original = { ...perfil, estado: "Activo", token: "fixture-secret", expediente: "fixture-sensitive" };
  const copia = { ...original };
  expect(cancelacionFromPerfil(original, "  Cancelar mis datos de contacto.  ")).toEqual({
    nombreCompleto: "Ana María Pérez López",
    correoContacto: "paciente@example.test",
    motivo: "Cancelar mis datos de contacto.",
  });
  expect(original).toEqual(copia);
});

test("codifica acentos, saltos de línea y parámetros sin permitir destinatarios adicionales", () => {
  const motivo = "Cancelar teléfono & correo?\nÁmbito: contacto + dirección #1 &bcc=otro@example.test";
  const url = cancelacionToMailto(cancelacionFromPerfil(perfil, motivo), CORREO_PRIVACIDAD!);
  expect(url.startsWith(`mailto:${CORREO_PRIVACIDAD}?`)).toBe(true);
  const query = new URLSearchParams(url.split("?")[1]);
  expect([...query.keys()]).toEqual(["subject", "body"]);
  expect(query.get("subject")).toBe("Solicitud de derecho ARCO - Cancelación");
  expect(query.get("body")).toBe([
    "Solicito ejercer mi derecho de cancelación de datos personales.", "",
    "Nombre: Ana María Pérez López", "Correo de contacto: paciente@example.test",
    `Descripción de la solicitud: ${motivo}`, "",
    "Solicito información sobre el procedimiento correspondiente y la resolución de mi solicitud.",
  ].join("\n"));
  expect(url).not.toContain(perfil.phone);
  expect(url).not.toContain(perfil.fechaNacimiento);
});

test("motivo vacío solicita todos los datos que procedan; correo ausente no se inventa", () => {
  const url = cancelacionToMailto(cancelacionFromPerfil({ ...perfil, email: "" }, "  "), CORREO_PRIVACIDAD!);
  const body = new URLSearchParams(url.split("?")[1]).get("body");
  expect(body).toContain("Correo de contacto: No disponible en la cuenta.");
  expect(body).toContain("Solicito cancelar todos los datos personales que legalmente proceda cancelar.");
});

test("el servicio solo abre mailto, sin peticiones, cambios de estado ni confirmación de recepción", async () => {
  const solicitud = cancelacionFromPerfil(perfil, "");
  await expect(abrirCorreoCancelacion(solicitud)).resolves.toBeUndefined();
  expect(Linking.openURL).toHaveBeenCalledWith(cancelacionToMailto(solicitud, CORREO_PRIVACIDAD!));
  expect(global.fetch).not.toHaveBeenCalled();
});

test("sin correo oficial se bloquea la apertura con un error claro", async () => {
  jest.mocked(obtenerCorreoPrivacidad).mockReturnValue(null);
  await expect(abrirCorreoCancelacion(cancelacionFromPerfil(perfil, ""))).rejects.toThrow(/Falta configurar el correo oficial/);
  expect(Linking.openURL).not.toHaveBeenCalled();
});

test("sin nombre no envía un nombre de usuario ni una identidad inventada", async () => {
  await expect(abrirCorreoCancelacion(cancelacionFromPerfil({ ...perfil, nombreCompleto: "" }, ""))).rejects.toThrow(/nombre completo no está disponible/);
  expect(Linking.openURL).not.toHaveBeenCalled();
});

test.each(["sin aplicación de correo", "el usuario canceló la apertura", "fallo del sistema"])("gestiona %s sin exponer errores internos", async (error) => {
  jest.mocked(Linking.openURL).mockRejectedValueOnce(new Error(error + " fixture-secret"));
  await expect(abrirCorreoCancelacion(cancelacionFromPerfil(perfil, ""))).rejects.toThrow(
    `No fue posible abrir la aplicación de correo. Configura una aplicación de correo e inténtalo de nuevo. También puedes escribir a ${CORREO_PRIVACIDAD} para solicitar la cancelación.`,
  );
  expect(global.fetch).not.toHaveBeenCalled();
});
