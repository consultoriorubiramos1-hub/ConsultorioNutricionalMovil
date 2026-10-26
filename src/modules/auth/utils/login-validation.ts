import type { LoginCredentials } from "../models/auth.model";

// Las mismas reglas que utiliza el formulario de inicio de sesión.
export function validateLogin(credentials: LoginCredentials): string | null {
  if (!credentials.username.trim()) return "Ingresa tu usuario.";
  if (!credentials.password) return "Ingresa tu contraseña.";
  return null;
}
