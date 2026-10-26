import { StyleSheet, View } from "react-native";

import { AppButton, AppCard, AppText } from "@/components/ui";
import { Colors, Spacing } from "@/constants/theme";
import type { EvaluationProgressIndicator, FollowUpEvaluation, WeightProgressStatus } from "../models/historial.model";
import { formatHistoryDate } from "../utils/historial-format";
import { evaluationSections, evaluationSummary } from "../utils/historial-presentation";
import { HistoryFields } from "./history-fields";

interface FollowUpCardProps {
  evaluation: FollowUpEvaluation;
  progress: EvaluationProgressIndicator;
  expanded: boolean;
  disabled: boolean;
  onToggle: () => void;
}

const borderColors: Record<WeightProgressStatus, string> = {
  aligned: Colors.primaryGreen,
  opposed: Colors.danger,
  neutral: Colors.textSecondary,
};

export function FollowUpCard({ evaluation, progress, expanded, disabled, onToggle }: FollowUpCardProps) {
  const date = formatHistoryDate(evaluation.evaluationDate);
  const summary = evaluationSummary(evaluation);
  const details = expanded ? evaluationSections(evaluation) : [];
  return (
    <AppCard style={[styles.card, { borderColor: borderColors[progress.status] }]}>
      <AppText variant="sectionTitle" accessibilityRole="header" accessibilityLabel={date + ". " + progress.description}>{date}</AppText>
      {summary.length ? <HistoryFields fields={summary} compact /> : (
        <AppText variant="auxiliary" color="textSecondary">Consulta los detalles registrados en esta evaluación.</AppText>
      )}
      <AppText variant="auxiliary" color="textSecondary">{progress.label}</AppText>
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
          <AppText variant="auxiliary" color="textSecondary">{progress.description}</AppText>
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
  card: { padding: Spacing.md, gap: Spacing.md, borderWidth: 2 },
  details: { gap: Spacing.lg },
  detailSection: { gap: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.md },
});
