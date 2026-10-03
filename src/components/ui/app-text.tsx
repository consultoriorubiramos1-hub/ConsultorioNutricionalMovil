import { StyleSheet, Text, type TextProps } from 'react-native';

import { Colors, Fonts, FontSizes } from '@/constants/theme';

export type AppTextVariant = 'title' | 'subtitle' | 'sectionTitle' | 'body' | 'auxiliary';

type AppTextProps = TextProps & {
  variant?: AppTextVariant;
  color?: keyof Pick<typeof Colors, 'text' | 'textSecondary' | 'white'>;
};

export function AppText({ variant = 'body', color = 'text', style, ...props }: AppTextProps) {
  return <Text style={[styles.base, styles[variant], { color: Colors[color] }, style]} {...props} />;
}

const styles = StyleSheet.create({
  base: {
    fontFamily: Fonts.regular,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.title,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: FontSizes.subtitle,
    lineHeight: 28,
  },
  sectionTitle: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.sectionTitle,
    lineHeight: 24,
  },
  body: {
    fontSize: FontSizes.body,
    lineHeight: 24,
  },
  auxiliary: {
    fontSize: FontSizes.auxiliary,
    lineHeight: 20,
  },
});
