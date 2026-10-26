import { TextEncoder } from "node:util";
import { Platform } from "react-native";

import {
  CitasApiError,
  createAppointment,
  createAppointmentFormData,
} from "@/modules/citas/services/citas-service";
import type { CreateAppointmentInput } from "@/modules/citas/models/citas.model";

const mockReadBytes = jest.fn();
jest.mock("expo-file-system", () => ({
  File: class {
    readonly uri: string;
    constructor(uri: string) { this.uri = uri; }
    bytes() { return mockReadBytes(this.uri); }
  },
}));

// Ejecuta el serializador instalado de Expo 57, sin simular su comportamiento.
// Solo la lectura del archivo es simulada; esto NO prueba la subida en Android.
const { normalizeBodyInitAsync } = jest.requireActual<{
  normalizeBodyInitAsync(body: FormData): Promise<{
    body: Uint8Array;
    overriddenHeaders: [string, string][];
  }>;
}>("expo/src/winter/fetch/RequestUtils");
const { installFormDataPatch } = jest.requireActual("expo/src/winter/FormData");
const RNFormData = jest.requireActual("react-native/Libraries/Network/FormData").default;
class NativeFormData extends RNFormData {}
installFormDataPatch(NativeFormData);

const originalFormData = global.FormData;
const originalDiagnostics = process.env.EXPO_PUBLIC_RECEIPT_UPLOAD_DIAGNOSTICS;
const fixtureBytes = new Uint8Array([137, 80, 78, 71, 0, 255, 13, 10]);
const input: CreateAppointmentInput = {
  appointmentDate: "2026-10-08",
  startTime: "13:30:00",
  notes: " Seguimiento ",
  receipt: {
    uri: "file:///fixture/imagen%20privada.png",
    name: "comprobante.png",
    type: "image/png",
    size: fixtureBytes.length,
  },
};

beforeEach(() => {
  jest.useFakeTimers().setSystemTime(new Date("2026-10-07T18:00:00Z"));
  jest.replaceProperty(Platform, "OS", "android");
  global.FormData = NativeFormData as unknown as typeof FormData;
  global.TextEncoder ??= TextEncoder as typeof global.TextEncoder;
  mockReadBytes.mockReset().mockResolvedValue(fixtureBytes);
});
afterEach(() => {
  global.FormData = originalFormData;
  jest.useRealTimers();
  if (originalDiagnostics === undefined) delete process.env.EXPO_PUBLIC_RECEIPT_UPLOAD_DIAGNOSTICS;
  else process.env.EXPO_PUBLIC_RECEIPT_UPLOAD_DIAGNOSTICS = originalDiagnostics;
});

test("Expo 57 rechaza el descriptor anterior antes del transporte HTTP", async () => {
  const form = new FormData();
  form.append("receipt", {
    uri: input.receipt.uri,
    name: input.receipt.name,
    type: input.receipt.type,
  } as unknown as Blob);
  await expect(normalizeBodyInitAsync(form)).rejects.toThrow(
    "Unsupported FormDataPart implementation",
  );
  expect(global.fetch).not.toHaveBeenCalled();
});

test.each([
  ["android", "image/png", "png"],
  ["android", "image/jpeg", "jpg"],
  ["android", "image/webp", "webp"],
  ["ios", "image/png", "png"],
  ["ios", "image/jpeg", "jpg"],
  ["ios", "image/webp", "webp"],
] as const)("%s %s: serializa receipt con bytes, nombre, MIME y boundary", async (platform, type, extension) => {
  jest.replaceProperty(Platform, "OS", platform as typeof Platform.OS);
  const receipt = { ...input.receipt, type, name: `comprobante.${extension}` };
  const form = createAppointmentFormData({ ...input, receipt });
  const result = await normalizeBodyInitAsync(form);
  const body = Buffer.from(result.body);
  const text = body.toString("latin1");
  const contentType = result.overriddenHeaders.find(([key]) => key === "Content-Type")?.[1];
  expect(contentType).toMatch(/^multipart\/form-data; boundary=.+/);
  const boundary = contentType!.split("boundary=")[1];
  expect(text).toContain(`--${boundary}\r\n`);
  expect(text.endsWith(`--${boundary}--\r\n`)).toBe(true);
  expect(text).toContain('name="appointmentDate"\r\n\r\n2026-10-08');
  expect(text).toContain('name="startTime"\r\n\r\n13:30:00');
  expect(text).toContain('name="notes"\r\n\r\nSeguimiento');
  expect(text).toContain(`name="receipt"; filename="${receipt.name}"`);
  expect(text).toContain(`content-type: ${type}\r\n`);
  expect(body.includes(Buffer.from(fixtureBytes))).toBe(true);
  expect(text).not.toContain(input.receipt.uri);
  expect(text).not.toContain("[object Object]");
  expect(mockReadBytes).toHaveBeenCalledWith(input.receipt.uri);
  expect(global.fetch).not.toHaveBeenCalled();
});

function captureDiagnostics() {
  process.env.EXPO_PUBLIC_RECEIPT_UPLOAD_DIAGNOSTICS = "1";
  return jest.spyOn(console, "info").mockImplementation(() => {});
}

