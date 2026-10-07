import {
  MAX_RECEIPT_BYTES,
  type Receipt,
  type ReceiptMime,
} from "../models/citas.model";

interface ReceiptAsset {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
  fileSize?: number;
  file?: Blob;
}

export function validateReceipt(receipt: Receipt): void {
  if (!["image/jpeg", "image/png", "image/webp"].includes(receipt.type))
    throw new Error("El comprobante debe ser JPG, PNG o WEBP.");
  if (!receipt.uri || !Number.isFinite(receipt.size) || receipt.size <= 0)
    throw new Error(
      "No fue posible leer el comprobante. Selecciona otra imagen.",
    );
  if (receipt.size > MAX_RECEIPT_BYTES)
    throw new Error("El comprobante no puede superar 5 MB.");
}

export function receiptFromAsset(
  asset: ReceiptAsset,
  nativeSize?: number,
): Receipt {
  const suffix = /\.(jpe?g|png|webp)$/i
    .exec((asset.fileName ?? asset.uri).split("?")[0])?.[1]
    ?.toLowerCase();
  const fallbackType =
    suffix === "jpg" || suffix === "jpeg"
      ? "image/jpeg"
      : suffix
        ? `image/${suffix}`
        : null;
  const mime = asset.file?.type || asset.mimeType || fallbackType;
  if (mime !== "image/jpeg" && mime !== "image/png" && mime !== "image/webp")
    throw new Error("El comprobante debe ser JPG, PNG o WEBP.");
  const type: ReceiptMime = mime;
  const extension = type === "image/jpeg" ? "jpg" : type.split("/")[1];
  const receipt: Receipt = {
    uri: asset.uri,
    name: `comprobante.${extension}`,
    type,
    size: asset.file?.size ?? nativeSize ?? asset.fileSize ?? 0,
    ...(asset.file ? { webFile: asset.file } : {}),
  };
  validateReceipt(receipt);
  return receipt;
}
