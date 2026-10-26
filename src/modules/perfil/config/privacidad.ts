// Medio ARCO ya publicado en el aviso de privacidad del proyecto:
// src/modules/auth/content/legal-documents.ts, apartado 7. Derechos ARCO.
// Si deja de estar configurado, usar null para deshabilitar la preparación del correo.
export const CORREO_PRIVACIDAD: string | null = "contacto@rubinutricion.com";

export function obtenerCorreoPrivacidad(): string | null {
  const correo = CORREO_PRIVACIDAD?.trim();
  return correo && /^[^\s@<>,;:?&#]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(correo)
    ? correo
    : null;
}
