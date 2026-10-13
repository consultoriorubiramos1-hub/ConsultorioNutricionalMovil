import type { CuentaPerfilForm, DatosPerfilForm, Perfil } from "../models/perfil.model";
import type { ActualizarCuentaPerfilPayload, ActualizarDatosPerfilPayload } from "../services/perfil-service";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function formatIsoDateForDisplay(value: string | null): string {
  if (!value) {
    return "";
  }

  const normalized = value.trim();

  // Acepta tanto:
  // 2005-02-08
  // como:
  // 2005-02-08T00:00:00.000Z
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(normalized);

  if (!match) {
    return normalized;
  }

  const [, year, month, day] = match;

  return `${day}/${month}/${year}`;
}

export function parseDisplayDate(value: string): string | null {
  const normalized = value.trim();

  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(normalized);

  if (!match) {
    return null;
  }

  const [, day, month, year] = match;

  const date = new Date(Number(year), Number(month) - 1, Number(day));

  if (
    date.getFullYear() !== Number(year) ||
    date.getMonth() !== Number(month) - 1 ||
    date.getDate() !== Number(day)
  ) {
    return null;
  }

  return `${year}-${month}-${day}`;
}

export function toDatosForm(perfil: Perfil): DatosPerfilForm {
  return {
    firstName: perfil.firstName,
    secondName: perfil.secondName ?? "",
    firstLastname: perfil.firstLastname,
    secondLastname: perfil.secondLastname,
    fechaNacimiento: formatIsoDateForDisplay(perfil.fechaNacimiento),
    phone: perfil.phone,
  };
}

export function toCuentaForm(perfil: Perfil): CuentaPerfilForm {
  return {
    username: perfil.username,
    email: perfil.email,
  };
}

export function validateDatos(form: DatosPerfilForm): string | null {
  if (!form.firstName.trim()) {
    return "El nombre es obligatorio.";
  }

  if (!form.firstLastname.trim()) {
    return "El apellido paterno es obligatorio.";
  }

  if (!form.secondLastname.trim()) {
    return "El apellido materno es obligatorio.";
  }

  if (!parseDisplayDate(form.fechaNacimiento)) {
    return "La fecha de nacimiento debe tener el formato DD/MM/AAAA.";
  }

  const phone = form.phone.trim();

  if (!/^\d{10}$/.test(phone)) {
    return "El teléfono debe contener 10 dígitos.";
  }

  return null;
}

export function validateCuenta(form: CuentaPerfilForm): string | null {
  if (!form.username.trim()) {
    return "El nombre de usuario es obligatorio.";
  }

  if (!EMAIL_REGEX.test(form.email.trim())) {
    return "Ingresa un correo electrónico válido.";
  }

  return null;
}

export function buildDatosPatch(
  perfil: Perfil,
  form: DatosPerfilForm,
): ActualizarDatosPerfilPayload {
  const payload: ActualizarDatosPerfilPayload = {};

  const isoDate = parseDisplayDate(form.fechaNacimiento);
  const secondName = form.secondName.trim() || null;

  if (form.firstName.trim() !== perfil.firstName) {
    payload.first_name = form.firstName.trim();
  }

  if (secondName !== perfil.secondName) {
    payload.second_name = secondName;
  }

  if (form.firstLastname.trim() !== perfil.firstLastname) {
    payload.first_lastname = form.firstLastname.trim();
  }

  if (form.secondLastname.trim() !== perfil.secondLastname) {
    payload.second_lastname = form.secondLastname.trim();
  }

  const currentBirthDate = perfil.fechaNacimiento
    ? perfil.fechaNacimiento.slice(0, 10)
    : null;

  if (isoDate && isoDate !== currentBirthDate) {
    payload.fecha_nacimiento = isoDate;
  }

  if (form.phone.trim() !== perfil.phone) {
    payload.phone = form.phone.trim();
  }

  return payload;
}

export function buildCuentaPatch(
  perfil: Perfil,
  form: CuentaPerfilForm,
): ActualizarCuentaPerfilPayload {
  const payload: ActualizarCuentaPerfilPayload = {};

  if (form.username.trim() !== perfil.username) {
    payload.username = form.username.trim();
  }

  if (form.email.trim() !== perfil.email) {
    payload.email = form.email.trim();
  }

  return payload;
}
