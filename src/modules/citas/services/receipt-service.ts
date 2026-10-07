import { File } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { Platform } from "react-native";

import { receiptFromAsset } from "../adapters/receipt-adapter";
import type { Receipt } from "../models/citas.model";

export async function selectReceipt(): Promise<Receipt | null> {
  let result: ImagePicker.ImagePickerResult;
  try {
    result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      allowsMultipleSelection: false,
      quality: 1,
      preferredAssetRepresentationMode:
        ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
    });
  } catch {
    throw new Error(
      "No fue posible abrir tus imágenes. Revisa el permiso de fotos e inténtalo nuevamente.",
    );
  }
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (!asset) throw new Error("No fue posible leer la imagen seleccionada.");
  let size: number | undefined;
  if (Platform.OS !== "web") {
    try {
      size = new File(asset.uri).size;
    } catch {
      size = asset.fileSize;
    }
  }
  return receiptFromAsset(asset, size);
}
