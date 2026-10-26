import { adaptLoginResponse } from "@/modules/auth/adapters/auth.adapter";
import type { LoginApiResponse } from "@/modules/auth/models/auth.model";
import { validateLogin } from "@/modules/auth/utils/login-validation";

const user = { id: "fixture-user", username: "paciente-prueba", email: "test@example.test", rol_id: 2 as const };

describe("Autenticación: reglas existentes del formulario y adapter", () => {
  test.each(["", "   "])("rechaza usuario vacío: %j", (username) => {
    expect(validateLogin({ username, password: "fixture" })).toBe("Ingresa tu usuario.");
  });
  test("exige contraseña y acepta el usuario con espacios para su normalización", () => {
    expect(validateLogin({ username: " paciente ", password: "" })).toBe("Ingresa tu contraseña.");
    expect(validateLogin({ username: " paciente ", password: "fixture" })).toBeNull();
  });
  test("transforma una respuesta válida de paciente", () => {
    expect(adaptLoginResponse({ ok: true, data: { token: "fixture-token", user } })).toEqual({ success: true, token: "fixture-token", user });
  });
  test.each([
    { ok: true, data: { token: 123, user } },
    { ok: true, data: { token: "fixture", user: { ...user, rol_id: 1 } } },
    { ok: true, data: { token: "fixture", user: { ...user, id: null } } },
    { ok: true },
  ])("rechaza respuestas incompletas o de otro rol", (body) => {
    expect(adaptLoginResponse(body as LoginApiResponse, 200).success).toBe(false);
  });
  test("conserva el error y estado de una respuesta inválida", () => {
    expect(adaptLoginResponse({ ok: false, message: "Datos inválidos" }, 401)).toEqual({ success: false, message: "Datos inválidos", status: 401 });
  });
});
