import { oposicionToMailto } from "../adapters/oposicion-adapter";
import type { SolicitudOposicion } from "../models/oposicion.model";
import { validarOposicion } from "../utils/oposicion-form";
import { abrirCorreoArco } from "./correo-arco-service";

export async function abrirCorreoOposicion(solicitud: SolicitudOposicion): Promise<void> {
  const error = validarOposicion(solicitud);
  if (error) throw new Error(error);

  await abrirCorreoArco(solicitud.nombreCompleto.trim(), "oposición", (correo) => oposicionToMailto(solicitud, correo));
}
