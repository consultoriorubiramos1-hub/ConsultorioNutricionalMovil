import { useEffect, useRef, useState } from "react";
import { Alert } from "react-native";

import { obtenerCorreoPrivacidad } from "../config/privacidad";

interface SolicitudArcoOptions<Solicitud> {
  nombreCompleto: string;
  derecho: "cancelación" | "oposición";
  crearSolicitud: () => Solicitud;
  validarSolicitud?: (solicitud: Solicitud) => string | null;
  abrirCorreo: (solicitud: Solicitud) => Promise<void>;
  tituloConfirmacion: string;
  mensajeConfirmacion: string;
}

export function useSolicitudArcoViewModel<Solicitud>({
  nombreCompleto, derecho, crearSolicitud, validarSolicitud, abrirCorreo,
  tituloConfirmacion, mensajeConfirmacion,
}: SolicitudArcoOptions<Solicitud>) {
  const [abriendoCorreo, setAbriendoCorreo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const enCurso = useRef(false);
  const confirmando = useRef(false);
  const activo = useRef(true);
  const correoPrivacidad = obtenerCorreoPrivacidad();
  const impedimento = !correoPrivacidad
    ? "Falta configurar el correo oficial de privacidad del consultorio para habilitar el envío."
    : !nombreCompleto.trim()
      ? `El nombre completo no está disponible en tu perfil. Vuelve a cargarlo antes de solicitar la ${derecho}.`
      : null;

  useEffect(() => {
    activo.current = true;
    return () => { activo.current = false; confirmando.current = false; };
  }, []);

  const prepararCorreo = async (solicitud: Solicitud) => {
    if (!activo.current || enCurso.current) return;
    enCurso.current = true;
    setAbriendoCorreo(true);
    try {
      await abrirCorreo(solicitud);
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

  const solicitar = () => {
    if (!activo.current || enCurso.current || confirmando.current) return;
    setError(null);
    setAviso(null);
    if (impedimento) {
      setError(impedimento);
      return;
    }

    // Snapshot de los datos validados: confirmar no lee ediciones posteriores.
    const solicitud = crearSolicitud();
    const errorValidacion = validarSolicitud?.(solicitud);
    if (errorValidacion) {
      setError(errorValidacion);
      return;
    }
    confirmando.current = true;
    const cancelar = () => { confirmando.current = false; };
    Alert.alert(
      tituloConfirmacion,
      mensajeConfirmacion,
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

  return { abriendoCorreo, error, aviso, correoPrivacidad, impedimento, solicitar };
}
