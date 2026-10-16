import { File } from "expo-file-system";
import { Platform } from "react-native";

import {
  appointmentsFromApi,
  availabilityFromApi,
  cancelledAppointmentFromApi,
  createdAppointmentFromApi,
  rescheduledAppointmentFromApi,
} from "../adapters/citas-adapter";
import { validateReceipt } from "../adapters/receipt-adapter";
import {
  MAX_NOTES_LENGTH,
  type CreateAppointmentInput,
  type RescheduleAppointmentInput,
} from "../models/citas.model";
import { isBookableDate, isFutureSlot } from "../utils/citas-date";

type CitasErrorKind = "form_data" | "file_read" | "network" | "http" | "response";
type UploadStage =
  | "form_data_ready"
  | "form_data_error"
  | "file_read_error"
  | "request_started"
  | "transport_error"
  | "http_response"
  | "invalid_response";

// Diagnóstico temporal, opt-in y solo en desarrollo. Nunca pasar errores,
// URLs, URIs, archivos, cuerpos, cabeceras ni datos del formulario aquí.
function diagnoseUpload(stage: UploadStage, status?: number): void {
  if (
    typeof __DEV__ !== "undefined" && __DEV__ &&
    process.env.EXPO_PUBLIC_RECEIPT_UPLOAD_DIAGNOSTICS === "1"
  ) {
    console.info("[citas:receipt]", {
      stage,
      platform: Platform.OS,
      ...(status === undefined ? {} : { status }),
    });
  }
}

export class CitasApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly kind?: CitasErrorKind,
  ) {
    super(message);
  }
}

function safeMessage(value: unknown, fallback: string): string {
  if (
    typeof value !== "string" ||
    !value.trim() ||
    value.length > 500 ||
    /postgres|sqlstate|stack trace|Bearer\s|https?:\/\//i.test(value)
  )
    return fallback;
  return value.trim();
}

