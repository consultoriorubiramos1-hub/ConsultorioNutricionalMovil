import { Modal, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AppButton, AppCard, AppIcon, AppScreen, AppText } from "@/components/ui";
import { Colors, Spacing } from "@/constants/theme";
import type { Perfil } from "../models/perfil.model";
import { useCancelacionViewModel } from "../viewmodels/use-cancelacion-viewmodel";
import { PerfilField } from "./perfil-field";

interface CancelacionDatosModalProps {
  perfil: Perfil;
  onClose: () => void;
}

export function CancelacionDatosModal({ perfil, onClose }: CancelacionDatosModalProps) {
  const vm = useCancelacionViewModel(perfil);
  const cerrar = () => { if (!vm.abriendoCorreo) onClose(); };

  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={cerrar}>
      <SafeAreaProvider>
        <AppScreen contentContainerStyle={styles.content}>
          <View style={styles.form} accessibilityViewIsModal>
            <View style={styles.header}>
              <AppText variant="sectionTitle" accessibilityRole="header" style={styles.title}>
                Solicitud de cancelación de datos personales
              </AppText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cerrar solicitud de cancelación"
                disabled={vm.abriendoCorreo}
                onPress={cerrar}
                style={styles.close}>
                <AppIcon name="close" color={Colors.text} />
              </Pressable>
            </View>

            <AppText color="textSecondary">
              Tienes derecho a solicitar la cancelación de tus datos personales registrados en el consultorio. Tu solicitud será revisada para determinar si procede conforme a las disposiciones legales aplicables.
            </AppText>

            <AppCard style={styles.notice}>
              <AppText variant="sectionTitle">Aviso importante</AppText>
              <AppText>
                Enviar esta solicitud no elimina inmediatamente tu cuenta ni tu expediente nutricional. Algunos registros pueden estar sujetos a obligaciones legales de conservación.
              </AppText>
            </AppCard>

            <PerfilField
              label="Nombre completo del paciente"
              value={perfil.nombreCompleto}
              placeholder="No disponible en tu perfil"
              editable={false}
            />
            <PerfilField
              label="Correo electrónico"
              value={perfil.email}
              placeholder="No disponible en tu cuenta"
              editable={false}
            />
            <PerfilField
              label="Motivo de la solicitud (opcional)"
              value={vm.motivo}
              onChangeText={vm.setMotivo}
              editable={!vm.abriendoCorreo}
              placeholder="Explica brevemente qué deseas cancelar"
              multiline
              maxLength={1000}
              textAlignVertical="top"
              style={styles.reason}
              helper={<AppText variant="auxiliary" color="textSecondary">
                Si lo dejas vacío, solicitarás cancelar todos los datos que legalmente proceda cancelar. No incluyas datos médicos sensibles, contraseñas ni documentos.
              </AppText>}
            />

            {vm.correoPrivacidad ? (
              <AppText variant="auxiliary" color="textSecondary">
                {`Se abrirá tu aplicación de correo con un mensaje para ${vm.correoPrivacidad}. Debes presionar Enviar en esa aplicación para presentar la solicitud.`}
              </AppText>
            ) : null}
            {vm.impedimento || vm.error ? (
              <AppText accessibilityRole="alert" style={styles.error}>
                {vm.impedimento || vm.error}
              </AppText>
            ) : null}
            {vm.aviso ? <AppText accessibilityRole="alert">{vm.aviso}</AppText> : null}

            <AppButton
              label={vm.abriendoCorreo ? "Abriendo correo..." : "Solicitar cancelación"}
              disabled={vm.abriendoCorreo || !!vm.impedimento}
              onPress={vm.solicitarCancelacion}
            />
            <AppButton label="Cerrar" variant="secondary" disabled={vm.abriendoCorreo} onPress={cerrar} />
          </View>
        </AppScreen>
      </SafeAreaProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: { alignItems: "center" },
  form: { width: "100%", maxWidth: 560, gap: Spacing.md },
  header: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  title: { flex: 1, color: Colors.primaryGreen },
  close: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  notice: { backgroundColor: Colors.softOrange, gap: Spacing.sm },
  reason: { minHeight: 120 },
  error: { color: Colors.danger },
});
