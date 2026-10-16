import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui";
import { Colors, Radius, Spacing } from "@/constants/theme";
import { clinicNow, formatAppointmentDate } from "../utils/citas-date";

interface AppointmentDatePickerProps {
  value: string;
  disabled: boolean;
  onChange: (date: string) => void;
}

export function AppointmentDatePicker({
  value,
  disabled,
  onChange,
}: AppointmentDatePickerProps) {
  const today = clinicNow().date;
  const [month, setMonth] = useState(() => (value || today).slice(0, 7));
  const [year, monthNumber] = month.split("-").map(Number);
  const first = new Date(year, monthNumber - 1, 1, 12);
  const monthLabel = first.toLocaleDateString("es-MX", {
    month: "long",
    year: "numeric",
  });
  const offset = (first.getDay() + 6) % 7;
  const days = new Date(year, monthNumber, 0, 12).getDate();
  const cells = Array.from(
    { length: Math.ceil((offset + days) / 7) * 7 },
    (_, index) => {
      const day = index - offset + 1;
      return day > 0 && day <= days
        ? `${month}-${String(day).padStart(2, "0")}`
        : null;
    },
  );

  const moveMonth = (delta: number) => {
    const next = new Date(year, monthNumber - 1 + delta, 1, 12);
    setMonth(
      `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`,
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mes anterior"
          disabled={disabled || month <= today.slice(0, 7)}
          onPress={() => moveMonth(-1)}
          style={[
            styles.arrow,
            (disabled || month <= today.slice(0, 7)) && styles.disabled,
          ]}
        >
          <AppText variant="subtitle">‹</AppText>
        </Pressable>
        <AppText variant="sectionTitle" style={styles.month}>
          {monthLabel}
        </AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mes siguiente"
          disabled={disabled}
          onPress={() => moveMonth(1)}
          style={[styles.arrow, disabled && styles.disabled]}
        >
          <AppText variant="subtitle">›</AppText>
        </Pressable>
      </View>
      <View style={styles.grid}>
        {["L", "M", "M", "J", "V", "S", "D"].map((day, index) => (
          <View key={`weekday-${index}`} style={styles.cell} accessible={false}>
            <AppText variant="auxiliary" color="textSecondary">
              {day}
            </AppText>
          </View>
        ))}
        {cells.map((date, index) => (
          <View key={date ?? `blank-${index}`} style={styles.cell}>
            {date ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={formatAppointmentDate(date)}
                accessibilityState={{
                  selected: date === value,
                  disabled: disabled || date < today,
                }}
                disabled={disabled || date < today}
                onPress={() => onChange(date)}
                style={({ pressed }) => [
                  styles.day,
                  date === value && styles.selected,
                  date < today && styles.disabled,
                  pressed && styles.pressed,
                ]}
              >
                <AppText style={date === value ? { color: Colors.darkGreen, fontWeight: '700' } : undefined}>
                  {Number(date.slice(-2))}
                </AppText>
              </Pressable>
            ) : null}
          </View>
        ))}
      </View>
      <AppText
        variant="auxiliary"
        color="textSecondary"
        accessibilityLiveRegion="polite"
      >
        {value
          ? `Fecha seleccionada: ${formatAppointmentDate(value)}`
          : "Selecciona una fecha para consultar los horarios."}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.sm },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.xs,
  },
  arrow: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  month: { flex: 1, textAlign: "center", color: Colors.text, textTransform: 'capitalize' },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: {
    width: "14.285714%",
    minHeight: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  day: {
    width: "100%",
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.sm,
  },
  selected: { backgroundColor: Colors.accentGreen },
  disabled: { opacity: 0.35 },
  pressed: { opacity: 0.7 },
});
