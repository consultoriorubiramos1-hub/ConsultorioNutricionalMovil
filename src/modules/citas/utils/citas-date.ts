export function calendarDate(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T|$)/.exec(value.trim());
  if (!match) return null;
  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return date.getUTCFullYear() === Number(year) &&
    date.getUTCMonth() + 1 === Number(month) &&
    date.getUTCDate() === Number(day)
    ? `${year}-${month}-${day}`
    : null;
}

export function normalizeTime(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const match = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value.trim());
  return match &&
    Number(match[1]) < 24 &&
    Number(match[2]) < 60 &&
    Number(match[3] ?? 0) < 60
    ? `${match[1]}:${match[2]}:${match[3] ?? "00"}`
    : null;
}

export function clinicNow(now = new Date()): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const part = (type: string) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return {
    date: `${part("year")}-${part("month")}-${part("day")}`,
    time: `${part("hour")}:${part("minute")}:${part("second")}`,
  };
}

export function isBookableDate(value: string, now = new Date()): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    calendarDate(value) === value &&
    value >= clinicNow(now).date
  );
}

export function isFutureSlot(
  date: string,
  time: string,
  now = new Date(),
): boolean {
  const current = clinicNow(now);
  return (
    isBookableDate(date, now) &&
    normalizeTime(time) !== null &&
    `${date} ${time}` > `${current.date} ${current.time}`
  );
}

export function formatAppointmentDate(value: string | null): string {
  if (!value) return "Fecha por confirmar";
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function canModifyAppointment(appointment: {
  date: string | null;
  startTime: string | null;
  status: string;
}): boolean {
  return (
    ["scheduled", "pending_payment", "confirmed"].includes(
      appointment.status,
    ) &&
    appointment.date !== null &&
    appointment.startTime !== null &&
    isFutureSlot(appointment.date, appointment.startTime)
  );
}
