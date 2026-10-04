import type { AuthUser } from "../models/auth.model";
import { getToken, removeToken } from "./auth-storage.service";

type AuthMeResponse =
  | {
      ok: true;
      data: AuthUser;
    }
  | {
      ok: false;
      message: string;
    };

const getApiUrl = () => {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;

  if (!apiUrl) {
    return null;
  }

  return apiUrl.replace(/\/$/, "");
};

export async function getCurrentSession(): Promise<AuthUser | null> {
  const token = await getToken();

  if (!token) {
    return null;
  }

  const apiUrl = getApiUrl();

  if (!apiUrl) {
    return null;
  }

  try {
    const response = await fetch(`${apiUrl}/api/mobile/auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    let data: AuthMeResponse;

    try {
      data = (await response.json()) as AuthMeResponse;
    } catch {
      return null;
    }

    if (!response.ok || !data.ok) {
      if (response.status === 401 || response.status === 403) {
        await removeToken();
      }

      return null;
    }

    return data.data;
  } catch {
    return null;
  }
}
