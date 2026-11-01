import { login } from '@/modules/auth/services/auth.service';
import { AUTH_REQUEST_TIMEOUT_MS, getAuthApiUrl } from '@/modules/auth/services/auth-request';
import { getCurrentSession } from '@/modules/auth/services/auth-session.service';
import { getToken, removeToken } from '@/modules/auth/services/auth-storage.service';
import { changePassword, sendRecoveryCode, verifyRecoveryCode, verifyRecoveryToken } from '@/modules/auth/services/password-recovery.service';

jest.mock('@/modules/auth/services/auth-storage.service', () => ({
  getToken: jest.fn(),
  removeToken: jest.fn().mockResolvedValue(undefined),
}));

const user = { id: 'fixture-user', username: 'paciente', email: 'test@example.test', rol_id: 2 };
const credentials = { username: 'paciente', password: 'fixture-password' };
const validLogin = { ok: true, data: { token: 'fixture-token', user } };
const reply = (data: unknown, status = 200): Response => ({
  ok: status >= 200 && status < 300,
  status,
  json: jest.fn().mockResolvedValue(data),
}) as unknown as Response;
const fetchMock = () => global.fetch as jest.MockedFunction<typeof fetch>;

describe('Seguridad de autenticación y recuperación', () => {
  let originalUrl: string | undefined;

  beforeEach(() => {
    originalUrl = process.env.EXPO_PUBLIC_API_URL;
    process.env.EXPO_PUBLIC_API_URL = 'https://api.example.test';
    jest.mocked(getToken).mockResolvedValue('fixture-token');
  });

  afterEach(() => {
    if (originalUrl === undefined) delete process.env.EXPO_PUBLIC_API_URL;
    else process.env.EXPO_PUBLIC_API_URL = originalUrl;
    jest.useRealTimers();
  });

  test.each([400, 401, 403, 429, 500])('rechaza HTTP %s aunque el cuerpo afirme éxito de login', async (status) => {
    fetchMock().mockResolvedValueOnce(reply(validLogin, status));
    expect(await login(credentials)).toMatchObject({ success: false, status });
  });

  test.each([401, 403])('limpia el token ante HTTP %s sin depender de que el cuerpo sea JSON', async (status) => {
    const response = reply(null, status);
    jest.mocked(response.json).mockRejectedValueOnce(new Error('HTML del proxy'));
    fetchMock().mockResolvedValueOnce(response);
    await expect(getCurrentSession()).resolves.toBeNull();
    expect(removeToken).toHaveBeenCalledTimes(1);
  });

  test('no envía credenciales a un servidor HTTP público', async () => {
    process.env.EXPO_PUBLIC_API_URL = 'http://api.example.test';
    fetchMock().mockResolvedValueOnce(reply(validLogin));
    expect(await login(credentials)).toMatchObject({ success: false });
    expect(fetchMock()).not.toHaveBeenCalled();
  });

  test('no muestra detalles internos enviados en un error del servidor', async () => {
    fetchMock().mockResolvedValueOnce(reply({ ok: false, message: 'SQLSTATE fixture-secret stack trace' }, 500));
    const result = await login(credentials);
    expect(result).toMatchObject({ success: false, status: 500 });
    expect(JSON.stringify(result)).not.toMatch(/SQLSTATE|fixture-secret|stack trace/);
  });

  test.each([
    ['enviar código', () => sendRecoveryCode('paciente'), { success: true, email: 'test@example.test' }, { success: true }],
    ['verificar código', () => verifyRecoveryCode('paciente', '123456'), { success: true, token: 'fixture-recovery-token' }, { success: true }],
    ['verificar token', () => verifyRecoveryToken('paciente', 'fixture-recovery-token'), { valid: true }, { valid: true }],
    ['cambiar contraseña', () => changePassword('paciente', 'fixture-recovery-token', 'Fixture-Password1!'), { success: true }, { success: true }],
  ] as const)('recuperación: %s rechaza éxito aparente con HTTP 500', async (_name, call, payload, success) => {
    fetchMock().mockResolvedValueOnce(reply(payload, 500));
    expect(await call()).not.toMatchObject(success);
  });

  test.each([
    ['enviar código', () => sendRecoveryCode('paciente'), { success: true, email: 'test@example.test' }],
    ['verificar código', () => verifyRecoveryCode('paciente', '123456'), { success: true, token: 'fixture-recovery-token' }],
    ['verificar token', () => verifyRecoveryToken('paciente', 'fixture-recovery-token'), { valid: true }],
    ['cambiar contraseña', () => changePassword('paciente', 'fixture-recovery-token', 'Fixture-Password1!'), { success: true }],
  ] as const)('recuperación: %s conserva el contrato válido de éxito', async (_name, call, payload) => {
    fetchMock().mockResolvedValueOnce(reply(payload));
    expect(await call()).toEqual(payload);
  });

  test.each([
    ['enviar código', () => sendRecoveryCode('paciente'), { success: true, email: null }, { success: true }],
    ['verificar código', () => verifyRecoveryCode('paciente', '123456'), { success: true, token: ' ' }, { success: true }],
    ['verificar token', () => verifyRecoveryToken('paciente', 'fixture-recovery-token'), { valid: 'true' }, { valid: true }],
    ['cambiar contraseña', () => changePassword('paciente', 'fixture-recovery-token', 'Fixture-Password1!'), { success: 'true' }, { success: true }],
  ] as const)('recuperación: %s rechaza campos ausentes o tipos incorrectos', async (_name, call, payload, success) => {
    fetchMock().mockResolvedValueOnce(reply(payload));
    expect(await call()).not.toMatchObject(success);
  });

  test.each([
    'https://usuario:fixture-password@api.example.test',
    'https://api.example.test/?token=fixture-token',
    'https://api.example.test/api/mobile',
  ])('rechaza configuración que podría enviar credenciales a una URL no válida: %s', async (url) => {
    process.env.EXPO_PUBLIC_API_URL = url;
    fetchMock().mockResolvedValueOnce(reply(validLogin));
    expect(await login(credentials)).toMatchObject({ success: false });
    expect(fetchMock()).not.toHaveBeenCalled();
  });

  test('HTTP local solamente se admite en desarrollo, nunca en Release', () => {
    expect(getAuthApiUrl('http://10.0.2.2:3000', true)).toBe('http://10.0.2.2:3000');
    expect(getAuthApiUrl('http://10.0.2.2:3000', false)).toBeNull();
    expect(getAuthApiUrl('https://api.example.test/', false)).toBe('https://api.example.test');
  });

  test.each([
    { ...validLogin, ok: 'true' },
    { ok: true, data: { token: ' ', user } },
  ])('login rechaza banderas no booleanas y tokens vacíos', async (payload) => {
    fetchMock().mockResolvedValueOnce(reply(payload));
    expect(await login(credentials)).toMatchObject({ success: false });
  });

  test('sesión válida selecciona únicamente los datos de identidad previstos', async () => {
    fetchMock().mockResolvedValueOnce(reply({ ok: true, data: { ...user, clinicalNotes: 'fixture-private' } }));
    expect(await getCurrentSession()).toEqual(user);
    expect(removeToken).not.toHaveBeenCalled();
  });

  test('sesión rechaza una respuesta de usuario con un rol distinto', async () => {
    fetchMock().mockResolvedValueOnce(reply({ ok: true, data: { ...user, rol_id: 1 } }));
    expect(await getCurrentSession()).toBeNull();
  });

  test.each(['petición', 'cuerpo JSON'])('limita una espera indefinida durante la %s y libera el temporizador', async (stage) => {
    jest.useFakeTimers();
    if (stage === 'petición') fetchMock().mockImplementationOnce(() => new Promise(() => {}));
    else {
      const response = reply(null);
      jest.mocked(response.json).mockImplementationOnce(() => new Promise(() => {}));
      fetchMock().mockResolvedValueOnce(response);
    }
    const pending = login(credentials);
    await jest.advanceTimersByTimeAsync(AUTH_REQUEST_TIMEOUT_MS);
    expect(await pending).toMatchObject({ success: false, message: expect.stringContaining('tardó') });
    expect(fetchMock().mock.calls[0][1]?.signal?.aborted).toBe(true);
    expect(jest.getTimerCount()).toBe(0);
  });
});
