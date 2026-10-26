import { useState } from "react";
import { StyleSheet } from "react-native";

import { AppButton, AppCard, AppText } from "@/components/ui";
import { Colors, Spacing } from "@/constants/theme";
import type { Perfil } from "../models/perfil.model";
import { CancelacionDatosModal } from "./cancelacion-datos-modal";
import { OposicionDatosModal } from "./oposicion-datos-modal";

export function PrivacidadArco({ perfil }: { perfil: Perfil }) {
  const [solicitudAbierta, setSolicitudAbierta] = useState<"cancelacion" | "oposicion" | null>(null);

  return (
    <>
      <AppCard style={styles.section}>
        <AppText variant="sectionTitle" accessibilityRole="header" style={styles.title}>
          Privacidad y derechos ARCO
        </AppText>
        <AppButton
          label="Solicitar cancelación de datos personales"
          variant="secondary"
          onPress={() => setSolicitudAbierta("cancelacion")}
        />
        <AppButton
          label="Solicitar oposición al tratamiento de datos"
          variant="secondary"
          onPress={() => setSolicitudAbierta("oposicion")}
        />
      </AppCard>
      {solicitudAbierta === "cancelacion" ? <CancelacionDatosModal perfil={perfil} onClose={() => setSolicitudAbierta(null)} /> : null}
      {solicitudAbierta === "oposicion" ? <OposicionDatosModal perfil={perfil} onClose={() => setSolicitudAbierta(null)} /> : null}
    </>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.md },
  title: { color: Colors.primaryGreen },
});
