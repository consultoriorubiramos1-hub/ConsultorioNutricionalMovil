import { cancelacionToMailto } from "../adapters/cancelacion-adapter";
import type { SolicitudCancelacion } from "../models/cancelacion.model";
import { abrirCorreoArco } from "./correo-arco-service";

// Solo prepara un correo. Abrir la aplicación no confirma envío ni recepción.
export async function abrirCorreoCancelacion(solicitud: SolicitudCancelacion): Promise<void> {
  await abrirCorreoArco(solicitud.nombreCompleto, "cancelación", (correo) => cancelacionToMailto(solicitud, correo));
}
