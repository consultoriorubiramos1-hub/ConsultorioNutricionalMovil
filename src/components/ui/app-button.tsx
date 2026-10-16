import { Pressable, StyleSheet, type PressableProps } from "react-native";

import { Colors, Radius, Spacing } from "@/constants/theme";

import { AppText } from "./app-text";

type AppButtonProps = PressableProps & {
  label: string;
  variant?: "primary" | "secondary";
};

export function AppButton({
  label,
  variant = "primary",
  style,
  disabled,
  ...props
}: AppButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={(state) => [
        styles.base,
        styles[variant],
        state.pressed && styles.pressed,
        disabled && styles.disabled,
        typeof style === "function" ? style(state) : style,
      ]}
      {...props}
    >
      <AppText
        variant="sectionTitle"
        color={variant === "primary" ? "white" : "text"}
        style={variant === "secondary" ? styles.secondaryText : styles.primaryText}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.pill,
  },
  primary: {
    backgroundColor: '#DE5B10',
  },
  secondary: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.primaryOrange,
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.5,
  },
  secondaryText: { color: Colors.secondaryBrown, textAlign: 'center', fontSize: 16 },
  primaryText: { textAlign: 'center', fontSize: 19 },
});
