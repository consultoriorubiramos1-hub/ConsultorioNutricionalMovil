import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View } from "react-native";

import { AppButton, AppCard, AppScreen, AppText } from "@/components/ui";
import { Colors, Radius, Spacing } from "@/constants/theme";
import { DashboardMenu } from "@/modules/dashboard/components/dashboard-menu";
import { FollowUpCard } from "../components/follow-up-card";
import { InitialEvaluation } from "../components/initial-evaluation";
import { PatientCard } from "../components/patient-card";
import { ProgressSummary } from "../components/progress-summary";
import { useHistorialViewModel } from "../viewmodels/use-historial-viewmodel";

export function HistorialView() {
  const vm = useHistorialViewModel();
  const history = !vm.loading && !vm.sessionRequired ? vm.history : null;
  const evaluations = history && vm.activeTab === "progress" ? history.followUpEvaluations : [];
  return (
    <AppScreen scrollable={false} contentContainerStyle={styles.screen}>
      <View style={styles.topBar}>
        <AppText variant="sectionTitle" color="white" style={styles.brand}>Rubí Ramos</AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Abrir menú de navegación"
          accessibilityState={{ expanded: vm.menuOpen, disabled: vm.loggingOut }}
          disabled={vm.loggingOut}
          onPress={() => vm.setMenuOpen(true)}
          style={({ pressed }) => [styles.menuButton, pressed && styles.pressed]}
        >
          <View style={styles.menuLine} />
          <View style={styles.menuLine} />
          <View style={styles.menuLine} />
        </Pressable>
      </View>
      <FlatList
        key={vm.activeTab}
        style={styles.body}
        data={evaluations}
        extraData={vm.expandedEvaluationIds}
        keyExtractor={(evaluation) => evaluation.key}
        contentContainerStyle={styles.listContent}
        ListHeaderComponentStyle={styles.headerContainer}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={7}
        removeClippedSubviews={false}
        alwaysBounceVertical
        refreshControl={
          <RefreshControl
            refreshing={vm.refreshing}
            enabled={!vm.loading && !vm.loggingOut && !vm.sessionRequired}
            onRefresh={() => void vm.refreshHistory()}
            tintColor={Colors.headerGreen}
            colors={[Colors.headerGreen]}
          />
        }
        ListHeaderComponent={
          <View style={styles.content}>
            <View style={styles.heading}>
              <AppText variant="title" style={styles.title} accessibilityRole="header">Mi historial médico</AppText>
              <AppText color="textSecondary">Consulta tu evaluación inicial, mediciones y evolución nutricional.</AppText>
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
                    <AppText variant="sectionTitle">No se pudo actualizar tu historial médico</AppText>
                    <AppText color="textSecondary">{vm.error}</AppText>
                    {history ? <AppText variant="auxiliary" color="textSecondary">Se muestra la última información consultada.</AppText> : null}
                    <AppButton
                      label="Reintentar"
                      accessibilityLabel="Volver a consultar tu historial médico"
                      accessibilityState={{ disabled: vm.loading || vm.refreshing || vm.loggingOut }}
                      disabled={vm.loading || vm.refreshing || vm.loggingOut}
                      onPress={() => void vm.refreshHistory()}
                    />
                  </AppCard>
                ) : null}
                {vm.loading ? (
                  <View style={styles.state} accessibilityLiveRegion="polite" accessibilityState={{ busy: true }}>
                    <ActivityIndicator size="large" color={Colors.headerGreen} accessibilityLabel="Cargando tu historial médico" />
                    <AppText color="textSecondary">Cargando tu historial médico…</AppText>
                  </View>
                ) : null}
                {history ? (
                  <>
                    <PatientCard patient={history.patient} disabled={vm.loggingOut} />
                    <View style={styles.tabs} accessibilityRole="tablist" accessibilityLabel="Secciones del historial médico">
                      {([
                        { key: "initial", label: "Evaluación inicial" },
                        { key: "progress", label: "Progreso" },
                      ] as const).map((tab) => (
                        <Pressable
                          key={tab.key}
                          accessibilityRole="tab"
                          accessibilityLabel={tab.label}
                          accessibilityState={{ selected: vm.activeTab === tab.key, disabled: vm.loggingOut }}
                          disabled={vm.loggingOut}
                          onPress={() => vm.changeTab(tab.key)}
                          style={({ pressed }) => [styles.tab, vm.activeTab === tab.key && styles.selectedTab, pressed && styles.pressed]}
                        >
                          <AppText variant="auxiliary" color={vm.activeTab === tab.key ? "white" : "text"}>{tab.label}</AppText>
                        </Pressable>
                      ))}
                    </View>
                    {vm.activeTab === "initial" ? (
                      <InitialEvaluation
                        evaluation={history.initialEvaluation}
                        sections={vm.sections}
                        expandedSections={vm.expandedInitialSections}
                        disabled={vm.loggingOut}
                        onToggle={vm.toggleInitialSection}
                      />
                    ) : (
                      <>
                        <ProgressSummary indicators={vm.indicators} weightDifference={vm.weightDifference} />
                        <AppText variant="sectionTitle" accessibilityRole="header">Historial de evaluaciones</AppText>
                        {!evaluations.length ? (
                          <AppCard style={styles.empty} accessibilityLiveRegion="polite">
                            <AppText variant="sectionTitle">Aún no tienes evaluaciones de seguimiento.</AppText>
                            <AppText color="textSecondary">Las mediciones aparecerán aquí después de tus consultas de seguimiento.</AppText>
                          </AppCard>
                        ) : null}
                      </>
                    )}
                  </>
                ) : null}
              </>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.evaluationContainer}>
            <FollowUpCard
              evaluation={item}
              expanded={vm.expandedEvaluationIds.has(item.key)}
              disabled={vm.loggingOut}
              onToggle={() => vm.toggleEvaluation(item.key)}
            />
          </View>
        )}
      />
      <DashboardMenu
        activeRoute="/historial"
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
  topBar: {
    minHeight: 72, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    gap: Spacing.sm, backgroundColor: Colors.headerGreen,
  },
  brand: { flexShrink: 1 },
  menuButton: { minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center", gap: Spacing.xs },
  menuLine: { width: 22, height: 2, borderRadius: Radius.pill, backgroundColor: Colors.white },
  listContent: { flexGrow: 1, paddingBottom: Spacing.lg },
  headerContainer: { width: "100%", alignItems: "center" },
  content: { width: "100%", maxWidth: 560, padding: Spacing.md, gap: Spacing.lg },
  evaluationContainer: { width: "100%", maxWidth: 560, alignSelf: "center", paddingHorizontal: Spacing.md, marginBottom: Spacing.lg },
  heading: { gap: Spacing.sm, paddingVertical: Spacing.sm },
  title: { color: Colors.headerGreen },
  tabs: { flexDirection: "row", gap: Spacing.sm },
  tab: {
    flex: 1, minHeight: 52, padding: Spacing.sm, alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, backgroundColor: Colors.white,
  },
  selectedTab: { backgroundColor: Colors.headerGreen, borderColor: Colors.headerGreen },
  state: { minHeight: 200, alignItems: "center", justifyContent: "center", gap: Spacing.md },
  empty: { gap: Spacing.md },
  error: { gap: Spacing.md, borderLeftWidth: 4, borderLeftColor: Colors.primaryOrange },
  pressed: { opacity: 0.7 },
});
