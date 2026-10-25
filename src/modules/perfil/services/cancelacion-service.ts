import * as Linking from "expo-linking";

import { cancelacionToMailto } from "../adapters/cancelacion-adapter";
import { obtenerCorreoPrivacidad } from "../config/privacidad";
import type { SolicitudCancelacion } from "../models/cancelacion.model";

// Solo prepara un correo. Abrir la aplicación no confirma envío ni recepción.
export async function abrirCorreoCancelacion(solicitud: SolicitudCancelacion): Promise<void> {
  const correo = obtenerCorreoPrivacidad();
  if (!correo) {
    throw new Error("Falta configurar el correo oficial de privacidad del consultorio para habilitar el envío.");
  }
  if (!solicitud.nombreCompleto) {
    throw new Error("El nombre completo no está disponible en tu perfil. Vuelve a cargarlo antes de solicitar la cancelación.");
  }

  try {
    // openURL rechaza si no hay una app compatible. Evita los falsos negativos de
    // canOpenURL cuando faltan permisos de consulta de esquemas en Android/iOS.
    await Linking.openURL(cancelacionToMailto(solicitud, correo));
  } catch {
    throw new Error(
      `No fue posible abrir la aplicación de correo. Configura una aplicación de correo e inténtalo de nuevo. También puedes escribir a ${correo} para solicitar la cancelación.`,
    );
  }
}
