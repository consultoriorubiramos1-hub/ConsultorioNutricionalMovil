import type { SolicitudCancelacion } from "../models/cancelacion.model";
import type { Perfil } from "../models/perfil.model";

export function cancelacionFromPerfil(
  perfil: Pick<Perfil, "nombreCompleto" | "email">,
  motivo: string,
): SolicitudCancelacion {
  // Lista explícita: no copiar el perfil completo ni datos clínicos o de sesión.
  return {
    nombreCompleto: perfil.nombreCompleto.trim(),
    correoContacto: perfil.email.trim(),
    motivo: motivo.trim(),
  };
}

export function cancelacionToMailto(
  solicitud: SolicitudCancelacion,
  destinatario: string,
): string {
  const asunto = "Solicitud de derecho ARCO - Cancelación";
  const mensaje = [
    "Solicito ejercer mi derecho de cancelación de datos personales.",
    "",
    `Nombre: ${solicitud.nombreCompleto}`,
    `Correo de contacto: ${solicitud.correoContacto || "No disponible en la cuenta."}`,
    `Descripción de la solicitud: ${solicitud.motivo || "Solicito cancelar todos los datos personales que legalmente proceda cancelar."}`,
    "",
    "Solicito información sobre el procedimiento correspondiente y la resolución de mi solicitud.",
  ].join("\n");

  return `mailto:${destinatario}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(mensaje)}`;
}
