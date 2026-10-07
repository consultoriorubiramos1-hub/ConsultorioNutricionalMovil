import type { Href } from "expo-router";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";

import { AppButton, AppScreen, AppText } from "@/components/ui";
import { Colors, Radius, Spacing } from "@/constants/theme";

const items: { label: string; route: Href }[] = [
  { label: "Inicio", route: "/inicio" },
  { label: "Muro", route: "/muro" },
  { label: "Citas", route: "/citas" },
  { label: "Historial médico", route: "/historial" },
  { label: "Plan alimenticio", route: "/plan-alimenticio" },
  { label: "Mi perfil", route: "/perfil" },
];

interface DashboardMenuProps {
  visible: boolean;
  loggingOut: boolean;
  onClose: () => void;
  onNavigate: (route: Href) => void;
  onLogout: () => void;
}

export function DashboardMenu({
  visible,
  loggingOut,
  onClose,
  onNavigate,
  onLogout,
}: DashboardMenuProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable
          style={styles.backdrop}
          accessibilityRole="button"
          accessibilityLabel="Cerrar menú"
          onPress={onClose}
        />
        <View style={styles.drawer} accessibilityViewIsModal>
          <AppScreen scrollable={false} contentContainerStyle={styles.content}>
            <View style={styles.header}>
              <AppText variant="sectionTitle" style={styles.brand}>
                Rubí Ramos
              </AppText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cerrar menú"
                onPress={onClose}
                style={styles.close}
              >
                <AppText variant="subtitle">×</AppText>
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.navigation}>
              <AppText variant="auxiliary" color="textSecondary">
                Consultorio nutricional
              </AppText>
              {items.map((item) => (
                <Pressable
                  key={item.label}
                  accessibilityRole="button"
                  accessibilityState={{ selected: item.route === "/inicio" }}
                  disabled={loggingOut}
                  onPress={() => onNavigate(item.route)}
                  style={({ pressed }) => [
                    styles.item,
                    item.route === "/inicio" && styles.selected,
                    pressed && styles.pressed,
                  ]}
                >
                  <AppText
                    variant={item.route === "/inicio" ? "sectionTitle" : "body"}
                  >
                    {item.label}
                  </AppText>
                </Pressable>
              ))}
            </ScrollView>
            <AppButton
              label={loggingOut ? "Cerrando sesión…" : "Cerrar sesión"}
              variant="secondary"
              disabled={loggingOut}
              onPress={onLogout}
            />
          </AppScreen>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: "flex-end" },
  backdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: Colors.darkGreen,
    opacity: 0.45,
  },
  drawer: {
    flex: 1,
    width: "88%",
    maxWidth: 360,
    backgroundColor: Colors.background,
  },
  content: { flex: 1, padding: Spacing.md, gap: Spacing.md },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  brand: { color: Colors.headerGreen, flexShrink: 1 },
  close: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  navigation: { gap: Spacing.sm },
  item: { minHeight: 52, padding: Spacing.md, borderRadius: Radius.md },
  selected: {
    backgroundColor: Colors.white,
    borderLeftWidth: 4,
    borderLeftColor: Colors.headerGreen,
  },
  pressed: { opacity: 0.7 },
});
