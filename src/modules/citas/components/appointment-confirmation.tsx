import { ActivityIndicator, Modal, StyleSheet } from "react-native";

import { AppButton, AppCard, AppScreen, AppText } from "@/components/ui";
import { Colors, Spacing } from "@/constants/theme";
import type { AppointmentConfirmation } from "../models/citas.model";
import { formatAppointmentDate } from "../utils/citas-date";

interface AppointmentConfirmationProps {
  confirmation: AppointmentConfirmation | null;
  busy: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function AppointmentConfirmationDialog({
  confirmation,
  busy,
  onClose,
  onConfirm,
}: AppointmentConfirmationProps) {
  return (
    <Modal
      visible={confirmation !== null}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <AppScreen contentContainerStyle={styles.screen}>
        {confirmation ? (
          <AppCard style={styles.card} accessibilityViewIsModal>
            <AppText variant="sectionTitle" style={styles.title}>
              {confirmation.kind === "cancel"
                ? "¿Deseas cancelar esta cita?"
                : "¿Deseas reprogramar esta cita?"}
            </AppText>
            <AppText color="textSecondary">
              {formatAppointmentDate(confirmation.appointment.date)} ·{" "}
              {confirmation.appointment.startTime?.slice(0, 5) ??
                "Hora por confirmar"}
            </AppText>
            {confirmation.kind === "reschedule" ? (
              <AppText>
                Nueva cita: {formatAppointmentDate(confirmation.input.date)} ·{" "}
                {confirmation.input.startTime.slice(0, 5)}
              </AppText>
            ) : null}
            {busy ? (
              <ActivityIndicator
                color={Colors.headerGreen}
                accessibilityLabel="Procesando solicitud"
              />
            ) : null}
            <AppButton
              label={
                busy
                  ? "Procesando…"
                  : confirmation.kind === "cancel"
                    ? "Sí, cancelar"
                    : "Sí, reprogramar"
              }
              disabled={busy}
              onPress={onConfirm}
            />
            <AppButton
              label="No"
              variant="secondary"
              disabled={busy}
              onPress={onClose}
            />
          </AppCard>
        ) : null}
      </AppScreen>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.md,
  },
  card: { width: "100%", maxWidth: 480, gap: Spacing.md },
  title: { color: Colors.headerGreen },
});
