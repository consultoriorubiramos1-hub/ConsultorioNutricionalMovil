import type { ReactNode } from "react";
import { StyleSheet, TextInput, View, type TextInputProps } from "react-native";

import { AppText } from "@/components/ui";
import { Colors, Fonts, FontSizes, Radius, Spacing } from "@/constants/theme";

type PerfilFieldProps = TextInputProps & {
  label: string;
  helper?: ReactNode;
};

export function PerfilField({
  label,
  helper,
  style,
  ...props
}: PerfilFieldProps) {
  return (
    <View style={styles.container}>
      <AppText variant="auxiliary" style={styles.label}>
        {label}
      </AppText>
      <TextInput
        placeholderTextColor={Colors.textSecondary}
        selectionColor={Colors.headerGreen}
        style={[styles.input, style]}
        {...props}
      />
      {helper ? <View style={styles.helper}>{helper}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.xs,
  },
  label: {
    fontFamily: Fonts.bold,
    fontSize: 13,
  },
  input: {
    minHeight: 48,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    backgroundColor: Colors.white,
    color: Colors.text,
    fontFamily: Fonts.regular,
    fontSize: FontSizes.body,
  },
  helper: {
    minHeight: 18,
  },
});
