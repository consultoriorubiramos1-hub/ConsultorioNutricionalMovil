import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui";
import { Spacing } from "@/constants/theme";
import type { DisplayField } from "../models/historial.model";

export function HistoryFields({ fields, compact = false }: { fields: DisplayField[]; compact?: boolean }) {
  return (
    <View style={[styles.fields, compact && styles.compact]}>
      {fields.map((field) => (
        <View key={field.label} style={[styles.field, compact && styles.compactField]}>
          <AppText variant="auxiliary" color="textSecondary">{field.label}</AppText>
          <AppText selectable>{field.value}</AppText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  fields: { gap: Spacing.md },
  field: { gap: Spacing.xs },
  compact: { flexDirection: "row", flexWrap: "wrap" },
  compactField: { flexBasis: "45%", flexGrow: 1, minWidth: 110 },
});
