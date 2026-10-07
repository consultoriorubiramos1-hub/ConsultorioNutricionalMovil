import { useState } from "react";

import type { RecoveryStep } from "../models/recovery.model";
import {
    changePassword,
    sendRecoveryCode,
    verifyRecoveryCode,
    verifyRecoveryToken,
} from "../services/password-recovery.service";

const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[ !"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]).{8,}$/;

export function usePasswordRecoveryViewModel() {
  const [step, setStep] = useState<RecoveryStep>("username");

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

  const [recoveryToken, setRecoveryToken] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => {
    if (error) {
      setError(null);
    }
  };

  const updateUsername = (value: string) => {
    setUsername(value);
    clearError();
  };

  const updateCode = (value: string) => {
    setCode(value.replace(/\D/g, "").slice(0, 6));
    clearError();
  };

  const updateNewPassword = (value: string) => {
    setNewPassword(value);
    clearError();
  };

  const updateConfirmPassword = (value: string) => {
    setConfirmPassword(value);
    clearError();
  };

  const handleSendCode = async () => {
    if (loading) {
      return;
    }

    const cleanUsername = username.trim();

    if (!cleanUsername) {
      setError("Ingresa tu usuario.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await sendRecoveryCode(cleanUsername);

      if (result.success !== true) {
        setError(
          result.error || "No se pudo enviar el código de recuperación.",
        );
        return;
      }

      setUsername(cleanUsername);
      setEmail(result.email);
      setStep("code");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (loading) {
      return;
    }

    const cleanCode = code.trim();

    if (!cleanCode) {
      setError("Ingresa el código de verificación.");
      return;
    }

    if (!/^\d{6}$/.test(cleanCode)) {
      setError("El código debe contener 6 dígitos.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await verifyRecoveryCode(username, cleanCode);

      if (!result.success) {
        setError(result.error || "El código ingresado no es válido.");
        return;
      }

      setRecoveryToken(result.token);
      setStep("password");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (loading) {
      return;
    }

    if (!newPassword) {
      setError("Ingresa tu nueva contraseña.");
      return;
    }

    if (!PASSWORD_REGEX.test(newPassword)) {
      setError(
        "La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial.",
      );
      return;
    }

    if (!confirmPassword) {
      setError("Confirma tu nueva contraseña.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (!recoveryToken) {
      setError(
        "La recuperación de contraseña no es válida. Solicita un código nuevamente.",
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const tokenResult = await verifyRecoveryToken(username, recoveryToken);

      if (!tokenResult.valid) {
        setError(
          tokenResult.error ||
            "El proceso de recuperación expiró. Solicita un nuevo código.",
        );
        return;
      }

      const result = await changePassword(username, recoveryToken, newPassword);

      if (!result.success) {
        setError(result.error || "No se pudo cambiar la contraseña.");
        return;
      }

      setCode("");
      setRecoveryToken("");
      setNewPassword("");
      setConfirmPassword("");

      setStep("success");
    } finally {
      setLoading(false);
    }
  };

  const restart = () => {
    setStep("username");
    setUsername("");
    setEmail("");
    setCode("");
    setRecoveryToken("");
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
  };

  return {
    step,

    username,
    email,
    code,
    newPassword,
    confirmPassword,

    loading,
    error,

    setUsername: updateUsername,
    setCode: updateCode,
    setNewPassword: updateNewPassword,
    setConfirmPassword: updateConfirmPassword,

    sendCode: handleSendCode,
    verifyCode: handleVerifyCode,
    changePassword: handleChangePassword,

    restart,
  };
}
