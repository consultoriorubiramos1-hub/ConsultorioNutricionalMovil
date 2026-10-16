import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from "react-native";

import { AppButton, AppCard, AppHeader, AppScreen, AppText } from "@/components/ui";
import { Colors, Spacing } from "@/constants/theme";
import { DashboardMenu } from "@/modules/dashboard/components/dashboard-menu";
import { PlanDetails } from "../components/plan-details";
import { usePlanAlimenticioViewModel } from "../viewmodels/use-plan-alimenticio-viewmodel";

export function PlanAlimenticioView() {
  const vm = usePlanAlimenticioViewModel();
  return (
    <AppScreen scrollable={false} contentContainerStyle={styles.screen}>
      <AppHeader onMenuPress={() => vm.setMenuOpen(true)} expanded={vm.menuOpen} disabled={vm.loggingOut} />
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.scrollContent}
        alwaysBounceVertical
        refreshControl={
          <RefreshControl
            refreshing={vm.refreshing}
            enabled={!vm.loading && !vm.loggingOut && !vm.sessionRequired}
            onRefresh={() => void vm.refreshPlan()}
            tintColor={Colors.headerGreen}
            colors={[Colors.headerGreen]}
          />
        }
      >
        <View style={styles.content}>
          <View style={styles.heading}>
            <AppText variant="title" style={styles.title} accessibilityRole="header">Plan alimenticio</AppText>
            <AppText color="textSecondary">Tu gu?a de alimentaci?n, pensada especialmente para ti.</AppText>
          </View>
          {vm.sessionRequired ? (
            <AppCard style={styles.error} accessibilityRole="alert" accessibilityLiveRegion="polite">
              <AppText variant="sectionTitle">Inicia sesión nuevamente</AppText>
              <AppText color="textSecondary">{vm.error ?? "Tu sesión no es válida o ha expirado."}</AppText>
              <AppButton label="Iniciar sesión" accessibilityLabel="Iniciar sesión nuevamente" onPress={vm.goToLogin} />
            </AppCard>
          ) : (
            <>
              {vm.error ? (
                <AppCard style={styles.error} accessibilityRole="alert" accessibilityLiveRegion="polite">
                  <AppText variant="sectionTitle">No se pudo actualizar tu plan alimenticio</AppText>
                  <AppText color="textSecondary">{vm.error}</AppText>
                  {vm.plan ? <AppText variant="auxiliary" color="textSecondary">Se muestra la última información consultada.</AppText> : null}
                  <AppButton
                    label="Reintentar"
                    accessibilityLabel="Volver a consultar tu plan alimenticio"
                    accessibilityState={{ disabled: vm.loading || vm.refreshing || vm.loggingOut }}
                    disabled={vm.loading || vm.refreshing || vm.loggingOut}
                    onPress={() => void vm.refreshPlan()}
                  />
                </AppCard>
              ) : null}
              {vm.loading ? (
                <View style={styles.state} accessibilityLiveRegion="polite" accessibilityState={{ busy: true }}>
                  <ActivityIndicator size="large" color={Colors.headerGreen} accessibilityLabel="Cargando tu plan alimenticio" />
                  <AppText color="textSecondary">Cargando tu plan alimenticio…</AppText>
                </View>
              ) : vm.plan ? (
                <PlanDetails
                  plan={vm.plan}
                  selectedMenu={vm.selectedMenu}
                  menuOfToday={vm.menuOfToday}
                  disabled={vm.loggingOut}
                  onSelectMenu={vm.selectMenu}
                />
              ) : !vm.error ? (
                <AppCard style={styles.empty} accessibilityLiveRegion="polite">
                  <AppText variant="sectionTitle">No tienes un plan alimenticio activo.</AppText>
                  <AppText color="textSecondary">Tu nutriólogo compartirá tu plan alimenticio cuando esté disponible.</AppText>
                </AppCard>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>
      <DashboardMenu
        activeRoute="/plan-alimenticio"
        visible={vm.menuOpen}
        loggingOut={vm.loggingOut}
        onClose={() => vm.setMenuOpen(false)}
        onNavigate={vm.navigate}
        onLogout={() => void vm.logout()}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 0 },
  body: { flex: 1 },
  scrollContent: { flexGrow: 1, alignItems: "center" },
  content: { width: "100%", maxWidth: 560, padding: Spacing.md + 4, gap: Spacing.lg },
  heading: { gap: Spacing.sm, paddingVertical: Spacing.sm },
  title: { color: Colors.text },
  state: { minHeight: 200, alignItems: "center", justifyContent: "center", gap: Spacing.md },
  empty: { gap: Spacing.md },
  error: { gap: Spacing.md, borderLeftWidth: 4, borderLeftColor: Colors.primaryOrange },
  pressed: { opacity: 0.7 },
});
