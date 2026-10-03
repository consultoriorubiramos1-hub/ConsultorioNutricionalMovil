import { StyleSheet } from 'react-native';

import { AppCard, AppScreen, AppText } from '@/components/ui';
import { Spacing } from '@/constants/theme';

export default function HistorialScreen() {
  return (
    <AppScreen contentContainerStyle={styles.screen}>
      <AppCard>
        <AppText variant="title">Historial médico</AppText>
        <AppText color="textSecondary" style={styles.subtitle}>
          Este módulo de historial médico se implementará posteriormente.
        </AppText>
      </AppCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: { justifyContent: 'center' },
  subtitle: { marginTop: Spacing.sm },
});