test("el FormData de RN conserva URI/nombre/MIME sin pasar funciones al módulo nativo", () => {
  const form = createAppointmentFormData(input) as FormData & {
    getParts(): Record<string, unknown>[];
  };
  const part = form.getParts().find((value) => value.fieldName === "receipt");
  expect(part).toMatchObject({
    uri: input.receipt.uri, name: input.receipt.name, type: input.receipt.type,
  });
  expect(part).not.toHaveProperty("bytes");
  expect(Object.values(part!).some((value) => typeof value === "function")).toBe(false);
});

const fetchMock = () => jest.mocked(global.fetch);
const privateDetails = `Bearer token-fixture ${input.receipt.uri} notas-privadas`;

test("distingue un fallo de construcción y no registra el error original", () => {
  const log = captureDiagnostics();
  jest.spyOn(NativeFormData.prototype, "append").mockImplementationOnce(() => {
    throw new Error(privateDetails);
  });
  expect(() => createAppointmentFormData(input)).toThrow(CitasApiError);
  expect(log.mock.calls).toEqual([["[citas:receipt]", { stage: "form_data_error", platform: "android" }]]);
  expect(global.fetch).not.toHaveBeenCalled();
});

test("la lectura fallida durante la serialización no se presenta como error de red", async () => {
  const log = captureDiagnostics();
  mockReadBytes.mockRejectedValueOnce(new Error(privateDetails));
  // Transporte simulado que sí ejecuta la serialización real previa al HTTP.
  fetchMock().mockImplementationOnce(async (_url, options) => {
    await normalizeBodyInitAsync(options!.body as FormData);
    throw new Error("No debe llegar al transporte");
  });
  await expect(createAppointment("token-fixture", input)).rejects.toMatchObject({
    kind: "file_read", status: undefined,
  });
  expect(log.mock.calls.map(([, data]) => data.stage)).toEqual([
    "form_data_ready", "request_started", "file_read_error",
  ]);
  expect(JSON.stringify(log.mock.calls)).not.toContain(privateDetails);
});

test("clasifica el rechazo del serializador separadamente del transporte", async () => {
  const log = captureDiagnostics();
  fetchMock().mockRejectedValueOnce(new Error("Unsupported FormDataPart implementation"));
  await expect(createAppointment("token-fixture", input)).rejects.toMatchObject({ kind: "form_data" });
  expect(log.mock.calls.at(-1)).toEqual(["[citas:receipt]", { stage: "form_data_error", platform: "android" }]);
});

test("un rechazo sin respuesta HTTP se clasifica como transporte sin registrar su mensaje", async () => {
  const log = captureDiagnostics();
  fetchMock().mockRejectedValueOnce(new TypeError(privateDetails));
  await expect(createAppointment("token-fixture", input)).rejects.toMatchObject({ kind: "network" });
  expect(log.mock.calls.at(-1)).toEqual(["[citas:receipt]", { stage: "transport_error", platform: "android" }]);
  expect(JSON.stringify(log.mock.calls)).not.toContain(privateDetails);
});

test.each([401, 403, 409, 413, 415, 422, 500])("una respuesta HTTP %s conserva su estado sin registrar el cuerpo", async (status) => {
  const log = captureDiagnostics();
  fetchMock().mockResolvedValueOnce({
    ok: false, status, json: async () => ({ ok: false, message: privateDetails }),
  } as Response);
  await expect(createAppointment("token-fixture", input)).rejects.toMatchObject({ kind: "http", status });
  expect(log.mock.calls.at(-1)).toEqual(["[citas:receipt]", { stage: "http_response", platform: "android", status }]);
  expect(JSON.stringify(log.mock.calls)).not.toContain(privateDetails);
});

test("una respuesta no JSON conserva el estado HTTP y no se etiqueta como red", async () => {
  const log = captureDiagnostics();
  fetchMock().mockResolvedValueOnce({
    ok: false, status: 413, json: async () => { throw new Error(privateDetails); },
  } as unknown as Response);
  await expect(createAppointment("token-fixture", input)).rejects.toMatchObject({ kind: "response", status: 413 });
  expect(log.mock.calls.slice(-2)).toEqual([
    ["[citas:receipt]", { stage: "http_response", platform: "android", status: 413 }],
    ["[citas:receipt]", { stage: "invalid_response", platform: "android", status: 413 }],
  ]);
});

test("los diagnósticos no se emiten sin habilitar la opción", () => {
  delete process.env.EXPO_PUBLIC_RECEIPT_UPLOAD_DIAGNOSTICS;
  const log = jest.spyOn(console, "info").mockImplementation(() => {});
  createAppointmentFormData(input);
  expect(log).not.toHaveBeenCalled();
});

test("los diagnósticos no se emiten en producción aunque se habilite la opción", () => {
  const log = captureDiagnostics();
  jest.replaceProperty(globalThis as typeof globalThis & { __DEV__: boolean }, "__DEV__", false);
  createAppointmentFormData(input);
  expect(log).not.toHaveBeenCalled();
});
