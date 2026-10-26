import { OPOSICION_MAX_LENGTH, type OposicionForm } from "../models/oposicion.model";

export function validarOposicion(form: OposicionForm): string | null {
  if (!form.tratamiento.trim()) {
    return "Indica a qué uso de tus datos deseas oponerte.";
  }
  if (form.tratamiento.trim().length > OPOSICION_MAX_LENGTH) {
    return `El tratamiento o finalidad debe tener como máximo ${OPOSICION_MAX_LENGTH} caracteres.`;
  }
  if (!form.motivo.trim()) {
    return "Explica el motivo de tu oposición.";
  }
  if (form.motivo.trim().length > OPOSICION_MAX_LENGTH) {
    return `El motivo debe tener como máximo ${OPOSICION_MAX_LENGTH} caracteres.`;
  }
  return null;
}
