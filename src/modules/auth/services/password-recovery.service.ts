import { isAuthToken, isNonEmptyString, isRecord } from '../adapters/auth.adapter';
import type { ChangePasswordResponse, SendCodeResponse, VerifyCodeResponse, VerifyTokenResponse } from '../models/recovery.model';
import { requestAuthJson } from './auth-request';

async function postJson(path: string, body: Record<string, string>): Promise<Record<string, unknown> | null> {
  const response = await requestAuthJson(path, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return response.ok && isRecord(response.data) ? response.data : null;
}

export async function sendRecoveryCode(username: string): Promise<SendCodeResponse> {
  try {
    const data = await postJson('/api/enviar-codigo', { username });
    if (data?.success === true && isNonEmptyString(data.email)) return { success: true, email: data.email };
  } catch { /* El mensaje público no contiene la respuesta ni el error original. */ }
  return { success: false, error: 'No se pudo enviar el código. Verifica tus datos y vuelve a intentarlo.' };
}

export async function verifyRecoveryCode(username: string, code: string): Promise<VerifyCodeResponse> {
  try {
    const data = await postJson('/api/verificar-codigo', { username, code });
    if (data?.success === true && isAuthToken(data.token)) return { success: true, token: data.token };
    if (data?.success === false && data.tipo === 'expirado') {
      return { success: false, tipo: 'expirado', error: 'El código expiró. Solicita uno nuevo.' };
    }
    if (data?.success === false && data.tipo === 'codigo') {
      return { success: false, tipo: 'codigo', error: 'El código ingresado no es válido.' };
    }
  } catch { /* Nunca propagar mensajes internos del servidor. */ }
  return { success: false, error: 'No se pudo verificar el código. Inténtalo nuevamente.' };
}

export async function verifyRecoveryToken(username: string, token: string): Promise<VerifyTokenResponse> {
  try {
    const data = await postJson('/api/verificar-token', { username, token });
    if (data?.valid === true) return { valid: true };
  } catch { /* La recuperación permanece rechazada ante errores de transporte. */ }
  return { valid: false, error: 'La recuperación no es válida o ha expirado. Solicita un código nuevamente.' };
}

export async function changePassword(username: string, token: string, newPassword: string): Promise<ChangePasswordResponse> {
  try {
    const data = await postJson('/api/cambiar-contrasena', { username, token, nuevaContrasena: newPassword });
    if (data?.success === true) return { success: true };
  } catch { /* No mostrar contraseñas, tokens ni detalles de implementación. */ }
  return { success: false, error: 'No se pudo cambiar la contraseña. Inténtalo nuevamente.' };
}
