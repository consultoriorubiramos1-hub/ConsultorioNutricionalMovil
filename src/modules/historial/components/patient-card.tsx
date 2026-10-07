import { useState } from "react";
import { StyleSheet } from "react-native";

import { AppButton, AppCard, AppText } from "@/components/ui";
import { Spacing } from "@/constants/theme";
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
      <AppText variant="auxiliary" color="textSecondary">Mis datos</AppText>
      <AppText variant="sectionTitle" accessibilityRole="header">{patient.fullName ?? "Nombre no especificado"}</AppText>
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

const styles = StyleSheet.create({ card: { padding: Spacing.md, gap: Spacing.md } });
