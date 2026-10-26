import { StyleSheet, View } from "react-native";

import { AppButton, AppCard, AppIcon, AppText, StatusBadge } from "@/components/ui";
import { Colors, Radius, Spacing } from "@/constants/theme";
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
  featured?: boolean;
}

export function AppointmentCard({
  appointment,
  disabled,
  onReschedule,
  onCancel,
  featured = false,
}: AppointmentCardProps) {
  const date = appointment.date ? new Date(appointment.date + 'T12:00:00') : null;
  const tone = appointment.status === 'confirmed' ? 'green' : appointment.status === 'cancelled' || appointment.status === 'no_show' ? 'red' : appointment.status === 'scheduled' || appointment.status === 'pending_payment' ? 'orange' : 'neutral';
  return (
    <AppCard style={[styles.card, featured && styles.featured]}>
      {featured ? <AppText variant="sectionTitle" style={styles.heading}>Próxima cita</AppText> : null}
      <View style={styles.header}>
      <View style={styles.dateTile} accessible={false}>
        <AppText color="textSecondary" variant="auxiliary">{date?.toLocaleDateString('es-MX', { weekday: 'short' }) ?? '—'}</AppText>
        <AppText variant="title">{date?.getDate() ?? '—'}</AppText>
        <AppText color="textSecondary" variant="auxiliary">{date?.toLocaleDateString('es-MX', { month: 'short', year: 'numeric' }) ?? ''}</AppText>
      </View>
      <View style={styles.headerText}>
      <StatusBadge label={appointment.statusLabel} tone={tone} />
      <View style={styles.time}><AppIcon name="clock" size={18} color={Colors.primaryOrange} /><AppText variant="sectionTitle">
        {appointment.startTime?.slice(0, 5) ?? "Hora por confirmar"}
        {appointment.endTime ? ` – ${appointment.endTime.slice(0, 5)}` : ""}
      </AppText></View>
      <AppText variant="auxiliary" color="textSecondary">{formatAppointmentDate(appointment.date)}</AppText>
      </View>
      </View>
      <View style={styles.details}>
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
    gap: Spacing.md,
  },
  featured: { borderColor: '#DCEBCB' },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  dateTile: { width: 82, paddingVertical: Spacing.md, alignItems: 'center', backgroundColor: Colors.softGreen, borderRadius: Radius.md },
  headerText: { flex: 1, gap: Spacing.sm },
  time: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Spacing.sm },
  heading: { color: Colors.headerGreen },
  details: { gap: Spacing.xs, marginVertical: Spacing.sm },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  button: { flexGrow: 1, flexBasis: 120, paddingHorizontal: Spacing.sm, paddingVertical: 10 },
});
