import type { AuthUser, LoginResult } from '../models/auth.model';

export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isAuthToken(value: unknown): value is string {
  return isNonEmptyString(value) && !/[\s\u0000-\u001f\u007f]/.test(value);
}

export function authUserFromApi(value: unknown): AuthUser | null {
  if (!isRecord(value)) return null;
  if (!isNonEmptyString(value.id) || !isNonEmptyString(value.username) || !isNonEmptyString(value.email) || value.rol_id !== 2) return null;
  return { id: value.id, username: value.username, email: value.email, rol_id: 2 };
}

export function adaptLoginResponse(response: unknown, status?: number): LoginResult {
  const body = isRecord(response) ? response : null;
  const data = isRecord(body?.data) ? body.data : null;
  const user = authUserFromApi(data?.user);
  if ((status === undefined || (status >= 200 && status < 300)) && body?.ok === true && data && isAuthToken(data.token) && user) {
    return { success: true, token: data.token, user };
  }
  return {
    success: false,
    message: body?.ok === false && isNonEmptyString(body.message)
      ? body.message : 'No se pudo procesar la respuesta del servidor.',
    status,
  };
}
