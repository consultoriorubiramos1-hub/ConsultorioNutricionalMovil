import { StyleSheet, View } from 'react-native';
import { AppCard, AppIcon, AppText } from '@/components/ui';
import { WeightChart } from '@/components/ui/weight-chart';
import { Colors, Spacing } from '@/constants/theme';
import type { FollowUpEvaluation } from '../models/historial.model';
import { formatNumber, formatWeightChange } from '../utils/historial-format';

export function NutritionProgress({ evaluations, patientHeight }: { evaluations: readonly FollowUpEvaluation[]; patientHeight: number | null }) {
  // The API supplies evaluations newest first. Retain that order for summaries.
  const weighted = evaluations.filter((evaluation) => (evaluation.anthropometric?.weight ?? 0) > 0);
  const current = weighted[0]?.anthropometric?.weight;
  const initial = weighted[weighted.length - 1]?.anthropometric?.weight;
  const height = weighted[0]?.anthropometric?.height ?? patientHeight;
  const bmi = current != null && height != null && height > 0 ? current / (height / 100) ** 2 : null;
  const difference = weighted.length > 1 && current != null && initial != null ? current - initial : null;
  const metrics = [
    { label: 'Peso inicial', value: initial == null ? '—' : formatNumber(initial) + ' kg' },
    { label: 'Peso actual', value: current == null ? '—' : formatNumber(current) + ' kg' },
    { label: 'Diferencia de peso', value: difference == null ? '—' : formatWeightChange(difference) },
    { label: 'IMC', value: bmi == null ? '—' : bmi.toFixed(1) + ' kg/m²' },
  ];
  const measurements = weighted.flatMap((evaluation) => evaluation.evaluationDate && evaluation.anthropometric?.weight != null ? [{ date: evaluation.evaluationDate, weight: evaluation.anthropometric.weight }] : []);
  return <View style={styles.section}>
    <AppText variant="sectionTitle" accessibilityRole="header">Mi progreso</AppText>
    <AppText color="textSecondary">Cada evaluación forma parte de tu camino.</AppText>
    <View style={styles.grid}>{metrics.map((metric, index) => <AppCard key={metric.label} style={[styles.metric, { backgroundColor: index % 2 ? '#FFFAF5' : '#F6FAF0' }]}><AppIcon name={index === 3 ? 'chart' : 'weight'} color={index % 2 ? Colors.primaryOrange : Colors.primaryGreen} /><AppText variant="auxiliary" color="textSecondary">{metric.label}</AppText><AppText variant="subtitle" style={styles.value}>{metric.value}</AppText></AppCard>)}</View>
    {difference === null ? <AppText variant="auxiliary" color="textSecondary">La diferencia estará disponible cuando tengas dos mediciones de peso.</AppText> : null}
    <WeightChart measurements={measurements} />
  </View>;
}
const styles = StyleSheet.create({ section: { gap: Spacing.md }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }, metric: { flexBasis: '45%', flexGrow: 1, minWidth: 120, padding: Spacing.md, gap: Spacing.sm }, value: { fontWeight: '700' } });
