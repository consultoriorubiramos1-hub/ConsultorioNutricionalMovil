import { StyleSheet, View } from "react-native";

import { AppButton, AppCard, AppText } from "@/components/ui";
import { Colors, Spacing } from "@/constants/theme";
import type { FollowUpEvaluation } from "../models/historial.model";
import { formatHistoryDate } from "../utils/historial-format";
import { evaluationSections, evaluationSummary } from "../utils/historial-presentation";
import { HistoryFields } from "./history-fields";

interface FollowUpCardProps {
  evaluation: FollowUpEvaluation;
  expanded: boolean;
  disabled: boolean;
  onToggle: () => void;
}

export function FollowUpCard({ evaluation, expanded, disabled, onToggle }: FollowUpCardProps) {
  const date = formatHistoryDate(evaluation.evaluationDate);
  const summary = evaluationSummary(evaluation);
  const details = expanded ? evaluationSections(evaluation) : [];
  return (
    <AppCard style={styles.card}>
      <AppText variant="sectionTitle" accessibilityRole="header">{date}</AppText>
      {summary.length ? <HistoryFields fields={summary} compact /> : (
        <AppText variant="auxiliary" color="textSecondary">Consulta los detalles registrados en esta evaluación.</AppText>
      )}
      <AppButton
        label={expanded ? "Ocultar detalles" : "Ver detalles"}
        variant="secondary"
        accessibilityLabel={(expanded ? "Ocultar detalles de la evaluación del " : "Ver detalles de la evaluación del ") + date}
        accessibilityState={{ expanded, disabled }}
        disabled={disabled}
        onPress={onToggle}
      />
      {expanded ? (
        <View style={styles.details}>
          {evaluation.anthropometric ? <AppText variant="sectionTitle" accessibilityRole="header">Antropometría</AppText> : null}
          {details.length ? details.map((section) => (
            <View key={section.title} style={styles.detailSection}>
              <AppText variant="sectionTitle" accessibilityRole="header">{section.title}</AppText>
              <HistoryFields fields={section.fields} />
            </View>
          )) : <AppText color="textSecondary">Esta evaluación aún no incluye información detallada.</AppText>}
        </View>
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: { padding: Spacing.md, gap: Spacing.md },
  details: { gap: Spacing.lg },
  detailSection: { gap: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.md },
});
