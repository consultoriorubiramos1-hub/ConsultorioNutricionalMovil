import { Modal, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AppButton, AppCard, AppIcon, AppScreen, AppText } from "@/components/ui";
import { Colors, Spacing } from "@/constants/theme";
import { OPOSICION_MAX_LENGTH } from "../models/oposicion.model";
import type { Perfil } from "../models/perfil.model";
import { useOposicionViewModel } from "../viewmodels/use-oposicion-viewmodel";
import { PerfilField } from "./perfil-field";

interface OposicionDatosModalProps {
  perfil: Perfil;
  onClose: () => void;
}

export function OposicionDatosModal({ perfil, onClose }: OposicionDatosModalProps) {
  const vm = useOposicionViewModel(perfil);
  const cerrar = () => { if (!vm.abriendoCorreo) onClose(); };

  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={cerrar}>
      <SafeAreaProvider>
        <AppScreen contentContainerStyle={styles.content}>
          <View style={styles.form} accessibilityViewIsModal>
            <View style={styles.header}>
              <AppText variant="sectionTitle" accessibilityRole="header" style={styles.title}>
                Solicitud de oposición al tratamiento de datos personales
              </AppText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cerrar solicitud de oposición"
                disabled={vm.abriendoCorreo}
                onPress={cerrar}
                style={styles.close}>
                <AppIcon name="close" color={Colors.text} />
              </Pressable>
            </View>

            <AppText color="textSecondary">
              Tienes derecho a solicitar que el consultorio deje de utilizar tus datos personales para determinados fines, cuando exista una causa legal que lo justifique. Tu solicitud será revisada para determinar si procede.
            </AppText>

            <AppCard style={styles.notice}>
              <AppText variant="sectionTitle">Aviso importante</AppText>
              <AppText>
                Presentar esta solicitud no elimina tus datos personales ni desactiva tu cuenta automáticamente. El consultorio evaluará si puede dejar de realizar el tratamiento indicado, tomando en cuenta las obligaciones legales y las finalidades necesarias para tu atención nutricional.
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
              label="¿A qué uso de tus datos deseas oponerte?"
              value={vm.tratamiento}
              onChangeText={vm.setTratamiento}
              editable={!vm.abriendoCorreo}
              placeholder="Describe la finalidad o el tratamiento"
              multiline
              maxLength={OPOSICION_MAX_LENGTH}
              textAlignVertical="top"
              style={styles.reason}
              helper={<AppText variant="auxiliary" color="textSecondary">
                {`Campo obligatorio. Describe para qué uso de tus datos solicitas que deje de realizarse el tratamiento. Máximo ${OPOSICION_MAX_LENGTH} caracteres.`}
              </AppText>}
            />
            <PerfilField
              label="Motivo de la oposición"
              value={vm.motivo}
              onChangeText={vm.setMotivo}
              editable={!vm.abriendoCorreo}
              placeholder="Explica brevemente por qué solicitas la oposición"
              multiline
              maxLength={OPOSICION_MAX_LENGTH}
              textAlignVertical="top"
              style={styles.reason}
              helper={<AppText variant="auxiliary" color="textSecondary">
                {`Campo obligatorio. Máximo ${OPOSICION_MAX_LENGTH} caracteres. No incluyas datos médicos sensibles, contraseñas ni documentos.`}
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
              label={vm.abriendoCorreo ? "Abriendo correo..." : "Solicitar oposición"}
              disabled={vm.abriendoCorreo || !!vm.impedimento}
              onPress={vm.solicitarOposicion}
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
