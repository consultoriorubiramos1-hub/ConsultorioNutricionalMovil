import type { Href } from 'expo-router';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppButton, AppIcon, AppScreen, AppText, BrandLogo, type IconName } from '@/components/ui';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';

const items: { label: string; route: Href; icon: IconName }[] = [
  { label: 'Inicio', route: '/inicio', icon: 'home' },
  { label: 'Muro', route: '/muro', icon: 'wall' },
  { label: 'Citas', route: '/citas', icon: 'calendar' },
  { label: 'Historial médico', route: '/historial', icon: 'history' },
  { label: 'Plan alimenticio', route: '/plan-alimenticio', icon: 'fork' },
  { label: 'Mi perfil', route: '/perfil', icon: 'user' },
];

interface DashboardMenuProps {
  activeRoute?: Href; visible: boolean; loggingOut: boolean;
  onClose: () => void; onNavigate: (route: Href) => void; onLogout: () => void;
}

export function DashboardMenu({ activeRoute = '/inicio', visible, loggingOut, onClose, onNavigate, onLogout }: DashboardMenuProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} accessibilityRole="button" accessibilityLabel="Cerrar menú" onPress={onClose} />
        <View style={styles.drawer} accessibilityViewIsModal>
          <AppScreen scrollable={false} contentContainerStyle={styles.content}>
            <View style={styles.header}>
              <View style={styles.brand}><BrandLogo /></View>
              <Pressable accessibilityRole="button" accessibilityLabel="Cerrar menú" onPress={onClose} style={styles.close}><AppIcon name="close" size={20} /></Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.navigation} showsVerticalScrollIndicator={false}>
              {items.map((item) => {
                const selected = item.route === activeRoute;
                return (
                  <Pressable key={item.label} accessibilityRole="button" accessibilityLabel={item.route === '/muro' ? 'Muro informativo' : item.label} accessibilityState={{ selected, disabled: loggingOut }} disabled={loggingOut}
                    onPress={() => { if (selected) onClose(); else onNavigate(item.route); }}
                    style={({ pressed }) => [styles.item, selected && styles.selected, pressed && styles.pressed]}>
                    <View style={[styles.icon, selected && styles.selectedIcon]}><AppIcon name={item.icon} color={selected ? Colors.primaryGreen : Colors.textSecondary} /></View>
                    <AppText style={[styles.label, selected && styles.selectedText]}>{item.label}</AppText>
                    <AppIcon name="chevron" size={17} color={selected ? Colors.primaryGreen : Colors.textSecondary} />
                  </Pressable>
                );
              })}
              <View style={styles.footer}><AppButton label={loggingOut ? 'Cerrando sesión…' : 'Cerrar sesión'} variant="secondary" disabled={loggingOut} onPress={onLogout} /></View>
            </ScrollView>
            <AppText variant="auxiliary" color="textSecondary" style={styles.caption}>Pequeños hábitos, grandes cambios.</AppText>
          </AppScreen>
        </View>
      </View>
    </Modal>
  );
}
const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: 'flex-end' },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(16,24,39,0.42)' },
  drawer: { flex: 1, width: '87%', maxWidth: 360, backgroundColor: Colors.white, borderTopLeftRadius: 28, borderBottomLeftRadius: 28, overflow: 'hidden' },
  content: { flex: 1, padding: Spacing.md, gap: Spacing.lg, backgroundColor: Colors.white },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, paddingTop: Spacing.md, paddingBottom: Spacing.lg },
  brand: { flex: 1 },
  close: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  navigation: { gap: Spacing.sm, paddingBottom: Spacing.lg },
  item: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.sm, borderRadius: Radius.lg },
  icon: { width: 46, height: 46, backgroundColor: Colors.muted, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
  selectedIcon: { backgroundColor: '#E5F1D4' },
  label: { flex: 1, fontSize: 17 },
  selected: { backgroundColor: Colors.softGreen },
  selectedText: { color: Colors.primaryGreen, fontFamily: Fonts.bold },
  footer: { marginTop: Spacing.lg, borderTopWidth: 1, borderColor: Colors.border, paddingTop: Spacing.lg },
  caption: { textAlign: 'center' },
  pressed: { opacity: 0.65 },
});
