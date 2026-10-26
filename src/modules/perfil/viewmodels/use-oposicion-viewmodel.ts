import { useState } from "react";

import { oposicionFromPerfil } from "../adapters/oposicion-adapter";
import type { Perfil } from "../models/perfil.model";
import { abrirCorreoOposicion } from "../services/oposicion-service";
import { validarOposicion } from "../utils/oposicion-form";
import { useSolicitudArcoViewModel } from "./use-solicitud-arco-viewmodel";

export function useOposicionViewModel(perfil: Perfil) {
  const [tratamiento, setTratamiento] = useState("");
  const [motivo, setMotivo] = useState("");
  const { solicitar, ...solicitud } = useSolicitudArcoViewModel({
    nombreCompleto: perfil.nombreCompleto,
    derecho: "oposición",
    crearSolicitud: () => oposicionFromPerfil(perfil, { tratamiento, motivo }),
    validarSolicitud: validarOposicion,
    abrirCorreo: abrirCorreoOposicion,
    tituloConfirmacion: "¿Deseas presentar tu solicitud de oposición?",
    mensajeConfirmacion: "El consultorio revisará tu solicitud y te informará la resolución correspondiente. Tu cuenta y tus datos no serán modificados automáticamente.",
  });

  return { tratamiento, setTratamiento, motivo, setMotivo, ...solicitud, solicitarOposicion: solicitar };
}
