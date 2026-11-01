import { authUserFromApi, isAuthToken, isRecord } from '../adapters/auth.adapter';
import type { AuthUser } from '../models/auth.model';
import { requestAuthJson } from './auth-request';
import { getToken, removeToken } from './auth-storage.service';

export async function getCurrentSession(): Promise<AuthUser | null> {
  try {
    const token = await getToken();
    if (!isAuthToken(token)) {
      if (token !== null) await removeToken();
      return null;
    }

    const response = await requestAuthJson('/api/mobile/auth/me', {
      method: 'GET',
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
    });
    if (response.status === 401 || response.status === 403) {
      await removeToken();
      return null;
    }
    if (!response.ok || !isRecord(response.data) || response.data.ok !== true) return null;
    return authUserFromApi(response.data.data);
  } catch {
    return null;
  }
}
