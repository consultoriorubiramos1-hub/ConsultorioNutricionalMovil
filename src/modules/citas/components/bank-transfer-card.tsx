import { StyleSheet, View } from "react-native";

import { AppCard, AppIcon, AppText } from "@/components/ui";
import { Colors, Spacing } from "@/constants/theme";
import type { BankTransferDetails } from "../models/citas.model";

interface BankTransferCardProps {
  details: Readonly<BankTransferDetails>;
}

export function BankTransferCard({ details }: BankTransferCardProps) {
  const pending = !details.bankName || !details.accountHolder || !details.clabe;
  const fields = [
    { label: "Banco", value: details.bankName },
    { label: "Beneficiario o titular", value: details.accountHolder },
    ...(details.accountNumber || pending
      ? [{ label: "Número de cuenta", value: details.accountNumber }]
      : []),
    { label: "CLABE interbancaria", value: details.clabe },
  ];

  return (
    <AppCard style={[styles.card, pending && styles.pendingCard]}>
      <AppIcon name="bank" size={28} color={Colors.primaryOrange} />
      <AppText variant="sectionTitle" style={styles.heading}>
        Datos para transferencia bancaria
      </AppText>
      {pending ? (
        <AppText variant="auxiliary" style={styles.pending}>
          Datos pendientes de configurar. Confirma la cuenta y el importe con
          el consultorio antes de transferir.
        </AppText>
      ) : null}
      {fields.map(({ label, value }) => (
        <View key={label} style={styles.field}>
          <AppText variant="auxiliary" color="textSecondary">
            {label}
          </AppText>
          <AppText selectable>{value || "Pendiente de configurar"}</AppText>
        </View>
      ))}
      {details.consultationAmount !== null ? (
        <View style={styles.field}>
          <AppText variant="auxiliary" color="textSecondary">
            Monto de la consulta
          </AppText>
          <AppText selectable>
            {details.consultationAmount.toLocaleString("es-MX", {
              style: "currency",
              currency: "MXN",
            })}{" "}
            MXN
          </AppText>
        </View>
      ) : null}
      <AppText variant="auxiliary" color="textSecondary">
        Realiza la transferencia con los datos confirmados del consultorio y
        adjunta el comprobante del anticipo en la sección siguiente.
      </AppText>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.md, padding: Spacing.md, backgroundColor: '#FFFAF5' },
  pendingCard: { borderColor: '#F6DFC9' },
  heading: { color: Colors.text },
  field: { gap: Spacing.xs, borderBottomWidth: 1, borderBottomColor: Colors.border, paddingBottom: Spacing.sm },
  pending: { color: Colors.secondaryBrown },
});
