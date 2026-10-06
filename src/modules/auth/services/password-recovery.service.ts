import type {
    ChangePasswordResponse,
    SendCodeResponse,
    VerifyCodeResponse,
    VerifyTokenResponse,
} from "../models/recovery.model";

const getApiUrl = () => {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;

  if (!apiUrl) {
    return null;
  }

  return apiUrl.replace(/\/$/, "");
};

async function postJson<T>(
  path: string,
  body: Record<string, string>,
): Promise<T> {
  const apiUrl = getApiUrl();

  if (!apiUrl) {
    throw new Error("No se encontró la configuración del servidor.");
  }

  const response = await fetch(`${apiUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  let data: T;

  try {
    data = (await response.json()) as T;
  } catch {
    throw new Error("El servidor devolvió una respuesta no válida.");
  }

  return data;
}

export async function sendRecoveryCode(
  username: string,
): Promise<SendCodeResponse> {
  try {
    return await postJson<SendCodeResponse>("/api/enviar-codigo", {
      username,
    });
  } catch {
    return {
      error:
        "No se pudo enviar el código. Verifica tu conexión e inténtalo nuevamente.",
    };
  }
}

export async function verifyRecoveryCode(
  username: string,
  code: string,
): Promise<VerifyCodeResponse> {
  try {
    return await postJson<VerifyCodeResponse>("/api/verificar-codigo", {
      username,
      code,
    });
  } catch {
    return {
      success: false,
      error:
        "No se pudo verificar el código. Verifica tu conexión e inténtalo nuevamente.",
    };
  }
}

export async function verifyRecoveryToken(
  username: string,
  token: string,
): Promise<VerifyTokenResponse> {
  try {
    return await postJson<VerifyTokenResponse>("/api/verificar-token", {
      username,
      token,
    });
  } catch {
    return {
      valid: false,
      error: "No se pudo verificar la recuperación de contraseña.",
    };
  }
}

export async function changePassword(
  username: string,
  token: string,
  newPassword: string,
): Promise<ChangePasswordResponse> {
  try {
    return await postJson<ChangePasswordResponse>("/api/cambiar-contrasena", {
      username,
      token,
      nuevaContrasena: newPassword,
    });
  } catch {
    return {
      success: false,
      error:
        "No se pudo cambiar la contraseña. Verifica tu conexión e inténtalo nuevamente.",
    };
  }
}
