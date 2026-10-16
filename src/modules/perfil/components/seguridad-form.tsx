import { useMemo, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";

import { AppButton, AppText } from "@/components/ui";
import { Spacing } from "@/constants/theme";
import { PerfilField } from "./perfil-field";

export function SeguridadForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const validationMessage = useMemo(() => {
    if (!currentPassword || !newPassword || !confirmPassword) return null;
    if (newPassword.length < 8)
      return "La nueva contraseña debe tener al menos 8 caracteres.";
    if (newPassword !== confirmPassword)
      return "Las contraseñas nuevas no coinciden.";
    return null;
  }, [confirmPassword, currentPassword, newPassword]);

  const handleUpdate = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert(
        "Datos incompletos",
        "Completa los tres campos de contraseña.",
      );
      return;
    }

    if (validationMessage) {
      Alert.alert("Revisa la contraseña", validationMessage);
      return;
    }

    Alert.alert(
      "Cambio de contraseña no disponible",
      "Por el momento, utiliza la opción de recuperar contraseña en la pantalla de inicio de sesión.",
    );
  };

  return (
    <View style={styles.form}>
      <PerfilField
        label="Contraseña actual"
        value={currentPassword}
        onChangeText={setCurrentPassword}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
      />
      <PerfilField
        label="Nueva contraseña"
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
      />
      <PerfilField
        label="Confirmar nueva contraseña"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        helper={
          validationMessage ? (
            <AppText variant="auxiliary" style={styles.errorText}>
              {validationMessage}
            </AppText>
          ) : null
        }
      />

      <AppButton
        label="Actualizar contraseña"
        onPress={handleUpdate}
        style={styles.actionButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: Spacing.md,
  },
  actionButton: {
    marginTop: Spacing.sm,
  },
  errorText: {
    color: "#A13D3D",
  },
});
