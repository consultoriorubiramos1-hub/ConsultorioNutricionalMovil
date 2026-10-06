import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui";
import { Colors, Radius, Spacing } from "@/constants/theme";
import type { PerfilTab } from "../models/perfil.model";

const TABS: { key: PerfilTab; label: string }[] = [
  { key: "datos", label: "Datos" },
  { key: "cuenta", label: "Cuenta" },
  { key: "seguridad", label: "Seguridad" },
];

type PerfilTabsProps = {
  activeTab: PerfilTab | null;
  onChange: (tab: PerfilTab) => void;
};

export function PerfilTabs({ activeTab, onChange }: PerfilTabsProps) {
  return (
    <View style={styles.container} accessibilityRole="tablist">
      {TABS.map((tab) => {
        const selected = activeTab === tab.key;

        return (
          <Pressable
            key={tab.key}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(tab.key)}
            style={({ pressed }) => [
              styles.tab,
              selected && styles.selectedTab,
              pressed && styles.pressed,
            ]}
          >
            <AppText
              variant="auxiliary"
              color={selected ? "white" : "text"}
              style={selected ? styles.selectedText : undefined}
            >
              {tab.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  tab: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    backgroundColor: Colors.white,
  },
  selectedTab: {
    borderColor: Colors.headerGreen,
    backgroundColor: Colors.headerGreen,
  },
  selectedText: {
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.8,
  },
});