async function request(
  path: string,
  token: string,
  options: RequestInit = {},
): Promise<unknown> {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/$/, "");
  if (!baseUrl)
    throw new CitasApiError("No se encontró la configuración del servidor.");
  if (!token.trim())
    throw new CitasApiError("Inicia sesión para gestionar tus citas.", 401);
  const uploading = options.method === "POST" && options.body instanceof FormData;
  let response: Response;
  try {
    if (uploading) diagnoseUpload("request_started");
    response = await fetch(`${baseUrl}/api/mobile/citas${path}`, {
      ...options,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token.trim()}`,
        ...options.headers,
      },
    });
  } catch (cause) {
    if (options.signal?.aborted) throw cause;
    // La lectura diferida del archivo ocurre dentro del serializador de fetch.
    if (cause instanceof CitasApiError) throw cause;
    if (
      uploading && cause instanceof Error &&
      /^(Unsupported FormData implementation|Unsupported FormDataPart implementation|Unsupported BodyInit type)$/.test(cause.message)
    ) {
      diagnoseUpload("form_data_error");
      throw new CitasApiError(
        "No fue posible preparar el comprobante para enviarlo. Selecciona nuevamente la imagen.",
        undefined,
        "form_data",
      );
    }
    if (uploading) diagnoseUpload("transport_error");
    throw new CitasApiError(
      "No se pudo conectar con el servidor. Verifica tu conexión e inténtalo nuevamente.",
      undefined,
      "network",
    );
  }
  if (uploading) diagnoseUpload("http_response", response.status);
  if (response.status === 401 || response.status === 403)
    throw new CitasApiError(
      "Tu sesión no es válida o ha expirado. Inicia sesión nuevamente.",
      response.status,
      "http",
    );
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    if (uploading) diagnoseUpload("invalid_response", response.status);
    throw new CitasApiError(
      "El servidor devolvió una respuesta no válida. Actualiza tus citas antes de volver a intentar.",
      response.status,
      "response",
    );
  }
  const data =
    body && typeof body === "object" && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : null;
  if (!response.ok || data?.ok !== true || data.data === undefined) {
    const fallback =
      response.status === 404
        ? "Paciente o cita no encontrados."
        : response.status >= 500
          ? "No fue posible procesar la solicitud. Inténtalo nuevamente."
          : "No fue posible procesar los datos enviados.";
    throw new CitasApiError(
      response.status >= 500 ? fallback : safeMessage(data?.message, fallback),
      response.status,
      "http",
    );
  }
  return data.data;
}

export async function getAppointments(token: string, signal?: AbortSignal) {
  return appointmentsFromApi(await request("", token, { signal }));
}

export async function getAvailability(
  token: string,
  date: string,
  signal?: AbortSignal,
) {
  if (!isBookableDate(date))
    throw new CitasApiError(
      "Selecciona una fecha válida que no esté en el pasado.",
      400,
    );
  return availabilityFromApi(
    await request(`/disponibilidad?date=${encodeURIComponent(date)}`, token, {
      signal,
    }),
    date,
  );
}

export function createAppointmentFormData(
  input: CreateAppointmentInput,
): FormData {
  try {
    validateReceipt(input.receipt);
  } catch (cause) {
    diagnoseUpload("form_data_error");
    throw cause;
  }
  try {
    const form = new FormData();
    form.append("appointmentDate", input.appointmentDate);
    form.append("startTime", input.startTime);
    form.append("notes", input.notes.trim());
    if (Platform.OS === "web") {
      if (!input.receipt.webFile)
        throw new CitasApiError("Selecciona nuevamente el comprobante.", undefined, "form_data");
      form.append("receipt", input.receipt.webFile, input.receipt.name);
    } else {
      const file = new File(input.receipt.uri);
      // Expo 57's global fetch serializes File-like parts via bytes(), not uri.
      // Keep the safe name/MIME and uri for RN's optional legacy fetch as well.
      // Do not set Content-Type: fetch generates the multipart boundary.
      const part = {
        uri: input.receipt.uri,
        name: input.receipt.name,
        type: input.receipt.type,
      };
      // Non-enumerable so RN's getParts() does not pass a JS function to native.
      Object.defineProperty(part, "bytes", {
        value: async () => {
          try {
            return await file.bytes();
          } catch {
            diagnoseUpload("file_read_error");
            throw new CitasApiError(
              "No fue posible leer el comprobante para enviarlo. Selecciona nuevamente la imagen.",
              undefined,
              "file_read",
            );
          }
        },
      });
      form.append("receipt", part as unknown as Blob);
    }
    diagnoseUpload("form_data_ready");
    return form;
  } catch (cause) {
    diagnoseUpload("form_data_error");
    if (cause instanceof CitasApiError) throw cause;
    throw new CitasApiError(
      "No fue posible preparar el comprobante para enviarlo. Selecciona nuevamente la imagen.",
      undefined,
      "form_data",
    );
  }
}

export async function createAppointment(
  token: string,
  input: CreateAppointmentInput,
) {
  if (!isFutureSlot(input.appointmentDate, input.startTime))
    throw new CitasApiError("Selecciona una fecha y un horario futuros.", 400);
  if (input.notes.length > MAX_NOTES_LENGTH)
    throw new CitasApiError("Las notas no pueden superar 500 caracteres.", 400);
  return createdAppointmentFromApi(
    await request("", token, {
      method: "POST",
      body: createAppointmentFormData(input),
    }),
  );
}

function validateId(id: number): void {
  if (!Number.isSafeInteger(id) || id <= 0)
    throw new CitasApiError("La cita seleccionada no es válida.", 400);
}

export async function cancelAppointment(token: string, id: number) {
  validateId(id);
  return cancelledAppointmentFromApi(
    await request(`/${id}/cancelar`, token, { method: "PATCH" }),
  );
}

export async function rescheduleAppointment(
  token: string,
  id: number,
  input: RescheduleAppointmentInput,
) {
  validateId(id);
  if (!isFutureSlot(input.date, input.startTime))
    throw new CitasApiError("Selecciona una fecha y un horario futuros.", 400);
  return rescheduledAppointmentFromApi(
    await request(`/${id}/reprogramar`, token, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
}
