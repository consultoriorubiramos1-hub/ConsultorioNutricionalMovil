import { adaptLoginResponse } from '../adapters/auth.adapter';
import type { LoginCredentials, LoginResult } from '../models/auth.model';
import { AuthRequestError, requestAuthJson } from './auth-request';

function failureForStatus(status: number): LoginResult {
  const message = status === 400 ? 'Verifica los datos ingresados.'
    : status === 401 ? 'Usuario o contraseña incorrectos.'
      : status === 403 ? 'Esta aplicación está disponible únicamente para pacientes.'
        : status === 429 ? 'Demasiados intentos. Inténtalo más tarde.'
          : 'No se pudo iniciar sesión. Inténtalo nuevamente.';
  return { success: false, message, status };
}

export async function login(credentials: LoginCredentials): Promise<LoginResult> {
  try {
    const response = await requestAuthJson('/api/mobile/auth/login', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: credentials.username, password: credentials.password }),
    });
    if (!response.ok) return failureForStatus(response.status);
    const result = adaptLoginResponse(response.data, response.status);
    if (result.success) return result;
    // El servidor no determina el texto mostrado en la interfaz de acceso.
    return { success: false, message: 'No se pudo procesar la respuesta del servidor.', status: response.status };
  } catch (cause) {
    if (cause instanceof AuthRequestError) {
      const message = cause.code === 'configuration' ? 'No se encontró una configuración válida del servidor.'
        : cause.code === 'timeout' ? 'El servidor tardó demasiado en responder. Inténtalo nuevamente.'
          : 'El servidor devolvió una respuesta no válida.';
      return { success: false, message, ...(cause.status === undefined ? {} : { status: cause.status }) };
    }
    return { success: false, message: 'No se pudo conectar con el servidor. Verifica tu conexión e inténtalo nuevamente.' };
  }
}
