import type { PropsWithChildren } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { AppCard, AppIcon, AppText } from "@/components/ui";
import { Colors, Spacing } from "@/constants/theme";

interface HistoryAccordionProps {
  title: string;
  expanded: boolean;
  disabled: boolean;
  onToggle: () => void;
}

export function HistoryAccordion({ title, expanded, disabled, onToggle, children }: PropsWithChildren<HistoryAccordionProps>) {
  return (
    <AppCard style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ expanded, disabled }}
        disabled={disabled}
        onPress={onToggle}
        style={({ pressed }) => [styles.header, pressed && styles.pressed]}
      >
        <View style={styles.icon}><AppIcon name="history" color={Colors.primaryGreen} size={22} /></View>
        <AppText variant="sectionTitle" style={styles.title}>{title}</AppText>
        <AppIcon name={expanded ? 'close' : 'down'} size={18} />
      </Pressable>
      {expanded ? <View style={styles.content}>{children}</View> : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: { padding: 0, overflow: "hidden" },
  header: {
    minHeight: 64, padding: Spacing.md, flexDirection: "row",
    alignItems: "center", justifyContent: "space-between", gap: Spacing.md,
  },
  title: { flex: 1 },
  icon: { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.softGreen, alignItems: 'center', justifyContent: 'center' },
  content: { padding: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border },
  pressed: { opacity: 0.7 },
});
