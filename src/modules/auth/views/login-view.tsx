import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppButton, AppIcon, AppScreen, AppText, BrandLogo } from '@/components/ui';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';

import { LoginLegalLinks } from '../components/login-legal-links';
import { useLoginViewModel } from '../viewmodels/use-login-view-model';

export function LoginView() {
  const { username, password, loading, error, setUsername, setPassword, login } = useLoginViewModel();
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<'username' | 'password' | null>(null);
  const passwordRef = useRef<TextInput>(null);

  return (
    <AppScreen contentContainerStyle={styles.screen}>
      <View pointerEvents="none" style={styles.decoration} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <View style={styles.topShape} />
      </View>

      <View style={styles.content}>
        <View style={styles.brand}>
          <BrandLogo large />
        </View>

        <View style={styles.heading}>
          <AppText variant="title" style={styles.title} accessibilityRole="header">
            Bienvenido de nuevo
          </AppText>
          <AppText color="textSecondary" style={styles.subtitle}>
            Inicia sesión para continuar con tu seguimiento nutricional
          </AppText>
        </View>

        <View style={styles.form}>
          <View style={styles.group}>
            <AppText variant="auxiliary" style={styles.label}>Correo electrónico</AppText>
            <View style={[styles.inputRow, focusedField === 'username' && styles.inputFocused]}>
              <AppIcon name="mail" size={21} color={focusedField === 'username' ? Colors.primaryGreen : Colors.textSecondary} />
              <TextInput
                accessibilityLabel="Correo electrónico o usuario"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="username"
                editable={!loading}
                keyboardType="email-address"
                placeholder="tu@correo.com"
                placeholderTextColor={Colors.textSecondary}
                returnKeyType="next"
                selectionColor={Colors.primaryGreen}
                underlineColorAndroid="transparent"
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                onFocus={() => setFocusedField('username')}
                onBlur={() => setFocusedField(null)}
                onSubmitEditing={() => passwordRef.current?.focus()}
              />
            </View>
            <AppText variant="auxiliary" color="textSecondary" style={styles.hint}>
              También puedes usar tu usuario.
            </AppText>
          </View>

          <View style={styles.group}>
            <AppText variant="auxiliary" style={styles.label}>Contraseña</AppText>
            <View style={[styles.inputRow, focusedField === 'password' && styles.inputFocused]}>
              <AppIcon name="lock" size={21} color={focusedField === 'password' ? Colors.primaryGreen : Colors.textSecondary} />
              <TextInput
                ref={passwordRef}
                accessibilityLabel="Contraseña"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="current-password"
                editable={!loading}
                placeholder="Ingresa tu contraseña"
                placeholderTextColor={Colors.textSecondary}
                returnKeyType="done"
                secureTextEntry={!showPassword}
                selectionColor={Colors.primaryGreen}
                underlineColorAndroid="transparent"
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                onSubmitEditing={login}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                accessibilityState={{ checked: showPassword }}
                onPress={() => setShowPassword(!showPassword)}
                style={({ pressed }) => [styles.eye, pressed && styles.pressed]}>
                <AppIcon name={showPassword ? 'eyeOff' : 'eye'} size={21} />
              </Pressable>
            </View>
          </View>

          <Pressable
            accessibilityRole="link"
            disabled={loading}
            onPress={() => router.push('/recuperar-contrasena')}
            style={({ pressed }) => [styles.forgot, pressed && styles.pressed]}>
            <AppText style={styles.link}>¿Olvidaste tu contraseña?</AppText>
          </Pressable>

          {error ? (
            <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>
              <AppText style={styles.errorText}>{error}</AppText>
            </View>
          ) : null}

          <AppButton
            accessibilityState={{ disabled: loading, busy: loading }}
            disabled={loading}
            label={loading ? 'Iniciando sesión…' : 'Iniciar sesión'}
            onPress={login}
            style={styles.submit}
          />
        </View>
      </View>

      <View style={styles.footer}>
        <View pointerEvents="none" style={styles.decoration} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <View style={styles.bottomShape} />
        </View>
        <View style={styles.footerContent}>
          <View style={styles.message}>
            <View pointerEvents="none" style={styles.leaves} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <View style={styles.leafLeft} />
              <View style={styles.leafRight} />
            </View>
            <AppText style={styles.messageText}>
              Pequeños cambios,{'\n'}
              <AppText style={styles.messageEmphasis}>grandes resultados</AppText>
            </AppText>
          </View>
          <View pointerEvents="none" style={styles.photoFrame}>
            <Image
              source={require('../../../../assets/images/login-healthy-bowl.jpg')}
              contentFit="cover"
              style={styles.photo}
              accessible={false}
            />
          </View>
        </View>
      </View>
      <LoginLegalLinks />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 0, backgroundColor: '#FFFDF9' },
  decoration: { ...StyleSheet.absoluteFill, overflow: 'hidden' },
  topShape: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: '#F3F8EB', top: -115, right: -95 },
  content: { width: '100%', maxWidth: 480, alignSelf: 'center', paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, paddingBottom: Spacing.lg },
  brand: { marginBottom: Spacing.xl },
  heading: { alignItems: 'center', gap: 12, marginBottom: 28 },
  title: { fontSize: 32, lineHeight: 40, letterSpacing: -0.8, textAlign: 'center' },
  subtitle: { textAlign: 'center', maxWidth: 310, fontSize: 16, lineHeight: 24 },
  form: { gap: Spacing.md },
  group: { gap: Spacing.sm },
  label: { fontFamily: Fonts.bold, color: Colors.text },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: Spacing.md, minHeight: 58, borderWidth: 1, borderColor: '#E2E7DC', borderRadius: Radius.md, backgroundColor: '#FAFBF7' },
  inputFocused: { borderColor: Colors.accentGreen, backgroundColor: Colors.white },
  input: { flex: 1, minWidth: 0, minHeight: 56, paddingVertical: Spacing.md, fontFamily: Fonts.regular, fontSize: 16, color: Colors.text },
  hint: { fontSize: 12, lineHeight: 16 },
  eye: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', marginRight: -8, borderRadius: Radius.sm },
  pressed: { opacity: 0.65 },
  forgot: { alignSelf: 'flex-end', minHeight: 44, justifyContent: 'center', marginTop: -Spacing.sm },
  link: { color: Colors.primaryGreen, fontSize: 14, lineHeight: 20 },
  error: { backgroundColor: Colors.softDanger, borderRadius: Radius.md, padding: Spacing.md },
  errorText: { color: Colors.danger, fontSize: 14, lineHeight: 20 },
  submit: { minHeight: 58, borderRadius: Radius.md, backgroundColor: Colors.primaryOrange, boxShadow: '0 6px 16px rgba(255, 121, 37, 0.18)' },
  footer: { width: '100%', maxWidth: 560, alignSelf: 'center', marginTop: 'auto' },
  bottomShape: { position: 'absolute', width: 480, height: 290, borderRadius: 240, backgroundColor: Colors.softGreen, left: -160, bottom: -160, transform: [{ rotate: '-12deg' }] },
  footerContent: { width: '100%', maxWidth: 480, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.lg, minHeight: 226 },
  message: { flex: 1, paddingVertical: Spacing.md },
  leaves: { width: 42, height: 24, marginBottom: 12 },
  leafLeft: { position: 'absolute', width: 22, height: 11, borderTopRightRadius: 18, borderBottomLeftRadius: 18, backgroundColor: '#B9D793', left: 0, top: 9, transform: [{ rotate: '25deg' }] },
  leafRight: { position: 'absolute', width: 26, height: 13, borderTopLeftRadius: 20, borderBottomRightRadius: 20, backgroundColor: Colors.accentGreen, left: 15, top: 3, transform: [{ rotate: '-35deg' }] },
  messageText: { fontFamily: Fonts.bold, fontSize: 21, lineHeight: 28, letterSpacing: -0.3, color: Colors.text },
  messageEmphasis: { fontFamily: Fonts.bold, fontSize: 21, lineHeight: 28, letterSpacing: -0.3, color: Colors.primaryGreen },
  photoFrame: { width: '53%', aspectRatio: 1, padding: 6, borderRadius: Radius.pill, backgroundColor: Colors.white, boxShadow: '0 8px 24px rgba(54, 91, 23, 0.10)' },
  photo: { width: '100%', height: '100%', borderRadius: Radius.pill },
});
