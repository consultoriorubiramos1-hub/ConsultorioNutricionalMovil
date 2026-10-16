import { Pressable, StyleSheet, View } from "react-native";

import { AppIcon, AppText } from "@/components/ui";
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
            <AppIcon name={tab.key === 'datos' ? 'user' : tab.key === 'cuenta' ? 'settings' : 'shield'} size={19} color={selected ? Colors.primaryGreen : Colors.textSecondary} />
            <AppText
              variant="auxiliary"
              color="textSecondary"
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
    padding: 4,
    borderRadius: Radius.pill,
    backgroundColor: Colors.muted,
  },
  tab: {
    flex: 1,
    minHeight: 44,
    flexDirection: 'row',
    gap: 6,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.pill,
  },
  selectedTab: {
    backgroundColor: Colors.softGreen,
  },
  selectedText: {
    fontWeight: "700",
    color: Colors.primaryGreen,
  },
  pressed: {
    opacity: 0.8,
  },
});
