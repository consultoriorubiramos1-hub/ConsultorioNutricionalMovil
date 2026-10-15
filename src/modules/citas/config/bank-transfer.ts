import type { BankTransferDetails } from "../models/citas.model";

// Configuración temporal: los contratos actuales de la app no incluyen datos bancarios.
// Sustituir los null por los datos confirmados del consultorio; conservar como
// texto la cuenta y la CLABE para no perder ceros iniciales. El importe es en MXN.
// null indica un dato pendiente; accountNumber puede omitirse si basta la CLABE.
export const BANK_TRANSFER_DETAILS: Readonly<BankTransferDetails> = {
  bankName: null,
  accountHolder: null,
  accountNumber: null,
  clabe: null,
  consultationAmount: null,
};
