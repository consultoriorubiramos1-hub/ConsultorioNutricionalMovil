import type { OposicionForm, SolicitudOposicion } from "../models/oposicion.model";
import type { Perfil } from "../models/perfil.model";

export function oposicionFromPerfil(
  perfil: Pick<Perfil, "nombreCompleto" | "email">,
  form: OposicionForm,
): SolicitudOposicion {
  // Solo los datos necesarios para la solicitud; nunca copiar el perfil completo.
  return {
    nombreCompleto: perfil.nombreCompleto.trim(),
    correoContacto: perfil.email.trim(),
    tratamiento: form.tratamiento.trim(),
    motivo: form.motivo.trim(),
  };
}

export function oposicionToMailto(solicitud: SolicitudOposicion, destinatario: string): string {
  const asunto = "Solicitud de derecho ARCO - Oposición";
  const mensaje = [
    "Solicito ejercer mi derecho de oposición al tratamiento de datos personales.",
    `Nombre: ${solicitud.nombreCompleto}`,
    `Correo de contacto: ${solicitud.correoContacto || "No disponible en la cuenta."}`,
    `Tratamiento o finalidad a la que me opongo: ${solicitud.tratamiento}`,
    `Motivo de la oposición: ${solicitud.motivo}`,
    "Solicito que el consultorio revise mi solicitud, determine su procedencia y me informe la resolución correspondiente.",
  ].join("\n\n");
  const correo = encodeURIComponent(destinatario).replace(/%40/g, "@");

  return `mailto:${correo}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(mensaje)}`;
}
