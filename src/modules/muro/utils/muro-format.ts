export function safeHttpUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const raw = value.trim();
  if (!/^https?:\/\//i.test(raw) || /[\u0000-\u001f\u007f\\]/.test(raw)) return null;
  try {
    const url = new URL(raw);
    if (!/^https?:$/.test(url.protocol) || !url.hostname || url.username || url.password) return null;
    return url.href;
  } catch { return null; }
}

export function safeLinkLabel(value: string): string {
  const safe = safeHttpUrl(value);
  if (!safe) return "Enlace no disponible";
  const url = new URL(safe);
  return url.hostname + (url.pathname === "/" ? "" : url.pathname);
}

export function positiveId(value: unknown): number | null {
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (typeof value === "string" && !/^\d+$/.test(value.trim())) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export function formatPostDate(value: string | null): string | null {
  if (!value?.trim()) return null;
  const raw = value.trim();
  const calendar = /^(\d{4})-(\d{2})-(\d{2})(?:$|T)/.exec(raw);
  if (!calendar) return null;
  const year = Number(calendar[1]);
  const month = Number(calendar[2]);
  const day = Number(calendar[3]);
  const date = new Date(0);
  date.setFullYear(year, month - 1, day);
  date.setHours(12, 0, 0, 0);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  // Date-only values remain calendar dates; timestamps use the device's local time.
  const localDate = raw.length === 10 ? date : new Date(raw);
  if (!Number.isFinite(localDate.getTime())) return null;
  return localDate.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
}

export function likesLabel(count: number): string {
  return count.toLocaleString("es-MX") + (count === 1 ? " like" : " likes");
}
