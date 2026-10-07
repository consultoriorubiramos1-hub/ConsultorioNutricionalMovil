import { router } from "expo-router";
import { useState } from "react";

import { saveToken } from "../services/auth-storage.service";
import { login } from "../services/auth.service";

export function useLoginViewModel() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (loading) {
      return;
    }

    const cleanUsername = username.trim();

    if (!cleanUsername) {
      setError("Ingresa tu usuario.");
      return;
    }

    if (!password) {
      setError("Ingresa tu contraseña.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await login({
        username: cleanUsername,
        password,
      });

      if (!result.success) {
        setError(result.message);
        return;
      }

      await saveToken(result.token);

      router.replace("/inicio");
    } catch {
      setError("Ocurrió un problema al iniciar sesión. Inténtalo nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const updateUsername = (value: string) => {
    setUsername(value);

    if (error) {
      setError(null);
    }
  };

  const updatePassword = (value: string) => {
    setPassword(value);

    if (error) {
      setError(null);
    }
  };

  return {
    username,
    password,
    loading,
    error,
    setUsername: updateUsername,
    setPassword: updatePassword,
    login: handleLogin,
  };
}
