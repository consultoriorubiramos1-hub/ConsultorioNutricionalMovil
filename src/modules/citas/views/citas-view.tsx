import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { AppButton, AppCard, AppScreen, AppText } from "@/components/ui";
import { Colors, Radius, Spacing } from "@/constants/theme";
import { DashboardMenu } from "@/modules/dashboard/components/dashboard-menu";
import { AppointmentCard } from "../components/appointment-card";
import { AppointmentConfirmationDialog } from "../components/appointment-confirmation";
import { AppointmentForm } from "../components/appointment-form";
import { useCitasViewModel } from "../viewmodels/use-citas-viewmodel";

export function CitasView() {
  const vm = useCitasViewModel();
  return (
    <AppScreen scrollable={false} contentContainerStyle={styles.screen}>
      <View style={styles.topBar}>
        <AppText variant="sectionTitle" color="white" style={styles.brand}>
          Rubí Ramos
        </AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Abrir menú de navegación"
          accessibilityState={{ expanded: vm.menuOpen }}
          disabled={vm.busy}
          onPress={() => vm.setMenuOpen(true)}
          style={({ pressed }) => [
            styles.menuButton,
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.menuLine} />
          <View style={styles.menuLine} />
          <View style={styles.menuLine} />
        </Pressable>
      </View>
      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            vm.tab === "upcoming" && !vm.rescheduling ? (
              <RefreshControl
                refreshing={vm.refreshing}
                enabled={!vm.busy && !vm.sessionRequired}
                onRefresh={() => void vm.refreshAppointments()}
                tintColor={Colors.headerGreen}
                colors={[Colors.headerGreen]}
              />
            ) : undefined
          }
        >
          <View style={styles.content}>
            <View style={styles.heading}>
              <AppText variant="title" style={styles.title}>
                Citas
              </AppText>
              <AppText color="textSecondary">
                Consulta y gestiona tus citas para continuar tu seguimiento
                nutricional.
              </AppText>
            </View>
            {vm.sessionRequired ? (
              <AppCard style={styles.error} accessibilityRole="alert">
                <AppText variant="sectionTitle">
                  Inicia sesión nuevamente
                </AppText>
                <AppText color="textSecondary">
                  {vm.listError ||
                    vm.formError ||
                    vm.availabilityError ||
                    "Tu sesión no está disponible."}
                </AppText>
                <AppButton label="Iniciar sesión" onPress={vm.goToLogin} />
              </AppCard>
            ) : (
              <>
                <View style={styles.tabs} accessibilityRole="tablist">
                  {(
                    [
                      { key: "upcoming", label: "Próximas citas" },
                      { key: "new", label: "Agendar cita" },
                    ] as const
                  ).map((item) => (
                    <Pressable
                      key={item.key}
                      accessibilityRole="tab"
                      accessibilityState={{
                        selected: vm.tab === item.key,
                        disabled: vm.busy,
                      }}
                      disabled={vm.busy}
                      onPress={() => vm.changeTab(item.key)}
                      style={({ pressed }) => [
                        styles.tab,
                        vm.tab === item.key && styles.selectedTab,
                        pressed && styles.pressed,
                      ]}
                    >
                      <AppText
                        variant="auxiliary"
                        color={vm.tab === item.key ? "white" : "text"}
                      >
                        {item.label}
                      </AppText>
                    </Pressable>
                  ))}
                </View>
                {vm.notice ? (
                  <AppCard
                    style={styles.notice}
                    accessibilityLiveRegion="polite"
                  >
                    <AppText>{vm.notice}</AppText>
                  </AppCard>
                ) : null}
                {vm.tab === "new" || vm.rescheduling ? (
                  <AppointmentForm key={vm.rescheduling?.id ?? "new"} vm={vm} />
                ) : (
                  <>
                    {vm.listError ? (
                      <AppCard style={styles.error} accessibilityRole="alert">
                        <AppText variant="sectionTitle">
                          No se pudieron actualizar tus citas
                        </AppText>
                        <AppText color="textSecondary">{vm.listError}</AppText>
                        <AppButton
                          label="Reintentar"
                          disabled={vm.busy || vm.loading || vm.refreshing}
                          onPress={() => void vm.refreshAppointments()}
                        />
                      </AppCard>
                    ) : null}
                    {vm.loading ? (
                      <View
                        style={styles.state}
                        accessibilityLiveRegion="polite"
                      >
                        <ActivityIndicator
                          size="large"
                          color={Colors.headerGreen}
                        />
                        <AppText color="textSecondary">
                          Cargando tus citas…
                        </AppText>
                      </View>
                    ) : vm.appointments.length === 0 && !vm.listError ? (
                      <AppCard style={styles.state}>
                        <AppText variant="sectionTitle">
                          No tienes próximas citas.
                        </AppText>
                        <AppText color="textSecondary">
                          Selecciona una fecha y consulta los horarios
                          disponibles para solicitar tu siguiente cita.
                        </AppText>
                        <AppButton
                          label="Agendar cita"
                          disabled={vm.busy}
                          onPress={() => vm.changeTab("new")}
                        />
                      </AppCard>
                    ) : (
                      vm.appointments.map((appointment) => (
                        <AppointmentCard
                          key={appointment.id}
                          appointment={appointment}
                          disabled={vm.busy || vm.refreshing}
                          onReschedule={() => vm.startReschedule(appointment)}
                          onCancel={() => vm.requestCancel(appointment)}
                        />
                      ))
                    )}
                  </>
                )}
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <DashboardMenu
        activeRoute="/citas"
        visible={vm.menuOpen}
        loggingOut={vm.mutation === "logout"}
        onClose={() => vm.setMenuOpen(false)}
        onNavigate={vm.navigate}
        onLogout={() => void vm.logout()}
      />
      <AppointmentConfirmationDialog
        confirmation={vm.confirmation}
        busy={vm.mutation === "cancel" || vm.mutation === "reschedule"}
        onClose={vm.closeConfirmation}
        onConfirm={() => void vm.confirmAction()}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 0 },
  body: { flex: 1 },
  topBar: {
    minHeight: 72,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
    backgroundColor: Colors.headerGreen,
  },
  brand: { flexShrink: 1 },
  menuButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
  },
  menuLine: {
    width: 22,
    height: 2,
    borderRadius: Radius.pill,
    backgroundColor: Colors.white,
  },
  scrollContent: { flexGrow: 1, alignItems: "center" },
  content: {
    width: "100%",
    maxWidth: 560,
    padding: Spacing.md,
    gap: Spacing.lg,
  },
  heading: { gap: Spacing.sm, paddingVertical: Spacing.sm },
  title: { color: Colors.headerGreen },
  tabs: { flexDirection: "row", gap: Spacing.sm },
  tab: {
    flex: 1,
    minHeight: 48,
    padding: Spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    backgroundColor: Colors.white,
  },
  selectedTab: {
    backgroundColor: Colors.headerGreen,
    borderColor: Colors.headerGreen,
  },
  state: {
    minHeight: 200,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.md,
  },
  error: {
    gap: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primaryOrange,
  },
  notice: {
    gap: Spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: Colors.headerGreen,
  },
  pressed: { opacity: 0.7 },
});
