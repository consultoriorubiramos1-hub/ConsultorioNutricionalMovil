import { postLikeFromApi, postsFromApi } from "../adapters/muro-adapter";
import { MAX_SEARCH_LENGTH, type MuroResponseDto, type Post, type PostLikeResult } from "../models/muro.model";
import { positiveId, safeHttpUrl } from "../utils/muro-format";

export class MuroApiError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = "MuroApiError";
  }
}
function responseError(status: number, like: boolean): MuroApiError {
  const message = status === 401 || status === 403
    ? "Tu sesión no es válida o ha expirado."
    : status === 404
      ? like ? "Publicación no encontrada." : "No se pudo encontrar el muro informativo. Inténtalo nuevamente."
      : status === 400
        ? like ? "Identificador de publicación inválido." : "La búsqueda no es válida. Usa hasta 100 caracteres."
        : like ? "No se pudo procesar el like. Inténtalo nuevamente."
          : "No se pudieron consultar las publicaciones. Inténtalo nuevamente.";
  return new MuroApiError(message, status);
}
function invalidResponse(): MuroApiError {
  return new MuroApiError("El servidor devolvió una respuesta no válida. Inténtalo nuevamente.");
}
async function request(path: string, token: string, method: "GET" | "POST", signal?: AbortSignal): Promise<unknown> {
  if (!token.trim()) throw responseError(401, method === "POST");
  const configured = process.env.EXPO_PUBLIC_API_URL?.trim();
  const safe = safeHttpUrl(configured);
  if (!safe) throw new MuroApiError("No se encontró una configuración válida del servidor.");
  const parsed = new URL(safe);
  if (parsed.search || parsed.hash) throw new MuroApiError("No se encontró una configuración válida del servidor.");
  const baseUrl = safe.replace(/\/+$/, "");
  if (signal?.aborted) throw new MuroApiError("La consulta fue cancelada.");
  const controller = new AbortController();
  const cancel = () => controller.abort();
  signal?.addEventListener("abort", cancel, { once: true });
  let timedOut = false;
  const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, 20000);
  try {
    const response = await fetch(baseUrl + "/api/mobile/muro" + path, {
      method, headers: { Accept: "application/json", Authorization: "Bearer " + token.trim() },
      signal: controller.signal, cache: "no-store",
    });
    if (!response.ok) throw responseError(response.status, method === "POST");
    let body: unknown;
    try { body = await response.json(); }
    catch (cause) {
      if (controller.signal.aborted) throw cause;
      throw invalidResponse();
    }
    const dto: MuroResponseDto | null = body !== null && typeof body === "object" && !Array.isArray(body)
      ? body as MuroResponseDto : null;
    if (dto?.ok !== true) throw responseError(response.status, method === "POST");
    if (dto.data === undefined) throw invalidResponse();
    return dto.data;
  } catch (cause) {
    if (signal?.aborted) throw cause;
    if (timedOut) throw new MuroApiError("El servidor tardó demasiado en responder. Inténtalo nuevamente.");
    if (cause instanceof MuroApiError) throw cause;
    throw new MuroApiError("No se pudo conectar con el servidor. Verifica tu conexión e inténtalo nuevamente.");
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", cancel);
  }
}
export async function getPosts(token: string, search = "", signal?: AbortSignal): Promise<Post[]> {
  const query = search.trim();
  if (query.length > MAX_SEARCH_LENGTH) throw new MuroApiError("La búsqueda no puede superar 100 caracteres.", 400);
  const data = await request(query ? "?search=" + encodeURIComponent(query) : "", token, "GET", signal);
  try { return postsFromApi(data); } catch { throw invalidResponse(); }
}
export async function togglePostLike(token: string, postId: number, signal?: AbortSignal): Promise<PostLikeResult> {
  if (positiveId(postId) === null) throw new MuroApiError("Identificador de publicación inválido.", 400);
  const data = await request("/" + postId + "/like", token, "POST", signal);
  try { return postLikeFromApi(data); } catch { throw invalidResponse(); }
}
