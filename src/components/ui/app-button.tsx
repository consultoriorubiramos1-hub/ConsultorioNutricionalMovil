import { Pressable, StyleSheet, type PressableProps } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';

import { AppText } from './app-text';

type AppButtonProps = PressableProps & {
  label: string;
  variant?: 'primary' | 'secondary';
};

export function AppButton({ label, variant = 'primary', style, disabled, ...props }: AppButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && styles.pressed,
        disabled && styles.disabled,
        typeof style === 'function' ? style({ pressed }) : style,
      ]}
      {...props}>
      <AppText variant="sectionTitle" color={variant === 'primary' ? 'white' : 'text'}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
  },
  primary: {
    backgroundColor: Colors.secondaryBrown,
  },
  secondary: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.5,
  },
});
