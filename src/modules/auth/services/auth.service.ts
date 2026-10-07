import { adaptLoginResponse } from "../adapters/auth.adapter";
import type {
    LoginApiResponse,
    LoginCredentials,
    LoginResult,
} from "../models/auth.model";

const getApiUrl = () => {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;

  if (!apiUrl) {
    return null;
  }

  return apiUrl.replace(/\/$/, "");
};

export async function login(
  credentials: LoginCredentials,
): Promise<LoginResult> {
  const apiUrl = getApiUrl();

  if (!apiUrl) {
    return {
      success: false,
      message: "No se encontró la configuración del servidor.",
    };
  }

  try {
    const response = await fetch(`${apiUrl}/api/mobile/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: credentials.username,
        password: credentials.password,
      }),
    });

    let data: LoginApiResponse;

    try {
      data = (await response.json()) as LoginApiResponse;
    } catch {
      return {
        success: false,
        message: "El servidor devolvió una respuesta no válida.",
        status: response.status,
      };
    }

    const result = adaptLoginResponse(data, response.status);

    if (result.success) {
      return result;
    }

    switch (response.status) {
      case 400:
        return {
          success: false,
          message: "Verifica los datos ingresados.",
          status: 400,
        };

      case 401:
        return {
          success: false,
          message: "Usuario o contraseña incorrectos.",
          status: 401,
        };

      case 403:
        return {
          success: false,
          message: "Esta aplicación está disponible únicamente para pacientes.",
          status: 403,
        };

      default:
        return {
          success: false,
          message:
            result.message ||
            "No se pudo iniciar sesión. Inténtalo nuevamente.",
          status: response.status,
        };
    }
  } catch {
    return {
      success: false,
      message:
        "No se pudo conectar con el servidor. Verifica tu conexión e inténtalo nuevamente.",
    };
  }
}
