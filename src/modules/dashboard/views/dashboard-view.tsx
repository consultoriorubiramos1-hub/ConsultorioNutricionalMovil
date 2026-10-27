import { Image } from 'expo-image';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { AppButton, AppCard, AppHeader, AppIcon, AppScreen, AppText, StatusBadge, type IconName } from '@/components/ui';
import { WeightChart } from '@/components/ui/weight-chart';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { DashboardMenu } from '../components/dashboard-menu';
import { useDashboardViewModel } from '../viewmodels/use-dashboard-viewmodel';

function formatDate(value: string): string {
  return new Date(value + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
}
const weight = (value: number | null | undefined) => value == null ? '—' : value.toFixed(1) + ' kg';

export function DashboardView() {
  const vm = useDashboardViewModel();
  const health = vm.data?.health;
  const plan = vm.data?.plan;
  const warnings = [vm.error, ...(vm.data?.errors ?? [])].filter((value): value is string => Boolean(value));
  const change = health?.weightChange;
  const links = [
    { label: 'Mi plan', route: '/plan-alimenticio', icon: 'fork' },
    { label: 'Mi progreso nutricional', route: '/historial', icon: 'chart' },
    { label: 'Perfil', route: '/perfil', icon: 'user' },
  ] as const;
  return (
    <AppScreen scrollable={false} contentContainerStyle={styles.screen}>
      <AppHeader onMenuPress={() => vm.setMenuOpen(true)} expanded={vm.menuOpen} disabled={vm.loggingOut} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} refreshControl={<RefreshControl refreshing={vm.loading && vm.data !== null} onRefresh={() => void vm.cargarDashboard()} tintColor={Colors.primaryGreen} colors={[Colors.primaryGreen]} />}>
        <View style={styles.content}>
          <View style={styles.hero}>
            <View style={styles.greeting}>
              <AppText color="textSecondary" style={styles.hello}>Hola,</AppText>
              <AppText variant="title" style={styles.name}>{health?.patientName || 'bienvenido'}</AppText>
              <AppText color="textSecondary">Tu bienestar es un proceso, y vas por muy buen camino.</AppText>
            </View>
            <Image source={require('../../../../assets/images/nutrition-bowl.jpg')} style={styles.heroImage} contentFit="cover" accessible={false} />
          </View>
          {vm.loading && !vm.data ? <View style={styles.state} accessibilityLiveRegion="polite"><ActivityIndicator size="large" color={Colors.primaryGreen} /><AppText color="textSecondary">Cargando tu información…</AppText></View> : <>
            {warnings.length ? <AppCard style={styles.error} accessibilityLiveRegion="polite"><AppText variant="sectionTitle">No se pudo cargar toda la información</AppText>{warnings.map((message, i) => <AppText key={i} color="textSecondary">{message}</AppText>)}<AppButton label="Reintentar" disabled={vm.loading || vm.loggingOut} onPress={() => void vm.cargarDashboard()} /></AppCard> : null}
            {vm.data ? <>
              {health ? <>
                <View style={styles.metrics}>
                  <AppCard style={[styles.metric, styles.green]}>
                    <MetricIcon name="weight" />
                    <AppText color="textSecondary">Peso actual</AppText>
                    <AppText variant="title" style={styles.value}>{weight(health.currentWeight)}</AppText>
                    {change != null ? <AppText style={styles.change}>{change > 0 ? '+' : ''}{change.toFixed(1)} kg</AppText> : null}
                    <AppText variant="auxiliary" color="textSecondary">{change != null ? 'desde el primer registro' : 'Sin comparación disponible'}</AppText>
                  </AppCard>
                  <AppCard style={[styles.metric, styles.orange]}>
                    <MetricIcon name="chart" orange />
                    <AppText color="textSecondary">IMC</AppText>
                    <AppText variant="title" style={styles.value}>{health.imc?.toFixed(1) ?? '—'}</AppText>
                    {health.imcCategory ? <StatusBadge label={health.imcCategory} tone={health.imcCategory === 'Saludable' ? 'green' : 'orange'} /> : <AppText variant="auxiliary" color="textSecondary">Sin peso o estatura registrados</AppText>}
                    {health.imc !== null ? <AppText variant="auxiliary" color="textSecondary">kg/m² · Referencia para adultos</AppText> : null}
                  </AppCard>
                </View>
                {health.lastMeasurementDate ? <AppText variant="auxiliary" color="textSecondary">Última medición: {formatDate(health.lastMeasurementDate)}</AppText> : null}
                {health.imcCategory && health.imcCategory !== 'Saludable' ? <AppCard style={styles.orange}><AppText variant="sectionTitle">Tu evaluación nutricional</AppText><AppText color="textSecondary">Tu clasificación de IMC es {health.imcCategory}. Revisa este resultado con tu nutrióloga durante tu seguimiento.</AppText></AppCard> : null}
              </> : null}
              <AppCard style={styles.card}>
                <View style={styles.cardHeading}><MetricIcon name="plan" /><View style={styles.flex}><AppText color="textSecondary">Plan alimenticio</AppText><AppText variant="sectionTitle">{plan?.name || (plan ? 'Tu plan personalizado' : 'Tu alimentación, a tu medida')}</AppText></View></View>
                <AppText color="textSecondary">{plan?.description || (plan ? 'Consulta tus menús y horarios de comida.' : vm.data.planAvailable ? 'Aún no tienes un plan alimenticio activo.' : 'Consulta la disponibilidad de tu plan en el módulo de alimentación.')}</AppText>
                <AppButton label="Ver mi plan" onPress={() => vm.navigate('/plan-alimenticio')} />
              </AppCard>
              {health ? <>
                <View style={styles.sectionHeading}><AppText variant="sectionTitle">Mi progreso nutricional</AppText><Pressable accessibilityRole="button" accessibilityLabel="Ver mi progreso nutricional" onPress={() => vm.navigate('/historial')} style={styles.textLink}><AppText style={styles.link}>Ver progreso</AppText><AppIcon name="chevron" size={16} color={Colors.secondaryBrown} /></Pressable></View>
                <WeightChart measurements={health.measurements} />
                <AppCard style={styles.card}>
                  <View style={styles.comparison}><View style={styles.flex}><AppText color="textSecondary" variant="auxiliary">Peso inicial</AppText><AppText variant="sectionTitle">{weight(health.initialWeight)}</AppText></View><AppIcon name="chevron" /><View style={styles.flex}><AppText color="textSecondary" variant="auxiliary">Peso actual</AppText><AppText variant="sectionTitle">{weight(health.currentWeight)}</AppText></View></View>
                  {health.weightChangePercent != null ? <AppText variant="auxiliary" color="textSecondary">{Math.abs(health.weightChangePercent).toFixed(1)}% de variación · {health.measurements.length} mediciones</AppText> : <AppText color="textSecondary" variant="auxiliary">La comparación estará disponible a partir de dos mediciones.</AppText>}
                </AppCard>
              </> : null}
              <AppText variant="sectionTitle">Accesos rápidos</AppText>
              <View style={styles.quickLinks}>{links.map((item) => <Pressable key={item.route} accessibilityRole="button" onPress={() => vm.navigate(item.route)} style={({ pressed }) => [styles.quickLink, pressed && styles.pressed]}><MetricIcon name={item.icon} orange={item.icon === 'chart'} /><AppText variant="auxiliary" style={styles.quickLabel}>{item.label}</AppText></Pressable>)}</View>
            </> : null}
          </>}
        </View>
      </ScrollView>
      <DashboardMenu visible={vm.menuOpen} loggingOut={vm.loggingOut} onClose={() => vm.setMenuOpen(false)} onNavigate={vm.navigate} onLogout={() => void vm.cerrarSesion()} />
    </AppScreen>
  );
}
function MetricIcon({ name, orange = false }: { name: IconName; orange?: boolean }) {
  return <View style={[styles.icon, { backgroundColor: orange ? Colors.softOrange : Colors.softGreen }]}><AppIcon name={name} color={orange ? Colors.primaryOrange : Colors.primaryGreen} /></View>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, padding: 0 },
  scroll: { flexGrow: 1, alignItems: 'center' },
  content: { width: '100%', maxWidth: 560, padding: 20, gap: Spacing.md },
  hero: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center', paddingVertical: Spacing.sm },
  greeting: { flex: 1, gap: Spacing.sm, zIndex: 1 },
  hello: { fontSize: 24, lineHeight: 30 },
  name: { fontSize: 38, lineHeight: 44 },
  heroImage: { width: '36%', height: 180, borderRadius: 28 },
  state: { minHeight: 240, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  metric: { flexGrow: 1, flexBasis: '45%', minWidth: 130, padding: Spacing.md, gap: Spacing.sm },
  green: { backgroundColor: '#F6FAF0' },
  orange: { backgroundColor: '#FFFAF5', gap: Spacing.sm },
  value: { fontSize: 30, lineHeight: 36 },
  change: { color: Colors.primaryGreen, fontFamily: Fonts.bold },
  card: { gap: Spacing.md },
  cardHeading: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },
  flex: { flex: 1, gap: Spacing.xs },
  icon: { width: 44, height: 44, borderRadius: Radius.pill, justifyContent: 'center', alignItems: 'center' },
  error: { gap: Spacing.md, borderColor: '#F9D4B8' },
  comparison: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', alignItems: 'center', marginTop: Spacing.sm },
  textLink: { flexDirection: 'row', alignItems: 'center', minHeight: 44, gap: Spacing.xs },
  link: { color: Colors.secondaryBrown, fontSize: 14 },
  quickLinks: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, paddingBottom: Spacing.md },
  quickLink: { flexBasis: '28%', flexGrow: 1, minWidth: 100, minHeight: 100, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, padding: Spacing.sm, borderRadius: Radius.lg, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border },
  quickLabel: { textAlign: 'center' },
  pressed: { opacity: 0.7 },
});
