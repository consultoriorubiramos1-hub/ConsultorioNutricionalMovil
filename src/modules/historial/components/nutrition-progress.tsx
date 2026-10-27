import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { WeightChart } from '@/components/ui/weight-chart';
import { Spacing } from '@/constants/theme';
import { formatHistoryDate, formatWeightChange } from '../utils/historial-format';
import type { DescriptiveWeightEvolution } from '../utils/nutrition-measurements';

export function NutritionProgress({ evolution }: { evolution: DescriptiveWeightEvolution }) {
  return (
    <View style={styles.section}>
      <WeightChart measurements={evolution.measurements} />
      {evolution.difference !== null ? (
        <AppText color="textSecondary">
          {`Cambio de peso del ${formatHistoryDate(evolution.firstDate)} al ${formatHistoryDate(evolution.latestDate)}: ${formatWeightChange(evolution.difference)}.`}
        </AppText>
      ) : (
        <AppText variant="auxiliary" color="textSecondary">
          La comparación requiere pesos válidos en fechas distintas y una sola medición en cada fecha de los extremos.
        </AppText>
      )}
      <AppText variant="auxiliary" color="textSecondary">
        La gráfica y la diferencia describen tus registros; no califican tu estado de salud ni constituyen un diagnóstico.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({ section: { gap: Spacing.md } });
