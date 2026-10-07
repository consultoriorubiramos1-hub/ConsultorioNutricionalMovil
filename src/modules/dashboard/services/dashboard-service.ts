import {
  healthFromApi,
  nextAppointmentFromApi,
} from "../adapters/dashboard-adapter";
import type { DashboardData } from "../models/dashboard.model";

export class DashboardSessionError extends Error {}

async function getData(
  apiUrl: string,
  path: string,
  token: string,
  signal: AbortSignal,
): Promise<unknown> {
  const response = await fetch(`${apiUrl}${path}`, {
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    signal,
  });
  if (response.status === 401 || response.status === 403) {
    throw new DashboardSessionError(
      "Tu sesión ha expirado. Inicia sesión nuevamente.",
    );
  }
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new Error("El servidor devolvió una respuesta no válida.");
  }
  if (!body || typeof body !== "object")
    throw new Error("La respuesta del servidor no es válida.");
  const result = body as { ok?: unknown; data?: unknown; message?: unknown };
  if (!response.ok || result.ok !== true || result.data === undefined) {
    throw new Error(
      typeof result.message === "string"
        ? result.message
        : "No fue posible cargar los datos.",
    );
  }
  return result.data;
}

export async function obtenerDashboard(
  token: string,
  signal: AbortSignal,
): Promise<DashboardData> {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/$/, "");
  if (!apiUrl) throw new Error("No se encontró la configuración del servidor.");
  if (!token.trim())
    throw new DashboardSessionError("No existe una sesión autenticada.");
  const [history, appointments] = await Promise.allSettled([
    getData(apiUrl, "/api/mobile/historial", token, signal).then(healthFromApi),
    getData(apiUrl, "/api/mobile/citas", token, signal).then((data) =>
      nextAppointmentFromApi(data),
    ),
  ]);
  if (signal.aborted) throw new Error("La solicitud fue cancelada.");
  const errors: string[] = [];
  for (const [label, result] of [
    ["Historial", history],
    ["Citas", appointments],
  ] as const) {
    if (result.status === "rejected") {
      if (result.reason instanceof DashboardSessionError) throw result.reason;
      const message =
        result.reason instanceof Error
          ? result.reason.message
          : "Verifica tu conexión e inténtalo nuevamente.";
      errors.push(`${label}: ${message}`);
    }
  }
  return {
    health: history.status === "fulfilled" ? history.value : null,
    nextAppointment:
      appointments.status === "fulfilled" ? appointments.value : null,
    appointmentsAvailable: appointments.status === "fulfilled",
    errors,
  };
}
