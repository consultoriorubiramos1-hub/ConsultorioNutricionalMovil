import * as Linking from "expo-linking";

import { oposicionFromPerfil, oposicionToMailto } from "@/modules/perfil/adapters/oposicion-adapter";
import { perfilFromApi } from "@/modules/perfil/adapters/perfil-adapter";
import { CORREO_PRIVACIDAD, obtenerCorreoPrivacidad } from "@/modules/perfil/config/privacidad";
import { OPOSICION_MAX_LENGTH, type OposicionForm } from "@/modules/perfil/models/oposicion.model";
import { abrirCorreoOposicion } from "@/modules/perfil/services/oposicion-service";
import { validarOposicion } from "@/modules/perfil/utils/oposicion-form";

jest.mock("expo-linking", () => ({ openURL: jest.fn() }));
jest.mock("@/modules/perfil/config/privacidad", () => ({
  ...jest.requireActual("@/modules/perfil/config/privacidad"),
  obtenerCorreoPrivacidad: jest.fn(),
}));

const perfil = perfilFromApi({
  first_name: "Ana", second_name: "María", first_lastname: "Pérez", second_lastname: "López",
  email: "paciente@example.test", phone: "5512345678", fecha_nacimiento: "2000-02-09",
});
const form: OposicionForm = {
  tratamiento: "Uso de mis datos de contacto para una finalidad específica.",
  motivo: "Solicito que se revise si puede cesar ese tratamiento.",
};

beforeEach(() => {
  jest.mocked(obtenerCorreoPrivacidad).mockReturnValue(CORREO_PRIVACIDAD);
  jest.mocked(Linking.openURL).mockResolvedValue(true);
});

afterEach(() => {
  expect(global.fetch).not.toHaveBeenCalled();
});

test("el adapter toma solo nombre, correo, tratamiento y motivo sin modificar estado o expediente", () => {
  const original = Object.freeze({
    ...perfil, nombreCompleto: "  Ana María Pérez López  ", email: "  paciente@example.test  ",
    estado: "Activo", token: "fixture-secret", expediente: "fixture-sensitive", pacienteId: 27,
  });
  expect(oposicionFromPerfil(original, {
    tratamiento: `  ${form.tratamiento}  `, motivo: `  ${form.motivo}  `,
  })).toEqual({
    nombreCompleto: "Ana María Pérez López", correoContacto: "paciente@example.test",
    tratamiento: form.tratamiento, motivo: form.motivo,
  });
  expect(original.estado).toBe("Activo");
  expect(original.expediente).toBe("fixture-sensitive");
});

test("prepara el asunto y todos los párrafos exactos con acentos y saltos de línea", () => {
  const solicitud = oposicionFromPerfil(perfil, form);
  const uri = oposicionToMailto(solicitud, CORREO_PRIVACIDAD!);
  expect(uri.startsWith(`mailto:${CORREO_PRIVACIDAD}?`)).toBe(true);
  const query = new URLSearchParams(uri.split("?")[1]);
  expect(query.get("subject")).toBe("Solicitud de derecho ARCO - Oposición");
  expect(query.get("body")).toBe([
    "Solicito ejercer mi derecho de oposición al tratamiento de datos personales.",
    "Nombre: Ana María Pérez López",
    "Correo de contacto: paciente@example.test",
    `Tratamiento o finalidad a la que me opongo: ${form.tratamiento}`,
    `Motivo de la oposición: ${form.motivo}`,
    "Solicito que el consultorio revise mi solicitud, determine su procedencia y me informe la resolución correspondiente.",
  ].join("\n\n"));
});

test("codifica el destinatario y evita que caracteres especiales se conviertan en nuevos parámetros", () => {
  const especial = {
    tratamiento: "Ámbito de atención & contacto?\nDirección #1 + teléfono &bcc=otro@example.test",
    motivo: "Revisión: ñ, ó, 100% y línea\nnueva?subject=ajeno#fragmento",
  };
  const uri = oposicionToMailto(oposicionFromPerfil(perfil, especial), "privacidad+arco@example.test");
  expect(uri.startsWith("mailto:privacidad%2Barco@example.test?")).toBe(true);
  const query = new URLSearchParams(uri.split("?")[1]);
  expect([...query.keys()]).toEqual(["subject", "body"]);
  expect(query.get("body")).toContain(especial.tratamiento);
  expect(query.get("body")).toContain(especial.motivo);
  expect(uri).not.toContain("\n");
  expect(uri).not.toContain("#fragmento");
});

