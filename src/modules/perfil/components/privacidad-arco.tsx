import { useState } from "react";
import { StyleSheet } from "react-native";

import { AppButton, AppCard, AppText } from "@/components/ui";
import { Colors, Spacing } from "@/constants/theme";
import type { Perfil } from "../models/perfil.model";
import { CancelacionDatosModal } from "./cancelacion-datos-modal";

export function PrivacidadArco({ perfil }: { perfil: Perfil }) {
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      <AppCard style={styles.section}>
        <AppText variant="sectionTitle" accessibilityRole="header" style={styles.title}>
          Privacidad y derechos ARCO
        </AppText>
        <AppButton
          label="Solicitar cancelación de datos personales"
          variant="secondary"
          onPress={() => setAbierto(true)}
        />
      </AppCard>
      {abierto ? <CancelacionDatosModal perfil={perfil} onClose={() => setAbierto(false)} /> : null}
    </>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.md },
  title: { color: Colors.primaryGreen },
});
