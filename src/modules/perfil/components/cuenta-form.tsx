import { Alert, StyleSheet, View } from "react-native";

import { AppButton } from "@/components/ui";
import { Colors, Spacing } from "@/constants/theme";
import type { CuentaPerfilForm } from "../models/perfil.model";
import { PerfilField } from "./perfil-field";

type CuentaFormProps = {
  value: CuentaPerfilForm;
  saving: boolean;
  onChange: <K extends keyof CuentaPerfilForm>(
    field: K,
    value: CuentaPerfilForm[K],
  ) => void;
  onSave: () => Promise<"saved" | "unchanged">;
};

export function CuentaForm({
  value,
  saving,
  onChange,
  onSave,
}: CuentaFormProps) {
  const handleSave = async () => {
    try {
      const result = await onSave();
      Alert.alert(
        result === "saved" ? "Cuenta actualizada" : "Sin cambios",
        result === "saved"
          ? "Los datos de tu cuenta se actualizaron correctamente."
          : "No hay cambios pendientes por guardar.",
      );
    } catch (cause) {
      Alert.alert(
        "No se pudo guardar",
        cause instanceof Error ? cause.message : "Inténtalo nuevamente.",
      );
    }
  };

  return (
    <View style={styles.form}>
      <PerfilField
        label="Nombre de usuario"
        value={value.username}
        onChangeText={(text) => onChange("username", text)}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <PerfilField
        label="Correo electrónico"
        value={value.email}
        onChangeText={(text) => onChange("email", text)}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
      />

      <AppButton
        label={saving ? "Guardando..." : "Guardar cambios"}
        disabled={saving}
        onPress={() => void handleSave()}
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
    backgroundColor: Colors.primaryOrange,
  },
});
