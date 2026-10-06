import { router } from 'expo-router';
import { StyleSheet, TextInput, View } from 'react-native';

import { AppButton, AppCard, AppScreen, AppText } from '@/components/ui';
import { Colors, Fonts, FontSizes, Radius, Spacing } from '@/constants/theme';

export default function LoginScreen() {
  return (
    <AppScreen contentContainerStyle={styles.screen}>
      <AppCard style={styles.card}>
        <View style={styles.header}>
          <AppText variant="title" color="white" style={styles.brand}>
            Rubí Ramos
          </AppText>
          <AppText color="white">Consultorio Nutricional</AppText>
        </View>

        <View style={styles.form}>
          <AppText variant="subtitle" style={styles.formTitle}>
            Iniciar sesión
          </AppText>
          <AppText variant="auxiliary" color="textSecondary">
            Ingresa tus datos para continuar
          </AppText>

          <View style={styles.fields}>
            <TextInput
              accessibilityLabel="Usuario"
              autoCapitalize="none"
              placeholder="Usuario"
              placeholderTextColor={Colors.textSecondary}
              style={styles.input}
            />
            <TextInput
              accessibilityLabel="Contraseña"
              placeholder="Contraseña"
              placeholderTextColor={Colors.textSecondary}
              secureTextEntry
              style={styles.input}
            />
          </View>

          <AppButton label="Entrar" onPress={() => router.replace('/inicio')} />
        </View>
      </AppCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    padding: 0,
    overflow: 'hidden',
  },
  header: {
    padding: Spacing.xl,
    backgroundColor: Colors.primaryGreen,
  },
  brand: {
    marginBottom: Spacing.xs,
  },
  form: {
    padding: Spacing.xl,
  },
  formTitle: {
    fontFamily: Fonts.bold,
    marginBottom: Spacing.xs,
  },
  fields: {
    gap: Spacing.md,
    marginVertical: Spacing.lg,
  },
  input: {
    minHeight: 52,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    backgroundColor: Colors.background,
    color: Colors.text,
    fontFamily: Fonts.regular,
    fontSize: FontSizes.body,
  },
});
