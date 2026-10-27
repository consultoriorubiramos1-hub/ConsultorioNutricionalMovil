import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { AppButton, AppCard, AppHeader, AppScreen, AppText } from '@/components/ui';
import { Colors, Spacing } from '@/constants/theme';
import { DashboardMenu } from '@/modules/dashboard/components/dashboard-menu';
import { FollowUpCard } from '../components/follow-up-card';
import { NutritionProgress } from '../components/nutrition-progress';
import { ProgressSummary } from '../components/progress-summary';
import { useHistorialViewModel } from '../viewmodels/use-historial-viewmodel';

export function HistorialView() {
  const vm = useHistorialViewModel();
  const cards = !vm.loading && !vm.sessionRequired ? vm.cards : [];
  return (
    <AppScreen scrollable={false} contentContainerStyle={styles.screen}>
      <AppHeader onMenuPress={() => vm.setMenuOpen(true)} expanded={vm.menuOpen} disabled={vm.loggingOut} />
      <FlatList
        style={styles.body}
        data={cards}
        keyExtractor={({ measurement }) => measurement.key}
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
              <AppText variant="title" style={styles.title} accessibilityRole="header">Mi progreso nutricional</AppText>
              <AppText color="textSecondary">Consulta tu peso, grasa corporal, masa muscular y cintura por fecha.</AppText>
            </View>
            {vm.sessionRequired ? (
              <AppCard style={styles.error} accessibilityRole="alert" accessibilityLiveRegion="polite">
                <AppText variant="sectionTitle">Inicia sesión nuevamente</AppText>
                <AppText color="textSecondary">{vm.error ?? 'Tu sesión no es válida o ha expirado.'}</AppText>
                <AppButton label="Iniciar sesión" accessibilityLabel="Iniciar sesión nuevamente" onPress={vm.goToLogin} />
              </AppCard>
            ) : (
              <>
                {vm.error ? (
                  <AppCard style={styles.error} accessibilityRole="alert" accessibilityLiveRegion="polite">
                    <AppText variant="sectionTitle">No se pudo actualizar tu progreso nutricional</AppText>
                    <AppText color="textSecondary">{vm.error}</AppText>
                    {cards.length ? <AppText variant="auxiliary" color="textSecondary">Se muestra la última información consultada.</AppText> : null}
                    <AppButton
                      label="Reintentar"
                      accessibilityLabel="Volver a consultar tu progreso nutricional"
                      accessibilityState={{ disabled: vm.loading || vm.refreshing || vm.loggingOut }}
                      disabled={vm.loading || vm.refreshing || vm.loggingOut}
                      onPress={() => void vm.refreshHistory()}
                    />
                  </AppCard>
                ) : null}
                {vm.loading ? (
                  <View style={styles.state} accessibilityLiveRegion="polite" accessibilityState={{ busy: true }}>
                    <ActivityIndicator size="large" color={Colors.headerGreen} accessibilityLabel="Cargando tu progreso nutricional" />
                    <AppText color="textSecondary">Cargando tu progreso nutricional…</AppText>
                  </View>
                ) : cards.length || !vm.error ? (
                  <>
                    <ProgressSummary indicators={vm.indicators} />
                    <AppText variant="sectionTitle" accessibilityRole="header">Historial de progreso nutricional</AppText>
                    {cards.length ? <AppText variant="auxiliary" color="textSecondary">
                      El borde y su descripción indican el avance respecto al objetivo o referencia disponible; no son un diagnóstico ni una valoración general de salud.
                    </AppText> : (
                      <AppCard style={styles.empty} accessibilityLiveRegion="polite">
                        <AppText variant="sectionTitle">Aún no tienes mediciones registradas.</AppText>
                        <AppText color="textSecondary">Tus mediciones aparecerán aquí cuando estén disponibles.</AppText>
                      </AppCard>
                    )}
                  </>
                ) : null}
              </>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.evaluationContainer}>
            <FollowUpCard measurement={item.measurement} progress={item.progress} />
          </View>
        )}
        ListFooterComponent={cards.length ? <View style={styles.footer}><NutritionProgress evolution={vm.evolution} /></View> : undefined}
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
  listContent: { flexGrow: 1, paddingBottom: Spacing.lg },
  headerContainer: { width: '100%', alignItems: 'center' },
  content: { width: '100%', maxWidth: 560, padding: Spacing.md + 4, gap: Spacing.lg },
  evaluationContainer: { width: '100%', maxWidth: 560, alignSelf: 'center', paddingHorizontal: Spacing.md, marginBottom: Spacing.lg },
  footer: { width: '100%', maxWidth: 560, alignSelf: 'center', paddingHorizontal: Spacing.md },
  heading: { gap: Spacing.sm, paddingVertical: Spacing.sm },
  title: { color: Colors.text },
  state: { minHeight: 200, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  empty: { gap: Spacing.md },
  error: { gap: Spacing.md, borderLeftWidth: 4, borderLeftColor: Colors.primaryOrange },
});