test("no inventa correo del paciente ni sustituye los campos obligatorios con mensajes genéricos", () => {
  const solicitud = oposicionFromPerfil({ ...perfil, email: "" }, form);
  expect(solicitud.correoContacto).toBe("");
  const body = new URLSearchParams(oposicionToMailto(solicitud, CORREO_PRIVACIDAD!).split("?")[1]).get("body");
  expect(body).toContain("Correo de contacto: No disponible en la cuenta.");
  expect(body).toContain(form.tratamiento);
  expect(body).toContain(form.motivo);
});

test.each(["tratamiento", "motivo"] as const)("exige %s incluso si contiene solo espacios", (field) => {
  for (const value of ["", "  \n\t "]) {
    expect(validarOposicion({ ...form, [field]: value })).toMatch(field === "motivo" ? /motivo/i : /uso|tratamiento|finalidad/i);
  }
});

test.each(["tratamiento", "motivo"] as const)("limita %s y admite exactamente el máximo", (field) => {
  expect(validarOposicion({ ...form, [field]: "a".repeat(OPOSICION_MAX_LENGTH) })).toBeNull();
  expect(validarOposicion({ ...form, [field]: "a".repeat(OPOSICION_MAX_LENGTH + 1) })).toMatch(/1000|1,000|1\.000/);
});

test("acepta ambos campos presentes tras quitar espacios exteriores", () => {
  expect(validarOposicion({ tratamiento: `  ${form.tratamiento}  `, motivo: `  ${form.motivo}\n ` })).toBeNull();
});

test("abre únicamente el correo oficial y devuelve apertura sin confirmar recepción ni modificar datos", async () => {
  const solicitud = oposicionFromPerfil(perfil, form);
  const original = { ...solicitud };
  await expect(abrirCorreoOposicion(solicitud)).resolves.toBeUndefined();
  expect(Linking.openURL).toHaveBeenCalledTimes(1);
  expect(Linking.openURL).toHaveBeenCalledWith(oposicionToMailto(solicitud, CORREO_PRIVACIDAD!));
  expect(solicitud).toEqual(original);
  const body = new URLSearchParams(jest.mocked(Linking.openURL).mock.calls[0][0].split("?")[1]).get("body")!;
  for (const excluded of [perfil.phone, perfil.fechaNacimiento!, "fixture-secret", "fixture-sensitive", "pacienteId", "Activo"]) {
    expect(body).not.toContain(excluded);
  }
});

test("el servicio permite correo del paciente ausente sin crear datos de contacto", async () => {
  const solicitud = oposicionFromPerfil({ ...perfil, email: "" }, form);
  await abrirCorreoOposicion(solicitud);
  expect(decodeURIComponent(jest.mocked(Linking.openURL).mock.calls[0][0])).toContain("Correo de contacto: No disponible en la cuenta.");
});

test("sin correo oficial impide preparar correo y muestra la configuración faltante", async () => {
  jest.mocked(obtenerCorreoPrivacidad).mockReturnValue(null);
  await expect(abrirCorreoOposicion(oposicionFromPerfil(perfil, form))).rejects.toThrow(/Falta configurar el correo oficial/);
  expect(Linking.openURL).not.toHaveBeenCalled();
});

test("sin nombre completo no utiliza otra identidad del perfil", async () => {
  await expect(abrirCorreoOposicion(oposicionFromPerfil({ ...perfil, nombreCompleto: "" }, form))).rejects.toThrow(/nombre completo no está disponible/);
  expect(Linking.openURL).not.toHaveBeenCalled();
});

test.each(["tratamiento", "motivo"] as const)("el servicio rechaza %s vacío o demasiado largo antes de abrir correo", async (field) => {
  for (const value of [" \n ", "a".repeat(OPOSICION_MAX_LENGTH + 1)]) {
    const solicitud = oposicionFromPerfil(perfil, { ...form, [field]: value });
    await expect(abrirCorreoOposicion(solicitud)).rejects.toThrow();
  }
  expect(Linking.openURL).not.toHaveBeenCalled();
});

test.each(["sin aplicación compatible", "apertura cancelada", "error nativo"])("maneja %s sin exponer detalles internos ni afirmar envío", async (cause) => {
  jest.mocked(Linking.openURL).mockRejectedValueOnce(new Error(cause + " fixture-secret"));
  await expect(abrirCorreoOposicion(oposicionFromPerfil(perfil, form))).rejects.toThrow(
    `No fue posible abrir la aplicación de correo. Configura una aplicación de correo e inténtalo de nuevo. También puedes escribir a ${CORREO_PRIVACIDAD} para solicitar la oposición.`,
  );
});
