import { router } from 'expo-router';
import { Image } from 'expo-image';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { AppButton, AppIcon, AppScreen, AppText, BrandLogo } from '@/components/ui';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useLoginViewModel } from '../viewmodels/use-login-view-model';

export function LoginView() {
  const { username, password, loading, error, setUsername, setPassword, login } = useLoginViewModel();
  const [showPassword, setShowPassword] = useState(false);
  const passwordRef = useRef<TextInput>(null);
  return (
    <AppScreen contentContainerStyle={styles.screen}>
      <View style={styles.content}>
        <View style={styles.brand}><BrandLogo large /></View>
        <View style={styles.heading}>
          <AppText variant="title" style={styles.title} accessibilityRole="header">Bienvenida</AppText>
          <View style={styles.accent} />
          <AppText color="textSecondary" style={styles.subtitle}>Pequeños hábitos, grandes cambios para una vida más saludable.</AppText>
        </View>
        <View style={styles.form}>
          <View style={styles.group}>
            <AppText variant="auxiliary" color="textSecondary">Usuario</AppText>
            <View style={styles.inputRow}>
              <AppIcon name="mail" size={22} />
              <TextInput accessibilityLabel="Usuario" autoCapitalize="none" autoCorrect={false} autoComplete="username" editable={!loading} placeholder="Ingresa tu usuario" placeholderTextColor={Colors.textSecondary} returnKeyType="next" style={styles.input} value={username} onChangeText={setUsername} onSubmitEditing={() => passwordRef.current?.focus()} />
            </View>
          </View>
          <View style={styles.group}>
            <AppText variant="auxiliary" color="textSecondary">Contraseña</AppText>
            <View style={styles.inputRow}>
              <AppIcon name="lock" size={22} />
              <TextInput ref={passwordRef} accessibilityLabel="Contraseña" autoCapitalize="none" autoCorrect={false} autoComplete="current-password" editable={!loading} placeholder="Ingresa tu contraseña" placeholderTextColor={Colors.textSecondary} returnKeyType="done" secureTextEntry={!showPassword} style={styles.input} value={password} onChangeText={setPassword} onSubmitEditing={login} />
              <Pressable accessibilityRole="button" accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} accessibilityState={{ checked: showPassword }} onPress={() => setShowPassword(!showPassword)} style={styles.eye}><AppIcon name={showPassword ? 'eyeOff' : 'eye'} size={21} /></Pressable>
            </View>
          </View>
          <Pressable accessibilityRole="link" disabled={loading} onPress={() => router.push('/recuperar-contrasena')} style={styles.forgot}><AppText style={styles.link}>¿Olvidaste tu contraseña?</AppText></Pressable>
          {error ? <View accessibilityRole="alert" style={styles.error}><AppText style={styles.errorText}>{error}</AppText></View> : null}
          <AppButton disabled={loading} label={loading ? 'Iniciando sesión…' : 'Iniciar sesión'} onPress={login} />
        </View>
      </View>
      <View style={styles.photoContainer}><Image source={require('../../../../assets/images/nutrition-bowl.jpg')} contentFit="cover" style={styles.photo} accessible={false} /></View>
    </AppScreen>
  );
}
const styles = StyleSheet.create({
  screen: { padding: 0, backgroundColor: Colors.white },
  content: { width: '100%', maxWidth: 500, alignSelf: 'center', paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, paddingBottom: Spacing.xl },
  brand: { marginBottom: Spacing.xl },
  heading: { alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.xl },
  title: { fontSize: 40, lineHeight: 48, textAlign: 'center' },
  accent: { width: 36, height: 3, backgroundColor: Colors.accentGreen, borderRadius: Radius.pill },
  subtitle: { textAlign: 'center', maxWidth: 310, fontSize: 17, lineHeight: 26 },
  form: { gap: Spacing.md },
  group: { gap: Spacing.sm },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.md, minHeight: 58, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, backgroundColor: Colors.white },
  input: { flex: 1, minWidth: 0, minHeight: 56, fontFamily: Fonts.regular, fontSize: 16, color: Colors.text },
  eye: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', marginRight: -8 },
  forgot: { alignSelf: 'flex-end', minHeight: 44, justifyContent: 'center' },
  link: { color: Colors.primaryGreen },
  error: { backgroundColor: Colors.softDanger, borderRadius: Radius.md, padding: Spacing.md },
  errorText: { color: Colors.danger },
  photoContainer: { width: '100%', maxWidth: 560, alignSelf: 'center', height: 220, marginTop: 'auto', overflow: 'hidden', borderTopLeftRadius: 80 },
  photo: { width: '100%', height: '100%' },
});
