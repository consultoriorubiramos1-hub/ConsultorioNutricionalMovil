import { StyleSheet, View } from "react-native";

import { AppCard, AppText } from "@/components/ui";
import { Spacing } from "@/constants/theme";
import type { InitialEvaluation as InitialEvaluationModel, InitialSection, InitialSectionKey } from "../models/historial.model";
import { formatHistoryDate } from "../utils/historial-format";
import { HistoryAccordion } from "./history-accordion";
import { HistoryFields } from "./history-fields";

interface InitialEvaluationProps {
  evaluation: InitialEvaluationModel | null;
  sections: InitialSection[];
  expandedSections: ReadonlySet<InitialSectionKey>;
  disabled: boolean;
  onToggle: (key: InitialSectionKey) => void;
}

export function InitialEvaluation({ evaluation, sections, expandedSections, disabled, onToggle }: InitialEvaluationProps) {
  if (!evaluation) return (
    <AppCard style={styles.section} accessibilityLiveRegion="polite">
      <AppText variant="sectionTitle">Aún no tienes un registro inicial de hábitos.</AppText>
      <AppText color="textSecondary">Tus hábitos aparecerán aquí cuando estén registrados.</AppText>
    </AppCard>
  );
  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <AppText variant="sectionTitle" accessibilityRole="header">Registro inicial</AppText>
        <AppText color="textSecondary">Fecha: {formatHistoryDate(evaluation.evaluationDate)}</AppText>
      </View>
      {sections.length ? sections.map((section) => (
        <HistoryAccordion
          key={section.key}
          title={section.title}
          expanded={expandedSections.has(section.key)}
          disabled={disabled}
          onToggle={() => onToggle(section.key)}
        >
          <HistoryFields fields={section.fields} />
        </HistoryAccordion>
      )) : (
        <AppCard><AppText color="textSecondary">El registro inicial aún no incluye hábitos de bienestar.</AppText></AppCard>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.md },
  heading: { gap: Spacing.xs },
});
