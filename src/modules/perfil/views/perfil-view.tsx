import { ActivityIndicator, StyleSheet, View } from "react-native";

import { AppButton, AppCard, AppHeader, AppScreen, AppText } from "@/components/ui";
import { Colors, Fonts, Radius, Spacing } from "@/constants/theme";
import { DashboardMenu } from "@/modules/dashboard/components/dashboard-menu";
import { CuentaForm } from "../components/cuenta-form";
import { DatosForm } from "../components/datos-form";
import { PerfilTabs } from "../components/perfil-tabs";
import { PrivacidadArco } from "../components/privacidad-arco";
import { SeguridadForm } from "../components/seguridad-form";
import { usePerfilViewModel } from "../viewmodels/use-perfil-viewmodel";

export function PerfilView() {
  const vm = usePerfilViewModel();

  return (
    <AppScreen contentContainerStyle={styles.screen}>
      <View style={styles.shell}>
        <AppHeader onMenuPress={() => vm.setMenuOpen(true)} expanded={vm.menuOpen} disabled={vm.saving || vm.loggingOut} />

        <View style={styles.content}>
          <View style={styles.heading}>
            <AppText variant="title" style={styles.pageTitle}>
              {vm.activeTab === "seguridad" ? "Seguridad" : "Mi perfil"}
            </AppText>
            {vm.activeTab !== "seguridad" ? (
              <AppText variant="auxiliary" color="textSecondary">
                Gestiona tu información personal y preferencias.
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
              <AppCard style={styles.identity}>
                <View style={styles.avatar}>
                  <AppText variant="subtitle" style={styles.avatarText}>
                    {vm.initials}
                  </AppText>
                </View>
                <View style={styles.identityText}><AppText variant="sectionTitle">
                  {vm.perfil.nombreCompleto || vm.perfil.username}
                </AppText><AppText variant="auxiliary" color="textSecondary">Paciente · Tu espacio de bienestar</AppText></View></AppCard>

              <PerfilTabs activeTab={vm.activeTab} onChange={vm.setActiveTab} />

              {vm.error ? (
                <View style={styles.inlineError}>
                  <AppText variant="auxiliary" style={styles.inlineErrorText}>
                    {vm.error}
                  </AppText>
                </View>
              ) : null}

              <AppCard style={styles.panel}>
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
              </AppCard>

              {vm.activeTab === "seguridad" ? <PrivacidadArco perfil={vm.perfil} /> : null}
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
  content: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  heading: {
    gap: 2,
  },
  pageTitle: {
    fontFamily: Fonts.bold,
    color: Colors.text,
  },
  identity: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.softGreen },
  identityText: { flex: 1, gap: Spacing.xs },
  avatar: {
    width: 68,
    height: 68,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.headerGreen,
    borderRadius: Radius.pill,
    backgroundColor: Colors.white,
  },
  avatarText: {
    fontFamily: Fonts.bold,
    color: Colors.primaryGreen,
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
