import { StyleSheet, View } from "react-native";

import { AppCard, AppText } from "@/components/ui";
import { Spacing } from "@/constants/theme";
import type { ProgressIndicator } from "../models/historial.model";
import { formatHistoryDate, formatWeightChange } from "../utils/historial-format";

export function ProgressSummary({ indicators, weightDifference }: { indicators: ProgressIndicator[]; weightDifference: number | null }) {
  if (!indicators.length && weightDifference === null) return null;
  return (
    <View style={styles.section}>
      <AppText variant="sectionTitle" accessibilityRole="header">Mis últimas mediciones</AppText>
      <View style={styles.grid}>
        {indicators.map((indicator) => (
          <AppCard key={indicator.label} style={styles.indicator}>
            <AppText variant="auxiliary" color="textSecondary">{indicator.label}</AppText>
            <AppText variant="sectionTitle">{indicator.value}</AppText>
            <AppText variant="auxiliary" color="textSecondary">{formatHistoryDate(indicator.evaluationDate)}</AppText>
          </AppCard>
        ))}
      </View>
      {weightDifference !== null ? (
        <AppCard style={styles.change}>
          <AppText color="textSecondary">Cambio desde el primer registro: {formatWeightChange(weightDifference)}</AppText>
        </AppCard>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.md },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  indicator: { flexBasis: "47%", flexGrow: 1, minWidth: 120, padding: Spacing.md, gap: Spacing.sm },
  change: { padding: Spacing.md },
});
