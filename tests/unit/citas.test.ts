import { appointmentsFromApi, availabilityFromApi } from "@/modules/citas/adapters/citas-adapter";
import { validateReceipt } from "@/modules/citas/adapters/receipt-adapter";
import { calendarDate, isBookableDate, isFutureSlot, normalizeTime } from "@/modules/citas/utils/citas-date";

const now = new Date("2026-10-07T18:00:00Z");
describe("Citas: calendario del consultorio y contratos", () => {
  afterEach(() => jest.useRealTimers());
  test("rechaza fechas imposibles, pasadas y horarios transcurridos", () => {
    expect(calendarDate("2026-02-30")).toBeNull();
    expect(calendarDate("2026-10-08T00:00:00Z")).toBe("2026-10-08");
    expect(isBookableDate("2026-10-06", now)).toBe(false);
    expect(isFutureSlot("2026-10-07", "11:00:00", now)).toBe(false);
    expect(isFutureSlot("2026-10-08", "09:00:00", now)).toBe(true);
    expect(normalizeTime("25:00")).toBeNull();
  });
  test("deduplica y ordena disponibilidad futura", () => {
    jest.useFakeTimers().setSystemTime(now);
    expect(availabilityFromApi(["11:00", "14:00", "13:00", "14:00:00"], "2026-10-07")).toEqual(["13:00:00", "14:00:00"]);
    expect(() => availabilityFromApi(["inválido"], "2026-10-08")).toThrow();
  });
  test("adapta importes, estados y campos nulos", () => {
    const [appointment] = appointmentsFromApi([{ id: "7", deposit_amount: "100.50", status: "pending_payment", appointment_date: null }]);
    expect(appointment).toMatchObject({ id: 7, depositAmount: 100.5, statusLabel: "Pendiente de anticipo", date: null });
    expect(appointmentsFromApi([])).toEqual([]);
    expect(() => appointmentsFromApi([{ id: 0 }])).toThrow();
  });
  test("valida tipo y límite del comprobante", () => {
    const receipt = { uri: "file:///fixture.png", name: "fixture.png", type: "image/png" as const, size: 1024 };
    expect(() => validateReceipt(receipt)).not.toThrow();
    expect(() => validateReceipt({ ...receipt, size: 6 * 1024 * 1024 })).toThrow(/5 MB/);
    expect(() => validateReceipt({ ...receipt, size: 0 })).toThrow();
  });
});
