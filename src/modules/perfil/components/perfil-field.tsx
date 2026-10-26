import { useState, type ReactNode } from "react";
import { Pressable, StyleSheet, TextInput, View, type TextInputProps, type StyleProp, type ViewStyle } from "react-native";

import { AppIcon, AppText, type IconName } from "@/components/ui";
import { Colors, Fonts, FontSizes, Radius, Spacing } from "@/constants/theme";

type PerfilFieldProps = TextInputProps & {
  label: string;
  helper?: ReactNode;
  icon?: IconName;
  containerStyle?: StyleProp<ViewStyle>;
};

export function PerfilField({
  label,
  helper,
  style,
  secureTextEntry,
  icon,
  containerStyle,
  ...props
}: PerfilFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.container, containerStyle]}>
      <AppText variant="auxiliary" style={styles.label}>
        {label}
      </AppText>
      <View style={[styles.inputRow, focused && styles.focused]}>
      {icon || secureTextEntry ? <View style={styles.icon}><AppIcon name={icon ?? 'lock'} size={20} /></View> : null}
      <TextInput
        accessibilityLabel={label}
        secureTextEntry={secureTextEntry && !showPassword}
        placeholderTextColor={Colors.textSecondary}
        selectionColor={Colors.headerGreen}
        style={[styles.input, style]}
        {...props}
        onFocus={(event) => { setFocused(true); props.onFocus?.(event); }}
        onBlur={(event) => { setFocused(false); props.onBlur?.(event); }}
      />
      {secureTextEntry ? <Pressable accessibilityRole="button" accessibilityLabel={(showPassword ? 'Ocultar ' : 'Mostrar ') + label.toLowerCase()} onPress={() => setShowPassword(!showPassword)} style={styles.toggle}><AppIcon name={showPassword ? 'eyeOff' : 'eye'} size={20} /></Pressable> : null}
      </View>
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
    fontSize: 14,
    color: Colors.textSecondary,
  },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: 52,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: Colors.text,
    fontFamily: Fonts.regular,
    fontSize: FontSizes.body,
  },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, backgroundColor: Colors.white },
  focused: { borderColor: Colors.accentGreen },
  toggle: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  icon: { paddingLeft: Spacing.md },
  helper: {
    minHeight: 18,
  },
});
