import { StyleSheet, View } from "react-native";

import { AppCard, AppIcon, AppText } from "@/components/ui";
import { Colors, Spacing } from "@/constants/theme";
import type { ProgressIndicator } from "../models/historial.model";
import { formatHistoryDate, formatWeightChange } from "../utils/historial-format";

export function ProgressSummary({ indicators, weightDifference }: {
  indicators: ProgressIndicator[];
  weightDifference: number | null;
}) {
  return (
    <View style={styles.section}>
      <AppText variant="sectionTitle" accessibilityRole="header">Mis últimas mediciones</AppText>
      <View style={styles.grid}>
        {indicators.map((indicator, index) => (
          <AppCard key={indicator.label} style={[styles.indicator, { backgroundColor: index % 2 ? '#FFFAF5' : '#F6FAF0' }]}>
            <AppIcon name={index === 0 ? 'weight' : 'chart'} color={index % 2 ? Colors.primaryOrange : Colors.primaryGreen} />
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
