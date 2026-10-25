import { useEffect, useRef, useState } from "react";
import { Alert } from "react-native";

import { cancelacionFromPerfil } from "../adapters/cancelacion-adapter";
import { obtenerCorreoPrivacidad } from "../config/privacidad";
import type { SolicitudCancelacion } from "../models/cancelacion.model";
import type { Perfil } from "../models/perfil.model";
import { abrirCorreoCancelacion } from "../services/cancelacion-service";

export function useCancelacionViewModel(perfil: Perfil) {
  const [motivo, setMotivo] = useState("");
  const [abriendoCorreo, setAbriendoCorreo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const enCurso = useRef(false);
  const confirmando = useRef(false);
  const activo = useRef(true);
  const correoPrivacidad = obtenerCorreoPrivacidad();
  const impedimento = !correoPrivacidad
    ? "Falta configurar el correo oficial de privacidad del consultorio para habilitar el envío."
    : !perfil.nombreCompleto.trim()
      ? "El nombre completo no está disponible en tu perfil. Vuelve a cargarlo antes de solicitar la cancelación."
      : null;

  useEffect(() => {
    activo.current = true;
    return () => { activo.current = false; confirmando.current = false; };
  }, []);

  const prepararCorreo = async (solicitud: SolicitudCancelacion) => {
    if (!activo.current || enCurso.current) return;
    enCurso.current = true;
    setAbriendoCorreo(true);
    try {
      await abrirCorreoCancelacion(solicitud);
      if (activo.current) {
        setAviso("Se abrió la aplicación de correo. Revisa el mensaje y presiona Enviar para presentar tu solicitud. Esta aplicación no confirma su envío ni recepción.");
      }
    } catch (cause) {
      if (activo.current) {
        setError(cause instanceof Error ? cause.message : "No fue posible preparar el correo. Inténtalo de nuevo.");
      }
    } finally {
      enCurso.current = false;
      if (activo.current) setAbriendoCorreo(false);
    }
  };

  const solicitarCancelacion = () => {
    if (!activo.current || enCurso.current || confirmando.current) return;
    setError(null);
    setAviso(null);
    if (impedimento) {
      setError(impedimento);
      return;
    }

    const solicitud = cancelacionFromPerfil(perfil, motivo);
    confirmando.current = true;
    const cancelar = () => { confirmando.current = false; };
    Alert.alert(
      "¿Deseas enviar tu solicitud de cancelación?",
      "El consultorio revisará tu solicitud. Tu cuenta permanecerá activa hasta que se determine y aplique la resolución correspondiente.",
      [
        { text: "Cancelar", style: "cancel", onPress: cancelar },
        {
          text: "Confirmar solicitud",
          onPress: () => {
            if (!confirmando.current) return;
            confirmando.current = false;
            void prepararCorreo(solicitud);
          },
        },
      ],
      { cancelable: true, onDismiss: cancelar },
    );
  };

  return {
    motivo, setMotivo, abriendoCorreo, error, aviso, correoPrivacidad,
    impedimento, solicitarCancelacion,
  };
}
