import { Image } from 'expo-image';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';
import { AppIcon } from './app-icon';

export function BrandLogo({ large = false }: { large?: boolean }) {
  return <Image source={require('../../../assets/images/logo-rubi.png')} contentFit="contain" contentPosition="left center" accessibilityLabel="Rubí Ramos Nutrióloga" accessible style={[styles.logo, large && styles.largeLogo]} />;
}

export function AppHeader({ onMenuPress, onBack, expanded, disabled, style }: { onMenuPress?: () => void; onBack?: () => void; expanded?: boolean; disabled?: boolean; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.header, style]}>
      {onBack ? <Pressable accessibilityRole="button" accessibilityLabel="Volver" onPress={onBack} disabled={disabled} style={styles.button}><AppIcon name="back" /></Pressable> : null}
      <View style={styles.brand}><BrandLogo /></View>
      {onMenuPress ? <Pressable accessibilityRole="button" accessibilityLabel="Abrir menú de navegación" accessibilityState={{ expanded, disabled }} disabled={disabled} onPress={onMenuPress} style={({ pressed }) => [styles.button, pressed && styles.pressed]}><AppIcon name="menu" /></Pressable> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { width: '100%', maxWidth: 560, alignSelf: 'center', minHeight: 88, paddingHorizontal: Spacing.md + 4, paddingVertical: Spacing.sm, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.white },
  brand: { flex: 1 },
  logo: { width: '100%', maxWidth: 216, height: 58 },
  largeLogo: { maxWidth: 300, height: 84, alignSelf: 'center' },
  button: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.md, backgroundColor: Colors.muted },
  pressed: { opacity: 0.6 },
});
