export const AUTH_REQUEST_TIMEOUT_MS = 20_000;

type AuthRequestErrorCode = 'configuration' | 'invalid-response' | 'timeout';

export class AuthRequestError extends Error {
  constructor(public readonly code: AuthRequestErrorCode, public readonly status?: number) {
    super(code);
    this.name = 'AuthRequestError';
  }
}

function isLocalDevelopmentHost(hostname: string): boolean {
  if (['localhost', '127.0.0.1', '[::1]', '10.0.2.2'].includes(hostname)) return true;
  const octets = hostname.split('.').map(Number);
  if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  return octets[0] === 10 ||
    (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
    (octets[0] === 192 && octets[1] === 168);
}

// Release exige HTTPS. HTTP solo se permite en desarrollo hacia una dirección local.
export function getAuthApiUrl(
  value = process.env.EXPO_PUBLIC_API_URL,
  development = typeof __DEV__ !== 'undefined' && __DEV__,
): string | null {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value.trim());
    const validProtocol = url.protocol === 'https:' ||
      (development && url.protocol === 'http:' && isLocalDevelopmentHost(url.hostname));
    if (!validProtocol || url.username || url.password || url.search || url.hash || url.pathname !== '/') return null;
    return url.origin;
  } catch {
    return null;
  }
}

type AuthResponse = { ok: boolean; status: number; data: unknown };

export async function requestAuthJson(path: string, options: RequestInit): Promise<AuthResponse> {
  const baseUrl = getAuthApiUrl();
  if (!baseUrl) throw new AuthRequestError('configuration');

  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new AuthRequestError('timeout'));
    }, AUTH_REQUEST_TIMEOUT_MS);
  });

  const request = async (): Promise<AuthResponse> => {
    const response = await fetch(baseUrl + path, { ...options, signal: controller.signal });
    if (controller.signal.aborted) throw new AuthRequestError('timeout');
    const ok = response.ok === true && response.status >= 200 && response.status < 300;
    // Los rechazos HTTP se procesan por su estado, sin depender de un cuerpo JSON.
    if (!ok) return { ok: false, status: response.status, data: null };
    let data: unknown;
    try {
      data = await response.json();
    } catch {
      throw new AuthRequestError('invalid-response', response.status);
    }
    if (controller.signal.aborted) throw new AuthRequestError('timeout');
    return { ok: true, status: response.status, data };
  };

  try {
    // También limita la espera del cuerpo si el transporte no atiende el aborto.
    return await Promise.race([request(), timeout]);
  } catch (cause) {
    if (controller.signal.aborted) throw new AuthRequestError('timeout');
    throw cause;
  } finally {
    clearTimeout(timer);
  }
}
