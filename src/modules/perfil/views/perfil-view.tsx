import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

import { AppButton, AppScreen, AppText } from "@/components/ui";
import { Colors, Fonts, Radius, Spacing } from "@/constants/theme";
import { DashboardMenu } from "@/modules/dashboard/components/dashboard-menu";
import { CuentaForm } from "../components/cuenta-form";
import { DatosForm } from "../components/datos-form";
import { PerfilTabs } from "../components/perfil-tabs";
import { SeguridadForm } from "../components/seguridad-form";
import { usePerfilViewModel } from "../viewmodels/use-perfil-viewmodel";

export function PerfilView() {
  const vm = usePerfilViewModel();

  return (
    <AppScreen contentContainerStyle={styles.screen}>
      <View style={styles.shell}>
        <View style={styles.topBar}>
          <View style={styles.brandArea}>
            <View style={styles.brandAvatar}>
              <AppText variant="sectionTitle" style={styles.brandAvatarText}>
                R
              </AppText>
            </View>
            <AppText variant="sectionTitle" color="white">
              Rubí Ramos
            </AppText>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Abrir menú de navegación"
            accessibilityState={{ expanded: vm.menuOpen }}
            disabled={vm.saving || vm.loggingOut}
            onPress={() => vm.setMenuOpen(true)}
            style={({ pressed }) => [
              styles.menuButton,
              pressed && styles.pressed,
            ]}
          >
            <AppText color="white" style={styles.menuIcon}>
              ☰
            </AppText>
          </Pressable>
        </View>

        <View style={styles.content}>
          <View style={styles.heading}>
            <AppText variant="subtitle" style={styles.pageTitle}>
              {vm.activeTab === "seguridad" ? "Seguridad" : "Mi perfil"}
            </AppText>
            {vm.activeTab !== "seguridad" ? (
              <AppText variant="auxiliary" color="textSecondary">
                Información de tu cuenta
              </AppText>
            ) : null}
          </View>

          {vm.loading ? (
            <View style={styles.stateBox}>
              <ActivityIndicator size="large" color={Colors.headerGreen} />
              <AppText color="textSecondary">Cargando perfil...</AppText>
            </View>
          ) : vm.error && !vm.perfil ? (
            <View style={styles.stateBox}>
              <AppText variant="sectionTitle">
                No se pudo cargar el perfil
              </AppText>
              <AppText color="textSecondary" style={styles.centerText}>
                {vm.error}
              </AppText>
              <AppButton
                label="Reintentar"
                onPress={() => void vm.cargarPerfil()}
              />
            </View>
          ) : vm.perfil ? (
            <>
              <View style={styles.identity}>
                <View style={styles.avatar}>
                  <AppText variant="subtitle" style={styles.avatarText}>
                    {vm.initials}
                  </AppText>
                </View>
                <AppText variant="sectionTitle">
                  {vm.perfil.nombreCompleto || vm.perfil.username}
                </AppText>
              </View>

              <PerfilTabs activeTab={vm.activeTab} onChange={vm.setActiveTab} />

              {vm.error ? (
                <View style={styles.inlineError}>
                  <AppText variant="auxiliary" style={styles.inlineErrorText}>
                    {vm.error}
                  </AppText>
                </View>
              ) : null}

              <View style={styles.panel}>
                {vm.activeTab === null ? (
                  <View style={styles.emptyState}>
                    <AppText color="textSecondary" style={styles.centerText}>
                      Selecciona una pestaña para consultar o editar tu
                      información.
                    </AppText>
                  </View>
                ) : null}

                {vm.activeTab === "datos" ? (
                  <DatosForm
                    value={vm.datosForm}
                    age={vm.perfil.age}
                    saving={vm.saving}
                    onChange={vm.updateDatosField}
                    onSave={vm.guardarDatos}
                  />
                ) : null}

                {vm.activeTab === "cuenta" ? (
                  <CuentaForm
                    value={vm.cuentaForm}
                    saving={vm.saving}
                    onChange={vm.updateCuentaField}
                    onSave={vm.guardarCuenta}
                  />
                ) : null}

                {vm.activeTab === "seguridad" ? <SeguridadForm /> : null}
              </View>
            </>
          ) : null}
        </View>
      </View>
      <DashboardMenu
        activeRoute="/perfil"
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
  screen: {
    padding: 0,
    alignItems: "center",
  },
  shell: {
    width: "100%",
    maxWidth: 560,
    minHeight: "100%",
    backgroundColor: Colors.background,
  },
  topBar: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: "#244E3E",
  },
  brandArea: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  brandAvatar: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.pill,
    backgroundColor: "#E6F2EC",
  },
  brandAvatarText: {
    color: "#244E3E",
  },
  menuButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  menuIcon: {
    fontSize: 26,
    lineHeight: 28,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  heading: {
    gap: 2,
  },
  pageTitle: {
    fontFamily: Fonts.bold,
    color: "#244E3E",
  },
  identity: {
    alignItems: "center",
    gap: Spacing.sm,
  },
  avatar: {
    width: 68,
    height: 68,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.headerGreen,
    borderRadius: Radius.pill,
    backgroundColor: "#EDF5F1",
  },
  avatarText: {
    fontFamily: Fonts.bold,
    color: "#315C4B",
  },
  panel: {
    minHeight: 220,
  },
  emptyState: {
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  stateBox: {
    minHeight: 300,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  centerText: {
    textAlign: "center",
  },
  inlineError: {
    padding: Spacing.sm,
    borderRadius: Radius.sm,
    backgroundColor: "#FDECEC",
  },
  inlineErrorText: {
    color: "#8D2F2F",
    textAlign: "center",
  },
  pressed: {
    opacity: 0.75,
  },
});
