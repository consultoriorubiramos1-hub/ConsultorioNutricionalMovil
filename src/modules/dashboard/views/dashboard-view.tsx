import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { AppButton, AppCard, AppScreen, AppText } from "@/components/ui";
import { Colors, Fonts, Radius, Spacing } from "@/constants/theme";
import { DashboardMenu } from "../components/dashboard-menu";
import { useDashboardViewModel } from "../viewmodels/use-dashboard-viewmodel";

function formatDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatWeight(value: number | null | undefined): string {
  return value == null ? "—" : `${value.toFixed(1)} kg`;
}

export function DashboardView() {
  const vm = useDashboardViewModel();
  const health = vm.data?.health;
  const appointment = vm.data?.nextAppointment;
  const warnings = [vm.error, ...(vm.data?.errors ?? [])].filter(
    (value): value is string => Boolean(value),
  );
  const unhealthy =
    health?.imcCategory != null && health.imcCategory !== "Saludable";
  const change = health?.weightChange;
  const changeLabel =
    change == null ? "—" : `${change > 0 ? "+" : ""}${change.toFixed(1)} kg`;

  return (
    <AppScreen scrollable={false} contentContainerStyle={styles.screen}>
      <View style={styles.topBar}>
        <View style={styles.brandArea}>
          <View style={styles.brandAvatar} accessible={false}>
            <AppText variant="sectionTitle" style={styles.brandInitial}>
              R
            </AppText>
          </View>
          <AppText
            variant="sectionTitle"
            color="white"
            style={styles.brandName}
          >
            Rubí Ramos
          </AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Abrir menú de navegación"
          accessibilityState={{ expanded: vm.menuOpen }}
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

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={vm.loading && vm.data !== null}
            onRefresh={() => void vm.cargarDashboard()}
            tintColor={Colors.headerGreen}
            colors={[Colors.headerGreen]}
          />
        }
      >
        <View style={styles.content}>
          <View style={styles.heading}>
            <AppText variant="title" style={styles.title}>
              {health?.patientName
                ? `Hola, ${health.patientName}`
                : "Bienvenido"}
            </AppText>
            <AppText color="textSecondary">
              Este es tu espacio personal para dar seguimiento a tu tratamiento
              nutricional.
            </AppText>
          </View>

          {vm.loading && !vm.data ? (
            <View style={styles.stateBox} accessibilityLiveRegion="polite">
              <ActivityIndicator size="large" color={Colors.headerGreen} />
              <AppText color="textSecondary">Cargando tu información…</AppText>
            </View>
          ) : (
            <>
              {warnings.length > 0 ? (
                <AppCard
                  style={styles.errorCard}
                  accessibilityLiveRegion="polite"
                >
                  <AppText variant="sectionTitle">
                    No se pudo cargar toda la información
                  </AppText>
                  {warnings.map((message, index) => (
                    <AppText key={index} color="textSecondary">
                      {message}
                    </AppText>
                  ))}
                  <AppButton
                    label="Reintentar"
                    disabled={vm.loading || vm.loggingOut}
                    onPress={() => void vm.cargarDashboard()}
                  />
                </AppCard>
              ) : null}

              {vm.data ? (
                <>
                  <AppCard style={styles.appointmentCard}>
                    <AppText variant="sectionTitle" style={styles.sectionTitle}>
                      Próxima cita
                    </AppText>
                    {appointment ? (
                      <>
                        <AppText variant="subtitle" style={styles.bold}>
                          {formatDate(appointment.date)}
                        </AppText>
                        <AppText
                          variant="subtitle"
                          style={styles.appointmentTime}
                        >
                          {appointment.time} horas
                        </AppText>
                      </>
                    ) : (
                      <AppText color="textSecondary">
                        {vm.data.appointmentsAvailable
                          ? "No tienes próximas citas agendadas."
                          : "No fue posible consultar tu próxima cita."}
                      </AppText>
                    )}
                    <AppButton
                      label="Ver mis citas"
                      onPress={() => vm.navigate("/citas")}
                    />
                  </AppCard>

                  {health ? (
                    <>
                      <View style={styles.metrics}>
                        <AppCard style={[styles.metricCard, styles.weightCard]}>
                          <AppText color="textSecondary">Peso actual</AppText>
                          <AppText variant="title">
                            {formatWeight(health.currentWeight)}
                          </AppText>
                          <AppText variant="auxiliary" color="textSecondary">
                            {health.lastMeasurementDate
                              ? `Medido el ${formatDate(health.lastMeasurementDate)}`
                              : "Aún no hay registros de peso."}
                          </AppText>
                        </AppCard>
                        <AppCard
                          style={[
                            styles.metricCard,
                            unhealthy ? styles.warningBorder : styles.imcBorder,
                          ]}
                        >
                          <AppText color="textSecondary">IMC</AppText>
                          <AppText variant="title">
                            {health.imc?.toFixed(1) ?? "—"}
                          </AppText>
                          <AppText
                            variant="auxiliary"
                            style={
                              unhealthy
                                ? styles.warningText
                                : styles.sectionTitle
                            }
                          >
                            {health.imcCategory ??
                              "Sin peso o estatura registrados"}
                          </AppText>
                          {health.imc !== null ? (
                            <AppText variant="auxiliary" color="textSecondary">
                              kg/m² · Referencia para adultos
                            </AppText>
                          ) : null}
                        </AppCard>
                      </View>

                      {unhealthy ? (
                        <AppCard
                          style={styles.warningCard}
                          accessibilityRole="alert"
                        >
                          <AppText
                            variant="sectionTitle"
                            style={styles.warningText}
                          >
                            ⚠ IMC fuera del rango saludable
                          </AppText>
                          <AppText>
                            Tu clasificación es {health.imcCategory}. Revisa
                            este resultado con tu nutrióloga para dar
                            seguimiento a tu tratamiento.
                          </AppText>
                        </AppCard>
                      ) : null}

                      <AppCard style={styles.progressCard}>
                        <AppText
                          variant="sectionTitle"
                          style={styles.sectionTitle}
                        >
                          Mi progreso de peso
                        </AppText>
                        {health.currentWeight === null ? (
                          <AppText color="textSecondary">
                            Aún no hay registros de peso. Tu progreso estará
                            disponible después de tus evaluaciones de
                            seguimiento.
                          </AppText>
                        ) : (
                          <>
                            <View style={styles.weightComparison}>
                              <View style={styles.comparisonItem}>
                                <AppText
                                  variant="auxiliary"
                                  color="textSecondary"
                                >
                                  Peso inicial
                                </AppText>
                                <AppText variant="subtitle" style={styles.bold}>
                                  {formatWeight(health.initialWeight)}
                                </AppText>
                              </View>
                              <AppText color="textSecondary" accessible={false}>
                                →
                              </AppText>
                              <View style={styles.comparisonItem}>
                                <AppText
                                  variant="auxiliary"
                                  color="textSecondary"
                                >
                                  Peso actual
                                </AppText>
                                <AppText variant="subtitle" style={styles.bold}>
                                  {formatWeight(health.currentWeight)}
                                </AppText>
                              </View>
                            </View>
                            {change == null ? (
                              <AppText color="textSecondary">
                                Necesitas al menos dos mediciones para comparar
                                tu progreso.
                              </AppText>
                            ) : (
                              <View style={styles.changeBox}>
                                <AppText
                                  variant="title"
                                  style={styles.sectionTitle}
                                >
                                  {changeLabel}
                                </AppText>
                                <AppText color="textSecondary">
                                  {change < 0
                                    ? "Disminución"
                                    : change > 0
                                      ? "Aumento"
                                      : "Sin cambio"}{" "}
                                  respecto al peso inicial
                                </AppText>
                                <AppText
                                  variant="auxiliary"
                                  color="textSecondary"
                                >
                                  {Math.abs(
                                    health.weightChangePercent ?? 0,
                                  ).toFixed(1)}
                                  % de variación · {health.measurements.length}{" "}
                                  mediciones
                                </AppText>
                              </View>
                            )}
                            {health.lastMeasurementDate ? (
                              <AppText
                                variant="auxiliary"
                                color="textSecondary"
                              >
                                Última medición:{" "}
                                {formatDate(health.lastMeasurementDate)}
                              </AppText>
                            ) : null}
                          </>
                        )}
                        <AppButton
                          label="Ver historial médico"
                          variant="secondary"
                          onPress={() => vm.navigate("/historial")}
                        />
                      </AppCard>
                    </>
                  ) : null}
                </>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>
      <DashboardMenu
        visible={vm.menuOpen}
        loggingOut={vm.loggingOut}
        onClose={() => vm.setMenuOpen(false)}
        onNavigate={vm.navigate}
        onLogout={() => void vm.cerrarSesion()}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 0 },
  topBar: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    backgroundColor: Colors.headerGreen,
  },
  brandArea: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
  },
  brandAvatar: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  brandInitial: { color: Colors.headerGreen },
  brandName: { flexShrink: 1 },
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
  sectionTitle: { color: Colors.headerGreen },
  bold: { fontFamily: Fonts.bold },
  stateBox: {
    minHeight: 240,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
  },
  appointmentCard: {
    gap: Spacing.md,
    borderTopWidth: 4,
    borderTopColor: Colors.headerGreen,
  },
  appointmentTime: { color: Colors.secondaryBrown, fontFamily: Fonts.bold },
  metrics: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.md },
  metricCard: {
    flexGrow: 1,
    flexBasis: "45%",
    minWidth: 130,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderLeftWidth: 4,
  },
  weightCard: { borderLeftColor: Colors.accentGreen },
  imcBorder: { borderLeftColor: Colors.headerGreen },
  warningBorder: { borderLeftColor: Colors.primaryOrange },
  warningText: { color: Colors.secondaryBrown, fontFamily: Fonts.bold },
  warningCard: {
    gap: Spacing.sm,
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.primaryOrange,
  },
  errorCard: {
    gap: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primaryOrange,
  },
  progressCard: { gap: Spacing.md },
  weightComparison: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  comparisonItem: { flexShrink: 1, gap: Spacing.xs },
  changeBox: {
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  pressed: { opacity: 0.7 },
});
