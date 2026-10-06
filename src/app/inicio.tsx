import { router, type Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppButton, AppCard, AppScreen, AppText } from '@/components/ui';
import { Colors, Spacing } from '@/constants/theme';

const modules: { label: string; description: string; route: Href }[] = [
  { label: 'Muro', description: 'Consulta información y novedades.', route: '/muro' },
  { label: 'Citas', description: 'Accede al módulo de citas.', route: '/citas' },
  { label: 'Historial médico', description: 'Consulta tu historial médico.', route: '/historial' },
  { label: 'Plan alimenticio', description: 'Revisa tu plan de alimentación.', route: '/plan-alimenticio' },
  { label: 'Perfil', description: 'Accede a la información de tu perfil.', route: '/perfil' },
];

export default function InicioScreen() {
  return (
    <AppScreen>
      <View style={styles.header}>
        <AppText variant="title">Inicio</AppText>
        <AppText variant="subtitle" color="textSecondary">
          Bienvenido a tu consultorio nutricional
        </AppText>
      </View>

      <View style={styles.modules}>
        {modules.map((module) => (
          <AppCard key={module.label}>
            <AppText variant="sectionTitle">{module.label}</AppText>
            <AppText color="textSecondary" style={styles.description}>
              {module.description}
            </AppText>
            <AppButton label="Abrir" onPress={() => router.push(module.route)} />
          </AppCard>
        ))}
      </View>

      <AppButton label="Cerrar sesión" variant="secondary" onPress={() => router.replace('/login')} />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: Spacing.xl,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 3,
    borderBottomColor: Colors.accentGreen,
    gap: Spacing.sm,
  },
  modules: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  description: {
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
});
