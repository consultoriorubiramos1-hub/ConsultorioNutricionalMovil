import { StyleSheet } from 'react-native';

import { AppCard, AppText } from '@/components/ui';
import { Colors, Spacing } from '@/constants/theme';
import type { NutritionProgressCard, WeightProgressStatus } from '../models/historial.model';
import { formatHistoryDate } from '../utils/historial-format';
import { measurementFields } from '../utils/nutrition-measurements';
import { HistoryFields } from './history-fields';

const borderColors: Record<WeightProgressStatus, string> = {
  aligned: Colors.primaryGreen,
  opposed: Colors.danger,
  neutral: Colors.textSecondary,
};

export function FollowUpCard({ measurement, progress }: NutritionProgressCard) {
  const date = formatHistoryDate(measurement.evaluationDate);
  return (
    <AppCard style={[styles.card, { borderColor: borderColors[progress.status] }]}>
      <AppText variant="sectionTitle" accessibilityRole="header" accessibilityLabel={date + '. ' + progress.description}>{date}</AppText>
      <HistoryFields fields={measurementFields(measurement)} compact />
      <AppText variant="auxiliary" color="textSecondary">{progress.label}</AppText>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: { padding: Spacing.md, gap: Spacing.md, borderWidth: 2 },
});
