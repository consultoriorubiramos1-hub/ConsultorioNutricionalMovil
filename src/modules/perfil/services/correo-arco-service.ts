import * as Linking from "expo-linking";

import { obtenerCorreoPrivacidad } from "../config/privacidad";

// Compartido por los derechos ARCO. Abrir el correo no confirma envío ni recepción.
export async function abrirCorreoArco(
  nombreCompleto: string,
  derecho: "cancelación" | "oposición",
  crearUrl: (correo: string) => string,
): Promise<void> {
  const correo = obtenerCorreoPrivacidad();
  if (!correo) {
    throw new Error("Falta configurar el correo oficial de privacidad del consultorio para habilitar el envío.");
  }
  if (!nombreCompleto) {
    throw new Error(`El nombre completo no está disponible en tu perfil. Vuelve a cargarlo antes de solicitar la ${derecho}.`);
  }

  try {
    // openURL rechaza si no hay app compatible; no depende de consultas de
    // esquemas que pueden restringirse en Android/iOS.
    await Linking.openURL(crearUrl(correo));
  } catch {
    throw new Error(
      `No fue posible abrir la aplicación de correo. Configura una aplicación de correo e inténtalo de nuevo. También puedes escribir a ${correo} para solicitar la ${derecho}.`,
    );
  }
}
