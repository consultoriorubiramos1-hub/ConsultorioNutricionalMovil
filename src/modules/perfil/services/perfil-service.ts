import {
  perfilFromApi,
  type PerfilApiResponse,
} from "../adapters/perfil-adapter";
import type { Perfil } from "../models/perfil.model";

export type ActualizarDatosPerfilPayload = Partial<{
  first_name: string;
  second_name: string | null;
  first_lastname: string;
  second_lastname: string;
  fecha_nacimiento: string;
  phone: string;
  age: number;
  gender: string;
  estado_civil: string;
  ocupacion: string;
}>;

export type ActualizarCuentaPerfilPayload = Partial<{
  username: string;
  email: string;
}>;

type PerfilPatchPayload =
  | ActualizarDatosPerfilPayload
  | ActualizarCuentaPerfilPayload;

function getApiUrl(): string {
  const value = process.env.EXPO_PUBLIC_API_URL?.trim();

  if (!value) {
    throw new Error("Falta configurar EXPO_PUBLIC_API_URL en el archivo .env.");
  }

  return value.replace(/\/$/, "");
}

async function getApiError(
  response: Response,
  fallback: string,
): Promise<string> {
  try {
    const body = (await response.json()) as {
      message?: string;
      error?: string;
    };

    return body.message?.trim() || body.error?.trim() || fallback;
  } catch {
    return fallback;
  }
}

async function perfilRequest(
  token: string,
  method: "GET" | "PATCH",
  payload?: PerfilPatchPayload,
): Promise<Response> {
  const normalizedToken = token.trim();

  if (!normalizedToken) {
    throw new Error("No existe una sesión autenticada.");
  }

  return fetch(`${getApiUrl()}/api/mobile/perfil`, {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${normalizedToken}`,
    },
    ...(payload ? { body: JSON.stringify(payload) } : {}),
  });
}

export async function obtenerPerfil(token: string): Promise<Perfil> {
  const response = await perfilRequest(token, "GET");

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error("La sesión no es válida o ha expirado.");
    }

    throw new Error(
      await getApiError(response, "No fue posible cargar el perfil."),
    );
  }

  const body = (await response.json()) as PerfilApiResponse;

  if (!body.ok || !body.data) {
    throw new Error(
      body.message?.trim() ||
        body.error?.trim() ||
        "La respuesta del perfil no es válida.",
    );
  }

  return perfilFromApi(body.data);
}

async function actualizarPerfil(
  token: string,
  payload: PerfilPatchPayload,
): Promise<void> {
  const response = await perfilRequest(token, "PATCH", payload);

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error("La sesión no es válida o ha expirado.");
    }

    throw new Error(
      await getApiError(response, "No fue posible actualizar el perfil."),
    );
  }
}

export function actualizarDatosPerfil(
  token: string,
  payload: ActualizarDatosPerfilPayload,
): Promise<void> {
  return actualizarPerfil(token, payload);
}

export function actualizarCuentaPerfil(
  token: string,
  payload: ActualizarCuentaPerfilPayload,
): Promise<void> {
  return actualizarPerfil(token, payload);
}
