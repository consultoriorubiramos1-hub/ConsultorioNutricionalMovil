/**
 * Puente mínimo de sesión para integrar módulos mientras el flujo de
 * autenticación se encuentra en otra rama.
 */
let sessionToken: string | null = null;

export async function setSessionToken(token: string | null): Promise<void> {
  const normalized = token?.trim();
  sessionToken = normalized ? normalized : null;
}

export async function getSessionToken(): Promise<string | null> {
  return sessionToken;
}

export async function clearSessionToken(): Promise<void> {
  sessionToken = null;
}
