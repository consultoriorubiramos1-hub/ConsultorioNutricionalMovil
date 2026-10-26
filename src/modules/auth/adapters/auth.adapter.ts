import type {
    AuthUser,
    LoginApiResponse,
    LoginResult,
} from "../models/auth.model";

function isAuthUser(value: unknown): value is AuthUser {
  if (!value || typeof value !== "object") {
    return false;
  }

  const user = value as Record<string, unknown>;

  return (
    typeof user.id === "string" &&
    typeof user.username === "string" &&
    typeof user.email === "string" &&
    user.rol_id === 2
  );
}

export function adaptLoginResponse(
  response: LoginApiResponse,
  status?: number,
): LoginResult {
  if (
    response.ok &&
    typeof response.data?.token === "string" &&
    isAuthUser(response.data.user)
  ) {
    return {
      success: true,
      token: response.data.token,
      user: response.data.user,
    };
  }

  return {
    success: false,
    message:
      !response.ok && response.message
        ? response.message
        : "No se pudo procesar la respuesta del servidor.",
    status,
  };
}
