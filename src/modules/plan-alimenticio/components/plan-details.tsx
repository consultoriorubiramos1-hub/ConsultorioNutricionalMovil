import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppButton, AppCard, AppHeader, AppIcon, AppScreen, AppText, StatusBadge, type IconName } from '@/components/ui';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { MEAL_TYPES, MENU_TYPES, type MealType, type MenuType, type NutritionPlan } from '../models/plan-alimenticio.model';
import { formatDays, formatMealTime, formatPlanDate, MEAL_LABELS, menuLabel } from '../utils/plan-alimenticio-format';

interface PlanDetailsProps {
  plan: NutritionPlan; selectedMenu: MenuType | null; menuOfToday: MenuType | null;
  disabled: boolean; onSelectMenu: (menu: MenuType) => void;
}
const mealIcons: Record<MealType, IconName> = { DESAYUNO: 'bowl', ALMUERZO: 'fork', COLACION: 'apple', COMIDA: 'fork', CENA: 'moon' };

export function PlanDetails({ plan, selectedMenu, menuOfToday, disabled, onSelectMenu }: PlanDetailsProps) {
  const [detail, setDetail] = useState<MealType | null>(null);
  const menus = MENU_TYPES.filter((type) => plan.menus[type]);
  const selected = selectedMenu ? plan.menus[selectedMenu] : undefined;
  return <>
    <AppCard style={styles.summary}>
      {plan.isActive === true ? <StatusBadge label="Plan activo" tone="green" /> : null}
      <AppText variant="sectionTitle" accessibilityRole="header">{plan.name || 'Mi plan alimenticio'}</AppText>
      {plan.description ? <AppText color="textSecondary">{plan.description}</AppText> : null}
      <View style={styles.dates}><AppIcon name="calendar" size={16} /><AppText variant="auxiliary" color="textSecondary">{formatPlanDate(plan.startDate)} — {formatPlanDate(plan.endDate)}</AppText></View>
    </AppCard>
    <View style={styles.section}>
      <AppText variant="sectionTitle" accessibilityRole="header">Tus horarios de comida</AppText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.schedule}>
        {MEAL_TYPES.map((type, index) => <View key={type} style={[styles.timeCard, { backgroundColor: index === 0 ? Colors.softGreen : '#FFFAF5' }]}><AppIcon name={mealIcons[type]} color={index === 0 ? Colors.primaryGreen : Colors.primaryOrange} size={26} /><AppText variant="auxiliary">{MEAL_LABELS[type]}</AppText><AppText variant="auxiliary" color="textSecondary" style={styles.timeText}>{formatMealTime(type, plan.mealTimes[type])}</AppText></View>)}
      </ScrollView>
    </View>
    <View style={styles.section}>
      {menus.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs} accessibilityRole="tablist" accessibilityLabel="Menús de tu plan alimenticio">
        {menus.map((type) => <Pressable key={type} accessibilityRole="tab" accessibilityLabel={menuLabel(type) + ', ' + formatDays(plan.menus[type]?.days ?? []) + (menuOfToday === type ? ', menú de hoy' : '')} accessibilityState={{ selected: selectedMenu === type, disabled }} disabled={disabled} onPress={() => onSelectMenu(type)} style={({ pressed }) => [styles.tab, selectedMenu === type && styles.selectedTab, pressed && styles.pressed]}><AppText variant="auxiliary" style={selectedMenu === type ? styles.selectedText : undefined}>{menuLabel(type)}</AppText></Pressable>)}
      </ScrollView> : <AppCard><AppText color="textSecondary">Tu plan aún no incluye indicaciones por menú.</AppText></AppCard>}
      {selected && selectedMenu ? <>
        <View style={styles.selectionHeading} accessibilityLiveRegion="polite"><AppText variant="sectionTitle">{menuLabel(selectedMenu)}</AppText><AppText variant="auxiliary" color="textSecondary">{formatDays(selected.days)}{menuOfToday === selectedMenu ? ' · Menú de hoy' : ''}</AppText></View>
        {MEAL_TYPES.map((type, index) => {
          const description = selected.meals[type]?.description;
          return <AppCard key={type} style={styles.mealCard}>
            <View style={styles.mealHeading}><View style={[styles.icon, { backgroundColor: index === 0 ? Colors.softGreen : Colors.softOrange }]}><AppIcon name={mealIcons[type]} color={index === 0 ? Colors.primaryGreen : Colors.primaryOrange} size={28} /></View><View style={styles.flex}><AppText variant="sectionTitle" accessibilityRole="header">{MEAL_LABELS[type]}</AppText><View style={styles.dates}><AppIcon name="clock" size={14} /><AppText variant="auxiliary" color="textSecondary">{formatMealTime(type, plan.mealTimes[type])}</AppText></View></View></View>
            <AppText color={description ? 'text' : 'textSecondary'} numberOfLines={4}>{description ?? 'Sin indicaciones para esta comida.'}</AppText>
            {description ? <AppButton label="Ver preparación" accessibilityLabel={'Ver preparación de ' + MEAL_LABELS[type].toLowerCase()} disabled={disabled} onPress={() => setDetail(type)} style={styles.preparationButton} /> : null}
          </AppCard>;
        })}
      </> : null}
    </View>
    <Modal visible={detail !== null && !disabled} animationType="slide" onRequestClose={() => setDetail(null)}>
      <AppScreen contentContainerStyle={styles.detailScreen}>
        <AppHeader onBack={() => setDetail(null)} />
        {detail ? <View style={styles.detailContent}>
          <StatusBadge label={MEAL_LABELS[detail]} tone="green" />
          <AppText variant="title" accessibilityRole="header">Preparación de tu comida</AppText>
          <View style={styles.dates}><AppIcon name="clock" size={18} /><AppText color="textSecondary">{formatMealTime(detail, plan.mealTimes[detail])}</AppText></View>
          <AppCard style={styles.summary}><AppText variant="sectionTitle">Indicaciones de tu plan</AppText><AppText selectable>{selected?.meals[detail]?.description}</AppText></AppCard>
        </View> : null}
      </AppScreen>
    </Modal>
  </>;
}
const styles = StyleSheet.create({
  section: { gap: Spacing.md }, summary: { gap: Spacing.sm },
  dates: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  schedule: { gap: Spacing.sm, paddingBottom: 4 },
  timeCard: { width: 116, minHeight: 118, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', padding: Spacing.sm, gap: Spacing.sm },
  timeText: { textAlign: 'center' },
  tabs: { gap: 4, padding: 4, backgroundColor: Colors.muted, borderRadius: Radius.pill, flexGrow: 1 },
  tab: { minWidth: 90, flexGrow: 1, minHeight: 44, paddingHorizontal: Spacing.md, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
  selectedTab: { backgroundColor: Colors.accentGreen }, selectedText: { color: Colors.darkGreen, fontWeight: '700' },
  selectionHeading: { gap: Spacing.xs },
  mealCard: { gap: Spacing.md }, mealHeading: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  icon: { width: 56, height: 56, borderRadius: Radius.md, justifyContent: 'center', alignItems: 'center' }, flex: { flex: 1, gap: Spacing.xs },
  preparationButton: { alignSelf: 'flex-end', paddingVertical: 10, minHeight: 46 },
  detailScreen: { padding: 0 }, detailContent: { width: '100%', maxWidth: 560, alignSelf: 'center', padding: 20, gap: Spacing.lg },
  pressed: { opacity: 0.7 },
});
