import type { PropsWithChildren } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { AppCard, AppText } from "@/components/ui";
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
        <AppText variant="sectionTitle" style={styles.title}>{title}</AppText>
        <AppText variant="subtitle" accessible={false}>{expanded ? "−" : "+"}</AppText>
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
  content: { padding: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border },
  pressed: { opacity: 0.7 },
});
