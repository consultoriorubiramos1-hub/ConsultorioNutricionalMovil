import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppButton, AppCard, AppIcon, AppText } from "@/components/ui";
import { Colors, Spacing } from "@/constants/theme";
import type { PatientHistory } from "../models/historial.model";
import { patientFields } from "../utils/historial-presentation";
import { HistoryFields } from "./history-fields";

export function PatientCard({ patient, disabled }: { patient: PatientHistory; disabled: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const fields = patientFields(patient);
  const summaryLabels = ["Edad", "Género", "Estatura"];
  const summary = fields.filter((field) => summaryLabels.includes(field.label));
  const personal = fields.filter((field) => !summaryLabels.includes(field.label));
  return (
    <AppCard style={styles.card}>
      <View style={styles.identity}><View style={styles.avatar}><AppIcon name="user" size={28} color={Colors.primaryGreen} /></View><View style={styles.name}><AppText variant="auxiliary" color="textSecondary">Paciente</AppText><AppText variant="sectionTitle" accessibilityRole="header">{patient.fullName ?? "Nombre no especificado"}</AppText></View></View>
      <HistoryFields fields={summary} compact />
      {personal.length ? (
        <AppButton
          label={expanded ? "Ocultar datos personales" : "Ver datos personales"}
          variant="secondary"
          accessibilityLabel={expanded ? "Ocultar datos personales y de contacto" : "Ver datos personales y de contacto"}
          accessibilityState={{ expanded, disabled }}
          disabled={disabled}
          onPress={() => setExpanded((current) => !current)}
        />
      ) : null}
      {expanded ? <HistoryFields fields={personal} /> : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({ card: { padding: Spacing.md, gap: Spacing.md }, identity: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md }, avatar: { width: 58, height: 58, borderRadius: 29, backgroundColor: Colors.softGreen, alignItems: 'center', justifyContent: 'center' }, name: { flex: 1, gap: Spacing.xs } });
