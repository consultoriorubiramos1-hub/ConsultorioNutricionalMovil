import { Linking } from "react-native";

import { safeHttpUrl } from "../utils/muro-format";

export async function openExternalLink(value: string): Promise<void> {
  const url = safeHttpUrl(value);
  if (!url) throw new Error("Este enlace no está disponible.");
  try {
    // HTTP(S) can open directly; canOpenURL may fail under native package visibility
    // rules, and awaiting a capability probe on web can lose the popup gesture.
    await Linking.openURL(url);
  } catch {
    throw new Error("No se pudo abrir el enlace. Inténtalo nuevamente.");
  }
}
