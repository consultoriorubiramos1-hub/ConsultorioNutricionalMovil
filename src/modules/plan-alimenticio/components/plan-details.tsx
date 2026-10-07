import { Pressable, StyleSheet, View } from "react-native";

import { AppCard, AppText } from "@/components/ui";
import { Colors, Radius, Spacing } from "@/constants/theme";
import { MEAL_TYPES, MENU_TYPES, type MenuType, type NutritionPlan } from "../models/plan-alimenticio.model";
import { formatDays, formatMealTime, formatPlanDate, MEAL_LABELS, menuLabel } from "../utils/plan-alimenticio-format";

interface PlanDetailsProps {
  plan: NutritionPlan;
  selectedMenu: MenuType | null;
  menuOfToday: MenuType | null;
  disabled: boolean;
  onSelectMenu: (menu: MenuType) => void;
}

export function PlanDetails({ plan, selectedMenu, menuOfToday, disabled, onSelectMenu }: PlanDetailsProps) {
  const menus = MENU_TYPES.filter((type) => plan.menus[type]);
  const selected = selectedMenu ? plan.menus[selectedMenu] : undefined;
  return (
    <>
      <AppCard style={styles.summary}>
        <AppText variant="sectionTitle" accessibilityRole="header">Mi plan alimenticio</AppText>
        {plan.name ? <AppText variant="subtitle">{plan.name}</AppText> : null}
        {plan.description ? <AppText color="textSecondary">{plan.description}</AppText> : null}
        <View style={styles.dates}>
          <AppText variant="auxiliary">Inicio: {formatPlanDate(plan.startDate)}</AppText>
          <AppText variant="auxiliary">Fin: {formatPlanDate(plan.endDate)}</AppText>
        </View>
      </AppCard>
      <View style={styles.section}>
        <AppText variant="sectionTitle" accessibilityRole="header">Mis horarios de comidas</AppText>
        <AppCard style={styles.schedule}>
          {MEAL_TYPES.map((type, index) => (
            <View key={type} style={[styles.timeRow, index > 0 && styles.divider]}>
              <AppText variant="auxiliary" style={styles.mealLabel}>{MEAL_LABELS[type]}</AppText>
              <AppText>{formatMealTime(type, plan.mealTimes[type])}</AppText>
            </View>
          ))}
        </AppCard>
      </View>
      <View style={styles.section}>
        <AppText variant="sectionTitle" accessibilityRole="header">Mi plan por días</AppText>
        {menus.length ? (
          <View style={styles.tabs} accessibilityRole="tablist" accessibilityLabel="Menús de tu plan alimenticio">
            {menus.map((type) => {
              const days = formatDays(plan.menus[type]?.days ?? []);
              const isSelected = selectedMenu === type;
              return (
                <Pressable
                  key={type}
                  accessibilityRole="tab"
                  accessibilityLabel={menuLabel(type) + ", " + days + (menuOfToday === type ? ", menú de hoy" : "")}
                  accessibilityState={{ selected: isSelected, disabled }}
                  disabled={disabled}
                  onPress={() => onSelectMenu(type)}
                  style={({ pressed }) => [styles.tab, isSelected && styles.selectedTab, pressed && styles.pressed]}
                >
                  <AppText variant="sectionTitle" color={isSelected ? "white" : "text"}>{menuLabel(type)}</AppText>
                  <AppText variant="auxiliary" color={isSelected ? "white" : "textSecondary"}>{days}</AppText>
                  {menuOfToday === type ? <AppText variant="auxiliary" color={isSelected ? "white" : "text"}>Menú de hoy</AppText> : null}
                </Pressable>
              );
            })}
          </View>
        ) : (
          <AppCard><AppText color="textSecondary">Tu plan aún no incluye indicaciones por menú.</AppText></AppCard>
        )}
        {selected && selectedMenu ? (
          <View style={styles.section}>
            <View style={styles.selectionHeading} accessibilityLiveRegion="polite">
              <AppText variant="subtitle" accessibilityRole="header">{menuLabel(selectedMenu)}</AppText>
              <AppText color="textSecondary">{formatDays(selected.days)}</AppText>
            </View>
            {MEAL_TYPES.map((type) => (
              <AppCard key={type} style={styles.mealCard}>
                <AppText variant="sectionTitle" style={styles.mealTitle} accessibilityRole="header">{MEAL_LABELS[type]}</AppText>
                <AppText color={selected.meals[type]?.description ? "text" : "textSecondary"} selectable>
                  {selected.meals[type]?.description ?? "Sin indicaciones para esta comida."}
                </AppText>
              </AppCard>
            ))}
          </View>
        ) : null}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  summary: { gap: Spacing.sm },
  dates: { gap: Spacing.xs, marginTop: Spacing.sm },
  section: { gap: Spacing.md },
  schedule: { padding: Spacing.md },
  timeRow: { gap: Spacing.xs, paddingVertical: Spacing.sm },
  divider: { borderTopWidth: 1, borderTopColor: Colors.border, marginTop: Spacing.sm, paddingTop: Spacing.md },
  mealLabel: { color: Colors.darkGreen },
  tabs: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  tab: {
    flexBasis: "47%", flexGrow: 1, minWidth: 120, minHeight: 88,
    padding: Spacing.md, gap: Spacing.xs, borderWidth: 1,
    borderColor: Colors.border, borderRadius: Radius.md, backgroundColor: Colors.white,
  },
  selectedTab: { backgroundColor: Colors.headerGreen, borderColor: Colors.headerGreen },
  selectionHeading: { gap: Spacing.xs },
  mealCard: { padding: Spacing.md, gap: Spacing.md },
  mealTitle: { borderBottomWidth: 1, borderBottomColor: Colors.border, paddingBottom: Spacing.sm },
  pressed: { opacity: 0.7 },
});
