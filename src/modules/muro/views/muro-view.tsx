import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, RefreshControl, StyleSheet, View } from "react-native";

import { AppButton, AppCard, AppScreen, AppText } from "@/components/ui";
import { Colors, Radius, Spacing } from "@/constants/theme";
import { DashboardMenu } from "@/modules/dashboard/components/dashboard-menu";
import { PostCard } from "../components/post-card";
import { PostSearch } from "../components/post-search";
import { useMuroViewModel } from "../viewmodels/use-muro-viewmodel";

export function MuroView() {
  const vm = useMuroViewModel();
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
          <View style={styles.menuLine} /><View style={styles.menuLine} /><View style={styles.menuLine} />
        </Pressable>
      </View>
      <KeyboardAvoidingView style={styles.body} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <FlatList
          data={vm.sessionRequired || vm.loading ? [] : vm.posts}
          keyExtractor={(post) => String(post.id)}
          extraData={vm.likingPostIds}
          contentContainerStyle={styles.listContent}
          ListHeaderComponentStyle={styles.headerContainer}
          initialNumToRender={4}
          maxToRenderPerBatch={4}
          windowSize={7}
          removeClippedSubviews={false}
          keyboardShouldPersistTaps="handled"
          alwaysBounceVertical
          refreshControl={
            <RefreshControl
              refreshing={vm.refreshing}
              enabled={!vm.loading && !vm.loggingOut && !vm.sessionRequired && vm.likingPostIds.size === 0}
              onRefresh={() => void vm.refreshPosts()}
              tintColor={Colors.headerGreen}
              colors={[Colors.headerGreen]}
            />
          }
          ListHeaderComponent={
            <View style={styles.content}>
              <View style={styles.heading}>
                <AppText variant="title" style={styles.title} accessibilityRole="header">Muro informativo</AppText>
                <AppText color="textSecondary">Consulta información importante y novedades del consultorio.</AppText>
              </View>
              {vm.sessionRequired ? (
                <AppCard style={styles.error} accessibilityRole="alert" accessibilityLiveRegion="polite">
                  <AppText variant="sectionTitle">Inicia sesión nuevamente</AppText>
                  <AppText color="textSecondary">{vm.error ?? "Tu sesión no es válida o ha expirado."}</AppText>
                  <AppButton label="Iniciar sesión" accessibilityLabel="Iniciar sesión nuevamente" onPress={vm.goToLogin} />
                </AppCard>
              ) : (
                <>
                  <PostSearch
                    value={vm.searchInput}
                    activeSearch={vm.activeSearch}
                    disabled={vm.searchBusy}
                    onChange={vm.updateSearchInput}
                    onSearch={vm.search}
                    onClear={vm.clearSearch}
                  />
                  {vm.error ? (
                    <AppCard style={styles.error} accessibilityRole="alert" accessibilityLiveRegion="polite">
                      <AppText variant="sectionTitle">No se pudieron actualizar las publicaciones</AppText>
                      <AppText color="textSecondary">{vm.error}</AppText>
                      {vm.posts.length ? <AppText variant="auxiliary" color="textSecondary">Se muestra la última información consultada.</AppText> : null}
                      <AppButton label="Reintentar" accessibilityLabel="Volver a consultar publicaciones" accessibilityState={{ disabled: vm.searchBusy }} disabled={vm.searchBusy} onPress={() => void vm.refreshPosts()} />
                    </AppCard>
                  ) : null}
                  {vm.loading ? (
                    <View style={styles.state} accessibilityLiveRegion="polite" accessibilityState={{ busy: true }}>
                      <ActivityIndicator size="large" color={Colors.headerGreen} accessibilityLabel="Cargando publicaciones" />
                      <AppText color="textSecondary">Cargando publicaciones…</AppText>
                    </View>
                  ) : !vm.error && vm.posts.length === 0 ? (
                    <AppCard style={styles.empty} accessibilityLiveRegion="polite">
                      <AppText variant="sectionTitle">{vm.activeSearch ? "No encontramos publicaciones para tu búsqueda." : "No hay publicaciones disponibles."}</AppText>
                      {vm.activeSearch ? (
                        <AppButton label="Limpiar búsqueda" variant="secondary" accessibilityState={{ disabled: vm.searchBusy }} disabled={vm.searchBusy} onPress={vm.clearSearch} />
                      ) : <AppText color="textSecondary">Pronto habrá novedades del consultorio.</AppText>}
                    </AppCard>
                  ) : null}
                </>
              )}
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.postContainer}>
              <PostCard
                post={item}
                liking={vm.likingPostIds.has(item.id)}
                likeDisabled={vm.loggingOut || vm.loading || vm.refreshing}
                disabled={vm.loggingOut}
                error={vm.postErrors[item.id]}
                onLike={() => void vm.toggleLike(item.id)}
                onOpenLink={(url) => void vm.openLink(item.id, url)}
              />
            </View>
          )}
        />
      </KeyboardAvoidingView>
      <DashboardMenu
        activeRoute="/muro"
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
    flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: Spacing.sm, backgroundColor: Colors.headerGreen,
  },
  brand: { flexShrink: 1 },
  menuButton: { minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center", gap: Spacing.xs },
  menuLine: { width: 22, height: 2, borderRadius: Radius.pill, backgroundColor: Colors.white },
  listContent: { flexGrow: 1, paddingBottom: Spacing.lg },
  headerContainer: { width: "100%", alignItems: "center" },
  content: { width: "100%", maxWidth: 560, padding: Spacing.md, gap: Spacing.lg },
  postContainer: { width: "100%", maxWidth: 560, alignSelf: "center", paddingHorizontal: Spacing.md, marginBottom: Spacing.lg },
  heading: { gap: Spacing.sm, paddingVertical: Spacing.sm },
  title: { color: Colors.headerGreen },
  state: { minHeight: 200, alignItems: "center", justifyContent: "center", gap: Spacing.md },
  empty: { gap: Spacing.md },
  error: { gap: Spacing.md, borderLeftWidth: 4, borderLeftColor: Colors.primaryOrange },
  pressed: { opacity: 0.7 },
});
