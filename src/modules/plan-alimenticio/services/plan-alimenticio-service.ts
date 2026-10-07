import { nutritionPlanFromApi } from "../adapters/plan-alimenticio-adapter";
import type { NutritionPlan, NutritionPlanResponseDto } from "../models/plan-alimenticio.model";

export class PlanAlimenticioApiError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = "PlanAlimenticioApiError";
  }
}
function responseError(status: number): PlanAlimenticioApiError {
  const message = status === 401 || status === 403
    ? "Tu sesión no es válida o ha expirado."
    : status === 404
      ? "No se pudo encontrar tu plan alimenticio. Inténtalo nuevamente."
      : status >= 500
        ? "El servidor no pudo consultar tu plan alimenticio. Inténtalo nuevamente."
        : "No fue posible consultar tu plan alimenticio. Inténtalo nuevamente.";
  return new PlanAlimenticioApiError(message, status);
}

export async function getActiveNutritionPlan(token: string, signal?: AbortSignal): Promise<NutritionPlan | null> {
  if (!token.trim()) throw responseError(401);
  const baseUrl = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, "");
  try {
    const parsed = new URL(baseUrl ?? "");
    if (!/^https?:$/.test(parsed.protocol) || parsed.username || parsed.password || parsed.search || parsed.hash) throw new Error();
  } catch {
    throw new PlanAlimenticioApiError("No se encontró una configuración válida del servidor.");
  }
  if (signal?.aborted) throw new PlanAlimenticioApiError("La consulta fue cancelada.");
  const controller = new AbortController();
  const cancel = () => controller.abort();
  signal?.addEventListener("abort", cancel, { once: true });
  let timedOut = false;
  // Bound the full request, including the response body, to avoid an endless spinner.
  const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, 20000);
  try {
    const response = await fetch(baseUrl + "/api/mobile/plan-alimenticio", {
      method: "GET",
      headers: { Accept: "application/json", Authorization: "Bearer " + token.trim() },
      signal: controller.signal,
    });
    if (!response.ok) throw responseError(response.status);
    let body: unknown;
    try { body = await response.json(); }
    catch (cause) {
      if (controller.signal.aborted) throw cause;
      throw new PlanAlimenticioApiError("El servidor devolvió una respuesta no válida. Inténtalo nuevamente.", response.status);
    }
    const dto: NutritionPlanResponseDto | null = body !== null && typeof body === "object" && !Array.isArray(body)
      ? body as NutritionPlanResponseDto : null;
    if (dto?.ok !== true) throw responseError(response.status);
    if (dto.data === null) return null;
    const plan = nutritionPlanFromApi(dto.data);
    if (!plan) throw new PlanAlimenticioApiError("El servidor devolvió una respuesta no válida. Inténtalo nuevamente.", response.status);
    return plan;
  } catch (cause) {
    if (signal?.aborted) throw cause;
    if (timedOut) throw new PlanAlimenticioApiError("El servidor tardó demasiado en responder. Inténtalo nuevamente.");
    if (cause instanceof PlanAlimenticioApiError) throw cause;
    throw new PlanAlimenticioApiError("No se pudo conectar con el servidor. Verifica tu conexión e inténtalo nuevamente.");
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", cancel);
  }
}
