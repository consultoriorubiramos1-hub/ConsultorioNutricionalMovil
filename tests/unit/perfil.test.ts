import { perfilFromApi } from "@/modules/perfil/adapters/perfil-adapter";
import { buildCuentaPatch, buildDatosPatch, formatIsoDateForDisplay, parseDisplayDate, toDatosForm, validateCuenta, validateDatos } from "@/modules/perfil/utils/perfil-form";

const perfil = perfilFromApi({ username: " fixture ", email: "test@example.test", first_name: " Ana ", first_lastname: " Pérez ", second_lastname: " López ", fecha_nacimiento: "2000-02-08T00:00:00.000Z", phone: "5551234567" });

describe("Perfil: transformación y reglas existentes", () => {
  test("normaliza nombres y conserva campos opcionales vacíos", () => {
    expect(perfil.nombreCompleto).toBe("Ana Pérez López");
    expect(perfil.secondName).toBeNull();
    expect(perfilFromApi({}).phone).toBe("");
    expect(perfilFromApi({ age: 0, gender: " " }).age).toBe(0);
    expect(perfilFromApi({ nombre_completo: " Nombre recibido " }).nombreCompleto).toBe("Nombre recibido");
  });
  test("presenta fechas sin desplazamiento UTC y rechaza días imposibles", () => {
    expect(formatIsoDateForDisplay(perfil.fechaNacimiento)).toBe("08/02/2000");
    expect(formatIsoDateForDisplay(null)).toBe("");
    expect(parseDisplayDate("29/02/2024")).toBe("2024-02-29");
    expect(parseDisplayDate("29/02/2025")).toBeNull();
    expect(parseDisplayDate("31/04/2026")).toBeNull();
    expect(parseDisplayDate("2000-02-08")).toBeNull();
  });
  test.each(["firstName", "firstLastname", "secondLastname"] as const)("exige %s", (field) => {
    expect(validateDatos({ ...toDatosForm(perfil), [field]: " " })).toMatch(/obligatorio/);
  });
  test("valida fecha, teléfono y cuenta sin inventar reglas", () => {
    expect(validateDatos(toDatosForm(perfil))).toBeNull();
    expect(validateDatos({ ...toDatosForm(perfil), phone: "55abc" })).toMatch(/10 dígitos/);
    expect(validateDatos({ ...toDatosForm(perfil), fechaNacimiento: "" })).toMatch(/DD\/MM\/AAAA/);
    expect(validateCuenta({ username: " ", email: "test@example.test" })).toMatch(/obligatorio/);
    expect(validateCuenta({ username: "fixture", email: "incorrecto" })).toMatch(/válido/);
    expect(validateCuenta({ username: " fixture ", email: " test@example.test " })).toBeNull();
  });
  test("envía únicamente cambios y trata segundo nombre vacío como null", () => {
    expect(buildDatosPatch(perfil, toDatosForm(perfil))).toEqual({});
    expect(buildDatosPatch({ ...perfil, secondName: "María" }, toDatosForm(perfil))).toEqual({ second_name: null });
    expect(buildDatosPatch(perfil, { ...toDatosForm(perfil), firstName: " Luz ", fechaNacimiento: "09/02/2000" })).toEqual({ first_name: "Luz", fecha_nacimiento: "2000-02-09" });
    expect(buildCuentaPatch(perfil, { username: "nuevo", email: perfil.email })).toEqual({ username: "nuevo" });
  });
});
