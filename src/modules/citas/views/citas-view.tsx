import { useState } from 'react';
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

import { AppButton, AppCard, AppHeader, AppScreen, AppText } from "@/components/ui";
import { Colors, Radius, Spacing } from "@/constants/theme";
import { DashboardMenu } from "@/modules/dashboard/components/dashboard-menu";
import { AppointmentCard } from "../components/appointment-card";
import { AppointmentConfirmationDialog } from "../components/appointment-confirmation";
import { AppointmentForm } from "../components/appointment-form";
import { useCitasViewModel } from "../viewmodels/use-citas-viewmodel";
import { isFutureSlot } from '../utils/citas-date';
import type { Appointment } from '../models/citas.model';

const isUpcoming = (appointment: Appointment) => appointment.date !== null && appointment.startTime !== null && !['completed', 'cancelled', 'no_show'].includes(appointment.status) && isFutureSlot(appointment.date, appointment.startTime);

export function CitasView() {
  const vm = useCitasViewModel();
  const [listTab, setListTab] = useState<'upcoming' | 'history'>('upcoming');
  const upcoming = vm.appointments.filter(isUpcoming);
  const history = vm.appointments.filter((appointment) => !isUpcoming(appointment));
  const next = upcoming[0];
  const visibleAppointments = listTab === 'history' ? history : upcoming.slice(1);
  return (
    <AppScreen scrollable={false} contentContainerStyle={styles.screen}>
      <AppHeader onMenuPress={() => vm.setMenuOpen(true)} expanded={vm.menuOpen} disabled={vm.busy} />
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
                {vm.rescheduling ? "Reprogramar cita" : vm.tab === "new" ? "Agendar cita" : "Mis citas"}
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
                      { key: "upcoming", label: "Mis citas" },
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
                        style={vm.tab === item.key ? { color: Colors.darkGreen } : undefined}
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
                    ) : vm.appointments.length ? (
                      <>
                      {next ? <AppointmentCard appointment={next} featured disabled={vm.busy || vm.refreshing} onReschedule={() => vm.startReschedule(next)} onCancel={() => vm.requestCancel(next)} /> : null}
                      <AppButton label="Agendar nueva cita" disabled={vm.busy} onPress={() => vm.changeTab('new')} />
                      <View style={styles.listTabs} accessibilityRole="tablist" accessibilityLabel="Listado de citas">
                        {([{ key: 'upcoming', label: 'Próximas', count: upcoming.length }, { key: 'history', label: 'Historial', count: history.length }] as const).map((tab) => <Pressable key={tab.key} accessibilityRole="tab" accessibilityState={{ selected: listTab === tab.key }} onPress={() => setListTab(tab.key)} style={[styles.listTab, listTab === tab.key && styles.activeListTab]}><AppText variant="auxiliary">{tab.label} ({tab.count})</AppText></Pressable>)}
                      </View>
                      {visibleAppointments.length === 0 ? <AppCard><AppText color="textSecondary">{listTab === 'history' ? 'No hay citas anteriores disponibles.' : next ? 'Estas son todas tus próximas citas.' : 'No tienes próximas citas agendadas.'}</AppText></AppCard> : null}
                      {visibleAppointments.map((appointment) => (
                        <AppointmentCard
                          key={appointment.id}
                          appointment={appointment}
                          disabled={vm.busy || vm.refreshing}
                          onReschedule={() => vm.startReschedule(appointment)}
                          onCancel={() => vm.requestCancel(appointment)}
                        />
                      ))}
                      </>
                    ) : null}
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
  scrollContent: { flexGrow: 1, alignItems: "center" },
  content: {
    width: "100%",
    maxWidth: 560,
    padding: Spacing.md + 4,
    gap: Spacing.lg,
  },
  heading: { gap: Spacing.sm, paddingVertical: Spacing.sm },
  title: { color: Colors.text },
  tabs: { flexDirection: "row", gap: Spacing.sm },
  listTabs: { flexDirection: 'row', backgroundColor: Colors.muted, borderRadius: Radius.pill, padding: 4 },
  listTab: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.pill },
  activeListTab: { backgroundColor: Colors.softGreen },
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
    backgroundColor: Colors.accentGreen,
    borderColor: Colors.accentGreen,
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
