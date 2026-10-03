import { StyleSheet } from 'react-native';

import { AppCard, AppScreen, AppText } from '@/components/ui';
import { Spacing } from '@/constants/theme';

export default function CitasScreen() {
  return (
    <AppScreen contentContainerStyle={styles.screen}>
      <AppCard>
        <AppText variant="title">Citas</AppText>
        <AppText color="textSecondary" style={styles.subtitle}>
          Este módulo de citas se implementará posteriormente.
        </AppText>
      </AppCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: { justifyContent: 'center' },
  subtitle: { marginTop: Spacing.sm },
});
