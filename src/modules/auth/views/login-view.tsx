import { router } from "expo-router";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

import { AppButton, AppScreen, AppText } from "@/components/ui";
import { Colors, Fonts, FontSizes, Radius, Spacing } from "@/constants/theme";

import { useLoginViewModel } from "../viewmodels/use-login-view-model";

export function LoginView() {
  const {
    username,
    password,
    loading,
    error,
    setUsername,
    setPassword,
    login,
  } = useLoginViewModel();

  return (
    <AppScreen contentContainerStyle={styles.screen}>
      <View style={styles.header}>
        <View style={styles.brandContainer}>
          <View style={styles.logo}>
            <AppText style={styles.logoText}>R</AppText>
          </View>

          <AppText style={styles.brandName}>Rubí Ramos</AppText>
        </View>

        <View accessibilityLabel="Menú" style={styles.menuIcon}>
          <View style={styles.menuLine} />
          <View style={styles.menuLine} />
          <View style={styles.menuLine} />
        </View>
      </View>

      <View style={styles.content}>
        <AppText variant="title" style={styles.title}>
          Inicio de sesión
        </AppText>

        <AppText color="textSecondary" style={styles.subtitle}>
          Accede a tu espacio personal de seguimiento nutricional.
        </AppText>

        <View style={styles.form}>
          <View style={styles.fieldGroup}>
            <AppText style={styles.label}>Usuario</AppText>

            <TextInput
              accessibilityLabel="Usuario"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
              placeholder="Ingresa tu usuario"
              placeholderTextColor={Colors.textSecondary}
              returnKeyType="next"
              style={styles.input}
              value={username}
              onChangeText={setUsername}
            />
          </View>

          <View style={styles.fieldGroup}>
            <AppText style={styles.label}>Contraseña</AppText>

            <TextInput
              accessibilityLabel="Contraseña"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
              placeholder="Ingresa tu contraseña"
              placeholderTextColor={Colors.textSecondary}
              returnKeyType="done"
              secureTextEntry
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              onSubmitEditing={login}
            />
          </View>

          <Pressable
            accessibilityRole="link"
            disabled={loading}
            onPress={() => router.push("/recuperar-contrasena")}
          >
            <AppText style={styles.forgotPassword}>
              ¿Olvidaste tu contraseña?
            </AppText>
          </Pressable>

          {error ? (
            <View accessibilityRole="alert" style={styles.errorContainer}>
              <AppText style={styles.errorText}>{error}</AppText>
            </View>
          ) : null}

          <AppButton
            disabled={loading}
            label={loading ? "Iniciando sesión..." : "Iniciar sesión"}
            onPress={login}
            style={styles.loginButton}
          />
        </View>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    padding: 0,
    backgroundColor: Colors.background,
  },

  header: {
    minHeight: 74,
    paddingHorizontal: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.darkGreen,
  },

  brandContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },

  logo: {
    width: 42,
    height: 42,
    borderRadius: Radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.white,
  },

  logoText: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.subtitle,
    color: Colors.darkGreen,
  },

  brandName: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.sectionTitle,
    color: Colors.white,
  },

  menuIcon: {
    width: 30,
    gap: 5,
    alignItems: "flex-end",
  },

  menuLine: {
    width: 24,
    height: 2,
    borderRadius: Radius.pill,
    backgroundColor: Colors.white,
  },

  content: {
    width: "100%",
    maxWidth: 500,
    alignSelf: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xxl,
  },

  title: {
    marginBottom: Spacing.sm,
    color: Colors.darkGreen,
  },

  subtitle: {
    marginBottom: Spacing.xl,
    lineHeight: 24,
  },

  form: {
    gap: Spacing.lg,
  },

  fieldGroup: {
    gap: Spacing.sm,
  },

  label: {
    fontFamily: Fonts.bold,
    color: Colors.darkGreen,
  },

  input: {
    minHeight: 54,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    backgroundColor: Colors.white,
    color: Colors.text,
    fontFamily: Fonts.regular,
    fontSize: FontSizes.body,
  },

  forgotPassword: {
    alignSelf: "flex-end",
    fontFamily: Fonts.bold,
    color: Colors.primaryGreen,
  },

  errorContainer: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: "#FCECEC",
  },

  errorText: {
    color: "#A63D3D",
  },

  loginButton: {
    width: "100%",
    backgroundColor: Colors.secondaryBrown,
  },
});
