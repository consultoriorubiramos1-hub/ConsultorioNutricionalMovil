import { Alert, StyleSheet, View } from "react-native";

import { AppButton, AppText } from "@/components/ui";
import { Spacing } from "@/constants/theme";
import type { DatosPerfilForm } from "../models/perfil.model";
import { PerfilField } from "./perfil-field";

type DatosFormProps = {
  value: DatosPerfilForm;
  age: number | null;
  saving: boolean;
  onChange: <K extends keyof DatosPerfilForm>(
    field: K,
    value: DatosPerfilForm[K],
  ) => void;
  onSave: () => Promise<"saved" | "unchanged">;
};

export function DatosForm({
  value,
  age,
  saving,
  onChange,
  onSave,
}: DatosFormProps) {
  const handleSave = async () => {
    try {
      const result = await onSave();
      Alert.alert(
        result === "saved" ? "Datos actualizados" : "Sin cambios",
        result === "saved"
          ? "Tu información personal se actualizó correctamente."
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
        containerStyle={styles.field}
        icon="user"
        editable={!saving}
        label="Nombre"
        value={value.firstName}
        onChangeText={(text) => onChange("firstName", text)}
        autoCapitalize="words"
      />
      <PerfilField
        containerStyle={styles.field}
        icon="user"
        editable={!saving}
        label="Segundo nombre"
        value={value.secondName}
        onChangeText={(text) => onChange("secondName", text)}
        autoCapitalize="words"
        placeholder="Opcional"
      />
      <PerfilField
        containerStyle={styles.field}
        icon="user"
        editable={!saving}
        label="Apellido paterno"
        value={value.firstLastname}
        onChangeText={(text) => onChange("firstLastname", text)}
        autoCapitalize="words"
      />
      <PerfilField
        containerStyle={styles.field}
        icon="user"
        editable={!saving}
        label="Apellido materno"
        value={value.secondLastname}
        onChangeText={(text) => onChange("secondLastname", text)}
        autoCapitalize="words"
      />
      <PerfilField
        containerStyle={styles.fullField}
        icon="calendar"
        editable={!saving}
        label="Fecha de nacimiento"
        value={value.fechaNacimiento}
        onChangeText={(text) => onChange("fechaNacimiento", text)}
        keyboardType="numbers-and-punctuation"
        placeholder="DD/MM/AAAA"
        maxLength={10}
        helper={
          <AppText variant="auxiliary" color="textSecondary">
            Edad: {age ?? "—"} años · calculada automáticamente
          </AppText>
        }
      />
      <PerfilField
        containerStyle={styles.fullField}
        icon="phone"
        editable={!saving}
        label="Teléfono"
        value={value.phone}
        onChangeText={(text) =>
          onChange("phone", text.replace(/\D/g, "").slice(0, 10))
        }
        keyboardType="phone-pad"
        maxLength={10}
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
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  field: { flexBasis: '45%', flexGrow: 1, minWidth: 120 },
  fullField: { width: '100%' },
  actionButton: {
    marginTop: Spacing.sm,
    width: '100%',
  },
});
