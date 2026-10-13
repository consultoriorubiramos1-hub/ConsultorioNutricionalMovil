import { login } from "@/modules/auth/services/auth.service";
import { actualizarDatosPerfil, obtenerPerfil } from "@/modules/perfil/services/perfil-service";
import { createAppointment, getAppointments } from "@/modules/citas/services/citas-service";
import { obtenerDashboard, DashboardSessionError } from "@/modules/dashboard/services/dashboard-service";

// Integración de servicios y adapters reales; fetch y módulos nativos simulados.
// No comprueba HTTP real, Express, PostgreSQL ni Neon.
const response = (data: unknown, status = 200) => ({
  ok: status < 400, status, json: async () => data,
}) as Response;
const fetchMock = () => global.fetch as jest.MockedFunction<typeof fetch>;

describe("App–contrato API con transporte simulado", () => {
  afterEach(() => jest.useRealTimers());
  test("PI-01 simulada: POST de login y transformación de paciente", async () => {
    const user = { id: "fixture", username: "test", email: "test@example.test", rol_id: 2 };
    fetchMock().mockResolvedValueOnce(response({ ok: true, data: { token: "fixture-token", user } }));
    expect(await login({ username: "test", password: "fixture-password" })).toEqual({ success: true, token: "fixture-token", user });
    expect(fetchMock()).toHaveBeenCalledWith("https://api.example.test/api/mobile/auth/login", expect.objectContaining({ method: "POST", body: JSON.stringify({ username: "test", password: "fixture-password" }) }));
  });
  test.each([400, 401, 403])("PI-01 simulada: propaga autenticación inválida (%s)", async (status) => {
    fetchMock().mockResolvedValueOnce(response({ ok: false, message: "fixture" }, status));
    expect(await login({ username: "test", password: "invalid" })).toMatchObject({ success: false, status });
  });
  test("login maneja cuerpo no JSON y desconexión", async () => {
    fetchMock().mockResolvedValueOnce({ ok: true, status: 200, json: async () => { throw new Error("HTML"); } } as unknown as Response);
    expect(await login({ username: "test", password: "fixture" })).toMatchObject({ success: false, message: "El servidor devolvió una respuesta no válida." });
    fetchMock().mockRejectedValueOnce(new Error("Network failed"));
    expect(await login({ username: "test", password: "fixture" })).toMatchObject({ success: false, message: expect.stringContaining("conectar") });
  });
  test("PI-02 simulada: solicitud multipart y consulta posterior adaptada", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-10-07T18:00:00Z"));
    fetchMock().mockResolvedValueOnce(response({ ok: true, data: { appointmentId: 7, message: "Recibida" } }));
    const created = await createAppointment("fixture-token", {
      appointmentDate: "2026-10-08", startTime: "13:30:00", notes: " Seguimiento ",
      receipt: { uri: "file:///fixture.jpg", name: "comprobante.jpg", type: "image/jpeg", size: 1024 },
    });
    expect(created.appointmentId).toBe(7);
    const options = fetchMock().mock.calls[0][1];
    expect(options?.method).toBe("POST");
    expect(options?.headers).toEqual({ Accept: "application/json", Authorization: "Bearer fixture-token" });
    expect(options?.body).toBeInstanceOf(FormData);
    // Es una respuesta programada: no representa persistencia en una BD.
    fetchMock().mockResolvedValueOnce(response({ ok: true, data: [{ id: 7, appointment_date: "2026-10-08", start_time: "13:30:00", status: "pending_payment" }] }));
    expect(await getAppointments("fixture-token")).toEqual([expect.objectContaining({ id: 7, date: "2026-10-08", statusLabel: "Pendiente de anticipo" })]);
  });
  test("perfil realiza PATCH autenticado y vuelve a transformar la consulta", async () => {
    fetchMock().mockResolvedValueOnce(response({ ok: true })).mockResolvedValueOnce(response({ ok: true, data: { first_name: " Luz ", phone: null } }));
    await actualizarDatosPerfil(" fixture-token ", { first_name: "Luz" });
    expect(fetchMock()).toHaveBeenNthCalledWith(1, "https://api.example.test/api/mobile/perfil", expect.objectContaining({ method: "PATCH", body: '{"first_name":"Luz"}', headers: expect.objectContaining({ Authorization: "Bearer fixture-token" }) }));
    expect(await obtenerPerfil("fixture-token")).toMatchObject({ firstName: "Luz", phone: "" });
  });
  test("dashboard integra historial y citas, conserva fallo parcial y rechaza sesión expirada", async () => {
    fetchMock().mockResolvedValueOnce(response({ ok: true, data: { patient: {}, followUpEvaluations: [] } })).mockResolvedValueOnce(response({ ok: false }, 500));
    const dashboard = await obtenerDashboard("fixture-token", new AbortController().signal);
    expect(dashboard.health?.currentWeight).toBeNull();
    expect(dashboard.appointmentsAvailable).toBe(false);
    expect(dashboard.errors).toHaveLength(1);
    fetchMock().mockResolvedValueOnce(response({ ok: false }, 401)).mockResolvedValueOnce(response({ ok: true, data: [] }));
    await expect(obtenerDashboard("fixture-token", new AbortController().signal)).rejects.toBeInstanceOf(DashboardSessionError);
  });
});
