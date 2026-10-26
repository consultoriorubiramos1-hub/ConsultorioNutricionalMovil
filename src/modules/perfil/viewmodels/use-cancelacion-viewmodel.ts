import { useState } from "react";

import { cancelacionFromPerfil } from "../adapters/cancelacion-adapter";
import type { Perfil } from "../models/perfil.model";
import { abrirCorreoCancelacion } from "../services/cancelacion-service";
import { useSolicitudArcoViewModel } from "./use-solicitud-arco-viewmodel";

export function useCancelacionViewModel(perfil: Perfil) {
  const [motivo, setMotivo] = useState("");
  const { solicitar, ...solicitud } = useSolicitudArcoViewModel({
    nombreCompleto: perfil.nombreCompleto,
    derecho: "cancelación",
    crearSolicitud: () => cancelacionFromPerfil(perfil, motivo),
    abrirCorreo: abrirCorreoCancelacion,
    tituloConfirmacion: "¿Deseas enviar tu solicitud de cancelación?",
    mensajeConfirmacion: "El consultorio revisará tu solicitud. Tu cuenta permanecerá activa hasta que se determine y aplique la resolución correspondiente.",
  });

  return { motivo, setMotivo, ...solicitud, solicitarCancelacion: solicitar };
}
