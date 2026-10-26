import { StyleSheet, View } from 'react-native';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { AppText } from './app-text';

export function StatusBadge({ label, tone = 'neutral' }: { label: string; tone?: 'green' | 'orange' | 'red' | 'neutral' }) {
  const palette = { green: [Colors.softGreen, Colors.darkGreen], orange: [Colors.softOrange, Colors.secondaryBrown], red: [Colors.softDanger, Colors.danger], neutral: [Colors.muted, Colors.textSecondary] }[tone];
  return <View style={[styles.badge, { backgroundColor: palette[0] }]}><AppText variant="auxiliary" style={{ color: palette[1] }}>{label}</AppText></View>;
}

const styles = StyleSheet.create({ badge: { alignSelf: 'flex-start', borderRadius: Radius.pill, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs } });
