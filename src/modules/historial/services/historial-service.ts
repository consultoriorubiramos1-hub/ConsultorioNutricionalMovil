import { medicalHistoryFromApi } from "../adapters/historial-adapter";
import type { MedicalHistoryResponseDto } from "../models/historial-api.dto";
import type { MedicalHistory } from "../models/historial.model";

export class HistorialApiError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = "HistorialApiError";
  }
}
function responseError(status: number): HistorialApiError {
  const message = status === 401 || status === 403
    ? "Tu sesión no es válida o ha expirado."
    : status === 404
      ? "No se pudo encontrar tu historial médico. Inténtalo nuevamente."
      : status >= 500
        ? "El servidor no pudo consultar tu historial médico. Inténtalo nuevamente."
        : "No fue posible consultar tu historial médico. Inténtalo nuevamente.";
  return new HistorialApiError(message, status);
}
function invalidResponse(status: number): HistorialApiError {
  return new HistorialApiError(
    "El servidor devolvió una respuesta no válida. Inténtalo nuevamente.", status,
  );
}

export async function getMedicalHistory(token: string, signal?: AbortSignal): Promise<MedicalHistory> {
  if (!token.trim()) throw responseError(401);
  const baseUrl = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, "");
  try {
    const parsed = new URL(baseUrl ?? "");
    if (!/^https?:$/.test(parsed.protocol) || parsed.username || parsed.password || parsed.search || parsed.hash) {
      throw new Error();
    }
  } catch {
    throw new HistorialApiError("No se encontró una configuración válida del servidor.");
  }
  if (signal?.aborted) throw new HistorialApiError("La consulta fue cancelada.");
  const controller = new AbortController();
  const cancel = () => controller.abort();
  signal?.addEventListener("abort", cancel, { once: true });
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, 20000);
  try {
    const response = await fetch(baseUrl + "/api/mobile/historial", {
      method: "GET",
      headers: { Accept: "application/json", Authorization: "Bearer " + token.trim() },
      signal: controller.signal,
    });
    if (!response.ok) throw responseError(response.status);
    let body: unknown;
    try {
      body = await response.json();
    } catch (cause) {
      if (controller.signal.aborted) throw cause;
      throw invalidResponse(response.status);
    }
    const dto: MedicalHistoryResponseDto | null = body !== null && typeof body === "object" && !Array.isArray(body)
      ? body as MedicalHistoryResponseDto : null;
    if (dto?.ok !== true) throw responseError(response.status);
    const history = medicalHistoryFromApi(dto.data);
    if (!history) throw invalidResponse(response.status);
    return history;
  } catch (cause) {
    if (signal?.aborted) throw cause;
    if (timedOut) throw new HistorialApiError("El servidor tardó demasiado en responder. Inténtalo nuevamente.");
    if (cause instanceof HistorialApiError) throw cause;
    throw new HistorialApiError(
      "No se pudo conectar con el servidor. Verifica tu conexión e inténtalo nuevamente.",
    );
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", cancel);
  }
}
