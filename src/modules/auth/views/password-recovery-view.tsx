import { router } from "expo-router";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

import { AppButton, AppScreen, AppText } from "@/components/ui";
import { Colors, Fonts, FontSizes, Radius, Spacing } from "@/constants/theme";

import { usePasswordRecoveryViewModel } from "../viewmodels/use-password-recovery-view-model";

export function PasswordRecoveryView() {
  const {
    step,
    username,
    email,
    code,
    newPassword,
    confirmPassword,
    loading,
    error,
    setUsername,
    setCode,
    setNewPassword,
    setConfirmPassword,
    sendCode,
    verifyCode,
    changePassword,
    restart,
  } = usePasswordRecoveryViewModel();

  return (
    <AppScreen contentContainerStyle={styles.screen}>
      <View style={styles.header}>
        <View style={styles.brandContainer}>
          <View style={styles.logo}>
            <AppText style={styles.logoText}>R</AppText>
          </View>

          <AppText style={styles.brandName}>Rubí Ramos</AppText>
        </View>
      </View>

      <View style={styles.content}>
        {step !== "success" ? (
          <>
            <Pressable
              accessibilityRole="button"
              disabled={loading}
              onPress={() => router.replace("/login")}
              style={styles.backButton}
            >
              <AppText style={styles.backText}>
                ← Volver al inicio de sesión
              </AppText>
            </Pressable>

            <AppText variant="title" style={styles.title}>
              Recuperar contraseña
            </AppText>

            <AppText color="textSecondary" style={styles.subtitle}>
              {step === "username" &&
                "Ingresa tu usuario para recibir un código de recuperación."}

              {step === "code" &&
                "Ingresa el código de 6 dígitos enviado a tu correo."}

              {step === "password" &&
                "Crea una nueva contraseña para recuperar el acceso a tu cuenta."}
            </AppText>
          </>
        ) : null}

        {step === "username" && (
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
                returnKeyType="done"
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                onSubmitEditing={sendCode}
              />
            </View>

            {error ? <ErrorMessage message={error} /> : null}

            <AppButton
              disabled={loading}
              label={loading ? "Enviando código..." : "Enviar código"}
              onPress={sendCode}
              style={styles.primaryButton}
            />
          </View>
        )}

        {step === "code" && (
          <View style={styles.form}>
            {email ? (
              <View style={styles.infoContainer}>
                <AppText style={styles.infoText}>Código enviado a:</AppText>

                <AppText style={styles.emailText}>{email}</AppText>
              </View>
            ) : null}

            <View style={styles.fieldGroup}>
              <AppText style={styles.label}>Código de verificación</AppText>

              <TextInput
                accessibilityLabel="Código de verificación"
                editable={!loading}
                keyboardType="number-pad"
                maxLength={6}
                placeholder="000000"
                placeholderTextColor={Colors.textSecondary}
                returnKeyType="done"
                style={[styles.input, styles.codeInput]}
                value={code}
                onChangeText={setCode}
                onSubmitEditing={verifyCode}
              />

              <AppText variant="auxiliary" color="textSecondary">
                El código tiene una vigencia limitada.
              </AppText>
            </View>

            {error ? <ErrorMessage message={error} /> : null}

            <AppButton
              disabled={loading}
              label={loading ? "Verificando..." : "Verificar código"}
              onPress={verifyCode}
              style={styles.primaryButton}
            />

            <Pressable
              disabled={loading}
              onPress={restart}
              style={styles.secondaryLink}
            >
              <AppText style={styles.secondaryLinkText}>
                Usar otro usuario
              </AppText>
            </Pressable>
          </View>
        )}

        {step === "password" && (
          <View style={styles.form}>
            <View style={styles.fieldGroup}>
              <AppText style={styles.label}>Nueva contraseña</AppText>

              <TextInput
                accessibilityLabel="Nueva contraseña"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
                placeholder="Ingresa tu nueva contraseña"
                placeholderTextColor={Colors.textSecondary}
                secureTextEntry
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
              />
            </View>

            <View style={styles.fieldGroup}>
              <AppText style={styles.label}>Confirmar contraseña</AppText>

              <TextInput
                accessibilityLabel="Confirmar contraseña"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
                placeholder="Vuelve a escribir la contraseña"
                placeholderTextColor={Colors.textSecondary}
                returnKeyType="done"
                secureTextEntry
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                onSubmitEditing={changePassword}
              />
            </View>

            <View style={styles.requirementsContainer}>
              <AppText variant="auxiliary" color="textSecondary">
                La contraseña debe tener al menos 8 caracteres, una mayúscula,
                una minúscula, un número y un carácter especial.
              </AppText>
            </View>

            {error ? <ErrorMessage message={error} /> : null}

            <AppButton
              disabled={loading}
              label={loading ? "Actualizando..." : "Cambiar contraseña"}
              onPress={changePassword}
              style={styles.primaryButton}
            />
          </View>
        )}

        {step === "success" && (
          <View style={styles.successContainer}>
            <View style={styles.successIcon}>
              <AppText style={styles.successIconText}>✓</AppText>
            </View>

            <AppText variant="title" style={styles.successTitle}>
              Contraseña actualizada
            </AppText>

            <AppText color="textSecondary" style={styles.successText}>
              Tu contraseña se cambió correctamente. Ya puedes iniciar sesión
              con tu nueva contraseña.
            </AppText>

            <AppButton
              label="Ir a iniciar sesión"
              onPress={() => router.replace("/login")}
              style={styles.primaryButton}
            />
          </View>
        )}
      </View>
    </AppScreen>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <View accessibilityRole="alert" style={styles.errorContainer}>
      <AppText style={styles.errorText}>{message}</AppText>
    </View>
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

  content: {
    width: "100%",
    maxWidth: 500,
    alignSelf: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },

  backButton: {
    alignSelf: "flex-start",
    marginBottom: Spacing.xl,
  },

  backText: {
    fontFamily: Fonts.bold,
    color: Colors.primaryGreen,
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

  codeInput: {
    textAlign: "center",
    fontSize: 24,
    letterSpacing: 8,
    fontFamily: Fonts.bold,
  },

  primaryButton: {
    width: "100%",
    backgroundColor: Colors.secondaryBrown,
  },

  errorContainer: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: "#FCECEC",
  },

  errorText: {
    color: "#A63D3D",
  },

  infoContainer: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: "#EEF5F0",
  },

  infoText: {
    marginBottom: Spacing.xs,
    color: Colors.textSecondary,
  },

  emailText: {
    fontFamily: Fonts.bold,
    color: Colors.darkGreen,
  },

  requirementsContainer: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: "#F2F4F0",
  },

  secondaryLink: {
    alignSelf: "center",
    paddingVertical: Spacing.sm,
  },

  secondaryLinkText: {
    fontFamily: Fonts.bold,
    color: Colors.primaryGreen,
  },

  successContainer: {
    flex: 1,
    minHeight: 450,
    alignItems: "center",
    justifyContent: "center",
  },

  successIcon: {
    width: 74,
    height: 74,
    marginBottom: Spacing.lg,
    borderRadius: Radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E5F3E9",
  },

  successIconText: {
    fontFamily: Fonts.bold,
    fontSize: 36,
    color: Colors.primaryGreen,
  },

  successTitle: {
    marginBottom: Spacing.sm,
    textAlign: "center",
    color: Colors.darkGreen,
  },

  successText: {
    marginBottom: Spacing.xl,
    textAlign: "center",
    lineHeight: 24,
  },
});
