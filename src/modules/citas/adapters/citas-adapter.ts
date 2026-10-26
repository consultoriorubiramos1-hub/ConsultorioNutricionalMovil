import type {
  Appointment,
  AppointmentApiDto,
  AppointmentStatus,
  Availability,
  CreatedAppointment,
  PaymentStatus,
  RescheduleAppointmentResult,
} from "../models/citas.model";
import { calendarDate, isFutureSlot, normalizeTime } from "../utils/citas-date";

const statusLabels: Record<AppointmentStatus, string> = {
  scheduled: "Programada",
  pending_payment: "Pendiente de anticipo",
  confirmed: "Confirmada",
  completed: "Completada",
  cancelled: "Cancelada",
  no_show: "No asistió",
  unknown: "Por confirmar",
};
const paymentLabels: Record<PaymentStatus, string> = {
  pending: "Pendiente",
  pending_review: "En revisión",
  approved: "Aprobado",
  rejected: "Rechazado",
  paid: "Pagado",
  unknown: "Por confirmar",
};

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("La respuesta del servidor no es válida.");
  return value as Record<string, unknown>;
}
function text(value: unknown): string | null {
  return typeof value === "string" ? value.trim() || null : null;
}
function amount(value: unknown): number | null {
  if (
    (typeof value !== "number" && typeof value !== "string") ||
    (typeof value === "string" && !value.trim())
  )
    return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}
function positiveId(value: unknown): number {
  const id =
    typeof value === "string" || typeof value === "number"
      ? Number(value)
      : NaN;
  if (!Number.isSafeInteger(id) || id <= 0)
    throw new Error("La respuesta de citas no es válida.");
  return id;
}

export function appointmentsFromApi(value: unknown): Appointment[] {
  if (!Array.isArray(value))
    throw new Error("La respuesta de citas no es válida.");
  return value
    .map((item): Appointment => {
      const dto: AppointmentApiDto = record(item);
      const rawStatus = text(dto.status) ?? "unknown";
      const status: AppointmentStatus = Object.hasOwn(statusLabels, rawStatus)
        ? (rawStatus as AppointmentStatus)
        : "unknown";
      const rawPayment = text(dto.payment_status);
      const paymentStatus: PaymentStatus | null =
        rawPayment === null
          ? null
          : Object.hasOwn(paymentLabels, rawPayment)
            ? (rawPayment as PaymentStatus)
            : "unknown";
      const depositPaid =
        typeof dto.deposit_paid === "boolean" ? dto.deposit_paid : null;
      return {
        id: positiveId(dto.id),
        date: calendarDate(dto.appointment_date),
        startTime: normalizeTime(dto.start_time),
        endTime: normalizeTime(dto.end_time),
        status,
        statusLabel: statusLabels[status],
        depositPaid,
        depositAmount: amount(dto.deposit_amount),
        notes: text(dto.notes),
        paymentStatus,
        paymentLabel:
          depositPaid === true
            ? "Pagado"
            : paymentStatus !== null
              ? paymentLabels[paymentStatus]
              : depositPaid === false
                ? "Pendiente"
                : null,
        paymentReference: text(dto.payment_reference),
        paymentReceiptUrl: text(dto.payment_receipt_url),
        paymentSubmittedAt: text(dto.payment_submitted_at),
        paymentReviewedAt: text(dto.payment_reviewed_at),
        paymentReviewNotes: text(dto.payment_review_notes),
      };
    })
    .sort((a, b) =>
      `${a.date ?? "9999"} ${a.startTime ?? ""}`.localeCompare(
        `${b.date ?? "9999"} ${b.startTime ?? ""}`,
      ),
    );
}

export function availabilityFromApi(
  value: unknown,
  date: string,
): Availability {
  if (!Array.isArray(value))
    throw new Error("La respuesta de disponibilidad no es válida.");
  const times = value.map(normalizeTime);
  if (times.some((time) => time === null))
    throw new Error("La respuesta de disponibilidad no es válida.");
  return [
    ...new Set(
      times.filter(
        (time): time is string => time !== null && isFutureSlot(date, time),
      ),
    ),
  ].sort();
}

export function createdAppointmentFromApi(value: unknown): CreatedAppointment {
  const data = record(value);
  const message = text(data.message);
  return {
    appointmentId: positiveId(data.appointmentId),
    paymentReference: text(data.paymentReference),
    depositAmount: amount(data.depositAmount),
    message:
      message && message.length <= 500
        ? message
        : "Tu cita se solicitó correctamente.",
  };
}

export function cancelledAppointmentFromApi(value: unknown): {
  cancelled: true;
} {
  if (record(value).cancelled !== true)
    throw new Error("No se pudo confirmar la cancelación de la cita.");
  return { cancelled: true };
}

export function rescheduledAppointmentFromApi(
  value: unknown,
): RescheduleAppointmentResult {
  const data = record(value);
  const date = calendarDate(data.date);
  const startTime = normalizeTime(data.startTime);
  if (data.rescheduled !== true || !date || !startTime)
    throw new Error("No se pudo confirmar la reprogramación de la cita.");
  return { rescheduled: true, date, startTime };
}
