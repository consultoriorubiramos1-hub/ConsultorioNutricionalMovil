import type { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, type ScrollViewProps, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Spacing } from '@/constants/theme';

type AppScreenProps = PropsWithChildren<
  ScrollViewProps & {
    scrollable?: boolean;
  }
>;

export function AppScreen({ children, contentContainerStyle, scrollable = true, ...props }: AppScreenProps) {
  const content = scrollable ? (
    <ScrollView
      contentContainerStyle={[styles.content, contentContainerStyle]}
      keyboardShouldPersistTaps="handled"
      {...props}>
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, contentContainerStyle]}>{children}</View>
  );

  return <SafeAreaView style={styles.safeArea}>{content}</SafeAreaView>;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flexGrow: 1,
    padding: Spacing.lg,
  },
});
