export const OPOSICION_MAX_LENGTH = 1000;

export interface OposicionForm {
  tratamiento: string;
  motivo: string;
}

export interface SolicitudOposicion extends OposicionForm {
  nombreCompleto: string;
  correoContacto: string;
}
