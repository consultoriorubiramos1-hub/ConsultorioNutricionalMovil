export type CitasTab = "upcoming" | "new";
export type AppointmentStatus =
  | "scheduled"
  | "pending_payment"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show"
  | "unknown";
export type PaymentStatus =
  "pending" | "pending_review" | "approved" | "rejected" | "paid" | "unknown";
export type ReceiptMime = "image/jpeg" | "image/png" | "image/webp";

export interface Appointment {
  id: number;
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  status: AppointmentStatus;
  statusLabel: string;
  depositPaid: boolean | null;
  depositAmount: number | null;
  notes: string | null;
  paymentStatus: PaymentStatus | null;
  paymentLabel: string | null;
  paymentReference: string | null;
  paymentReceiptUrl: string | null;
  paymentSubmittedAt: string | null;
  paymentReviewedAt: string | null;
  paymentReviewNotes: string | null;
}

export interface AppointmentApiDto {
  id?: unknown;
  appointment_date?: unknown;
  start_time?: unknown;
  end_time?: unknown;
  status?: unknown;
  deposit_paid?: unknown;
  deposit_amount?: unknown;
  notes?: unknown;
  payment_status?: unknown;
  payment_reference?: unknown;
  payment_receipt_url?: unknown;
  payment_submitted_at?: unknown;
  payment_reviewed_at?: unknown;
  payment_review_notes?: unknown;
}

export type ApiResponse<T> =
  { ok: true; data: T } | { ok: false; message?: string };
export type Availability = string[];

export interface Receipt {
  uri: string;
  name: string;
  type: ReceiptMime;
  size: number;
  webFile?: Blob;
}

export interface CreateAppointmentInput {
  appointmentDate: string;
  startTime: string;
  notes: string;
  receipt: Receipt;
}

export interface CreatedAppointment {
  appointmentId: number;
  paymentReference: string | null;
  depositAmount: number | null;
  message: string;
}

export interface RescheduleAppointmentInput {
  date: string;
  startTime: string;
}

export interface CancelAppointmentResult {
  cancelled: true;
}
export interface RescheduleAppointmentResult extends RescheduleAppointmentInput {
  rescheduled: true;
}

export type AppointmentConfirmation =
  | { kind: "cancel"; appointment: Appointment }
  | {
      kind: "reschedule";
      appointment: Appointment;
      input: RescheduleAppointmentInput;
    };

export const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;
export const MAX_NOTES_LENGTH = 500;
