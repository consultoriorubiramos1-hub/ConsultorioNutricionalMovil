import { Redirect } from 'expo-router';

// Conserva los enlaces antiguos sin montar reservas, consultar citas ni solicitar permisos.
export function CitasView() {
  return <Redirect href="/inicio" />;
}
