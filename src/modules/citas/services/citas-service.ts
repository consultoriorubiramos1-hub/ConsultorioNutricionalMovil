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

export class CitasApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
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
  let response: Response;
  try {
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
    throw new CitasApiError(
      "No se pudo conectar con el servidor. Verifica tu conexión e inténtalo nuevamente.",
    );
  }
  if (response.status === 401 || response.status === 403)
    throw new CitasApiError(
      "Tu sesión no es válida o ha expirado. Inicia sesión nuevamente.",
      response.status,
    );
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new CitasApiError(
      "El servidor devolvió una respuesta no válida. Actualiza tus citas antes de volver a intentar.",
      response.status,
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
  validateReceipt(input.receipt);
  const form = new FormData();
  form.append("appointmentDate", input.appointmentDate);
  form.append("startTime", input.startTime);
  form.append("notes", input.notes.trim());
  if (Platform.OS === "web") {
    if (!input.receipt.webFile)
      throw new CitasApiError("Selecciona nuevamente el comprobante.");
    form.append("receipt", input.receipt.webFile, input.receipt.name);
  } else {
    // React Native's FormData accepts a file descriptor; do not set Content-Type
    // manually so fetch generates the multipart boundary.
    form.append("receipt", {
      uri: input.receipt.uri,
      name: input.receipt.name,
      type: input.receipt.type,
    } as unknown as Blob);
  }
  return form;
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
