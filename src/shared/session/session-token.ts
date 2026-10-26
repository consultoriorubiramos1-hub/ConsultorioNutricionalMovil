import {
  getToken,
  removeToken,
  saveToken,
} from "@/modules/auth/services/auth-storage.service";

// Todos los módulos comparten la sesión persistida por el flujo de login.

export async function setSessionToken(token: string | null): Promise<void> {
  const normalized = token?.trim();
  if (normalized) {
    await saveToken(normalized);
  } else {
    await removeToken();
  }
}

export async function getSessionToken(): Promise<string | null> {
  return getToken();
}

export async function clearSessionToken(): Promise<void> {
  await removeToken();
}
