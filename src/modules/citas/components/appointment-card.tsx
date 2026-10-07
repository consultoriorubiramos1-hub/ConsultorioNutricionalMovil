import { StyleSheet, View } from "react-native";

import { AppButton, AppCard, AppText } from "@/components/ui";
import { Colors, Spacing } from "@/constants/theme";
import type { Appointment } from "../models/citas.model";
import {
  canModifyAppointment,
  formatAppointmentDate,
} from "../utils/citas-date";

interface AppointmentCardProps {
  appointment: Appointment;
  disabled: boolean;
  onReschedule: () => void;
  onCancel: () => void;
}

export function AppointmentCard({
  appointment,
  disabled,
  onReschedule,
  onCancel,
}: AppointmentCardProps) {
  return (
    <AppCard style={styles.card}>
      <AppText variant="sectionTitle" style={styles.heading}>
        {formatAppointmentDate(appointment.date)}
      </AppText>
      <AppText variant="subtitle">
        {appointment.startTime?.slice(0, 5) ?? "Hora por confirmar"}
        {appointment.endTime ? ` – ${appointment.endTime.slice(0, 5)}` : ""}
      </AppText>
      <View style={styles.details}>
        <AppText>Estado: {appointment.statusLabel}</AppText>
        {appointment.paymentLabel ? (
          <AppText>Anticipo: {appointment.paymentLabel}</AppText>
        ) : null}
        {appointment.depositAmount !== null ? (
          <AppText>
            Monto del anticipo:{" "}
            {appointment.depositAmount.toLocaleString("es-MX", {
              style: "currency",
              currency: "MXN",
            })}
          </AppText>
        ) : null}
        {appointment.paymentReference ? (
          <AppText variant="auxiliary" color="textSecondary">
            Referencia: {appointment.paymentReference}
          </AppText>
        ) : null}
        {appointment.paymentReviewNotes ? (
          <AppText variant="auxiliary" color="textSecondary">
            Revisión del comprobante: {appointment.paymentReviewNotes}
          </AppText>
        ) : null}
        {appointment.notes ? (
          <AppText color="textSecondary">Notas: {appointment.notes}</AppText>
        ) : null}
      </View>
      {canModifyAppointment(appointment) ? (
        <View style={styles.actions}>
          <AppButton
            label="Reprogramar"
            disabled={disabled}
            onPress={onReschedule}
            style={styles.button}
          />
          <AppButton
            label="Cancelar"
            variant="secondary"
            disabled={disabled}
            onPress={onCancel}
            style={styles.button}
          />
        </View>
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.sm,
    borderTopWidth: 4,
    borderTopColor: Colors.headerGreen,
  },
  heading: { color: Colors.headerGreen },
  details: { gap: Spacing.xs, marginVertical: Spacing.sm },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  button: { flexGrow: 1, flexBasis: 140, paddingHorizontal: Spacing.sm },
});
