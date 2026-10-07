import { Image } from "expo-image";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

import { AppButton, AppCard, AppText } from "@/components/ui";
import { Colors, Radius, Spacing } from "@/constants/theme";
import { PerfilField } from "@/modules/perfil/components/perfil-field";
import { MAX_NOTES_LENGTH } from "../models/citas.model";
import type { useCitasViewModel } from "../viewmodels/use-citas-viewmodel";
import { formatAppointmentDate } from "../utils/citas-date";
import { AppointmentDatePicker } from "./appointment-date-picker";

interface AppointmentFormProps {
  vm: ReturnType<typeof useCitasViewModel>;
}

export function AppointmentForm({ vm }: AppointmentFormProps) {
  const disabled = vm.busy || vm.sessionRequired;
  return (
    <View style={styles.container}>
      {vm.rescheduling ? (
        <AppCard style={styles.card}>
          <AppText variant="sectionTitle" style={styles.heading}>
            Reprogramar cita
          </AppText>
          <AppText color="textSecondary">
            Cita actual: {formatAppointmentDate(vm.rescheduling.date)} ·{" "}
            {vm.rescheduling.startTime?.slice(0, 5) ?? "Hora por confirmar"}
          </AppText>
          <AppText color="textSecondary">
            Elige una nueva fecha y un horario disponible.
          </AppText>
        </AppCard>
      ) : null}
      <AppCard style={styles.card}>
        <AppText variant="sectionTitle" style={styles.heading}>
          1. Selecciona la fecha
        </AppText>
        <AppointmentDatePicker
          value={vm.selectedDate}
          disabled={disabled}
          onChange={vm.selectDate}
        />
      </AppCard>

      {vm.selectedDate ? (
        <AppCard style={styles.card}>
          <AppText variant="sectionTitle" style={styles.heading}>
            2. Selecciona el horario
          </AppText>
          {vm.availabilityLoading ? (
            <View style={styles.loading} accessibilityLiveRegion="polite">
              <ActivityIndicator color={Colors.headerGreen} />
              <AppText color="textSecondary">
                Consultando horarios disponibles…
              </AppText>
            </View>
          ) : vm.availabilityError ? (
            <View style={styles.container} accessibilityRole="alert">
              <AppText color="textSecondary">{vm.availabilityError}</AppText>
              <AppButton
                label="Reintentar horarios"
                variant="secondary"
                disabled={disabled}
                onPress={() => void vm.loadAvailability(vm.selectedDate)}
              />
            </View>
          ) : vm.availability.length === 0 ? (
            <AppText color="textSecondary">
              No hay horarios disponibles para esta fecha.
            </AppText>
          ) : (
            <View style={styles.slots} accessibilityRole="radiogroup">
              {vm.availability.map((time) => (
                <Pressable
                  key={time}
                  accessibilityRole="radio"
                  accessibilityLabel={`Horario ${time.slice(0, 5)}`}
                  accessibilityState={{
                    checked: vm.selectedTime === time,
                    disabled,
                  }}
                  disabled={disabled}
                  onPress={() => vm.selectTime(time)}
                  style={({ pressed }) => [
                    styles.slot,
                    vm.selectedTime === time && styles.selectedSlot,
                    pressed && styles.pressed,
                    disabled && styles.disabled,
                  ]}
                >
                  <AppText color={vm.selectedTime === time ? "white" : "text"}>
                    {time.slice(0, 5)}
                  </AppText>
                </Pressable>
              ))}
            </View>
          )}
        </AppCard>
      ) : null}

      {!vm.rescheduling ? (
        <>
          <AppCard style={styles.card}>
            <AppText variant="sectionTitle" style={styles.heading}>
              3. Notas opcionales
            </AppText>
            <PerfilField
              label="Notas para tu cita"
              accessibilityLabel="Notas para tu cita"
              value={vm.notes}
              onChangeText={vm.updateNotes}
              multiline
              maxLength={MAX_NOTES_LENGTH}
              editable={!disabled}
              placeholder="¿Hay algo que quieras comentar a tu nutrióloga?"
              style={styles.notes}
              helper={
                <AppText variant="auxiliary" color="textSecondary">
                  {vm.notes.length}/{MAX_NOTES_LENGTH} caracteres
                </AppText>
              }
            />
          </AppCard>
          <AppCard style={styles.card}>
            <AppText variant="sectionTitle" style={styles.heading}>
              4. Comprobante del anticipo
            </AppText>
            <AppText variant="auxiliary" color="textSecondary">
              Obligatorio · JPG, PNG o WEBP · Máximo 5 MB
            </AppText>
            {vm.receipt ? (
              <View style={styles.receipt}>
                <Image
                  source={{ uri: vm.receipt.uri }}
                  contentFit="contain"
                  style={styles.preview}
                  accessibilityLabel="Comprobante seleccionado"
                />
                <AppText style={styles.heading}>
                  Comprobante seleccionado correctamente
                </AppText>
                <AppText variant="auxiliary" color="textSecondary">
                  {(vm.receipt.size / (1024 * 1024)).toFixed(2)} MB
                </AppText>
                <AppButton
                  label="Quitar comprobante"
                  variant="secondary"
                  disabled={disabled}
                  onPress={vm.removeReceipt}
                />
              </View>
            ) : null}
            <AppButton
              label={
                vm.selectingReceipt
                  ? "Abriendo imágenes…"
                  : vm.receipt
                    ? "Cambiar comprobante"
                    : "Seleccionar comprobante"
              }
              variant="secondary"
              disabled={disabled}
              onPress={() => void vm.pickReceipt()}
            />
          </AppCard>
        </>
      ) : null}

      {vm.formError ? (
        <AppCard style={styles.error} accessibilityRole="alert">
          <AppText>{vm.formError}</AppText>
        </AppCard>
      ) : null}
      <AppButton
        label={
          vm.mutation === "create"
            ? "Solicitando cita…"
            : vm.mutation === "reschedule"
              ? "Reprogramando…"
              : vm.rescheduling
                ? "Confirmar reprogramación"
                : "Solicitar cita"
        }
        disabled={
          disabled ||
          vm.availabilityLoading ||
          !vm.selectedTime ||
          !vm.availability.includes(vm.selectedTime) ||
          (!vm.rescheduling && !vm.receipt)
        }
        onPress={
          vm.rescheduling
            ? vm.requestReschedule
            : () => void vm.submitAppointment()
        }
      />
      {vm.rescheduling ? (
        <AppButton
          label="Volver a próximas citas"
          variant="secondary"
          disabled={disabled}
          onPress={vm.cancelReschedule}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.md },
  card: { gap: Spacing.md, padding: Spacing.md },
  heading: { color: Colors.headerGreen },
  loading: {
    gap: Spacing.sm,
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  slots: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  slot: {
    minWidth: 76,
    minHeight: 48,
    flexGrow: 1,
    flexBasis: "28%",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    backgroundColor: Colors.background,
  },
  selectedSlot: {
    backgroundColor: Colors.headerGreen,
    borderColor: Colors.headerGreen,
  },
  notes: { minHeight: 112, textAlignVertical: "top" },
  receipt: { gap: Spacing.sm },
  preview: {
    width: "100%",
    height: 160,
    borderRadius: Radius.md,
    backgroundColor: Colors.background,
  },
  error: { borderLeftWidth: 4, borderLeftColor: Colors.primaryOrange },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.5 },
});
