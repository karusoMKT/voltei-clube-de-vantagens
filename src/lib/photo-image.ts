import { photoDimensions, validatePhotoFile } from "./photo-rules";

export async function preparePhoto(file: File): Promise<File> {
  validatePhotoFile(file);
  const bitmap = await createImageBitmap(file);
  try {
    const size = photoDimensions(bitmap.width, bitmap.height);
    const canvas = document.createElement("canvas");
    canvas.width = size.width;
    canvas.height = size.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Não conseguimos preparar esta imagem. Tente outra.");
    ctx.drawImage(bitmap, 0, 0, size.width, size.height);
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(
      (value) => value ? resolve(value) : reject(new Error("Não conseguimos preparar esta imagem.")), "image/webp", 0.9,
    ));
    const output = new File([blob], "print.webp", { type: blob.type });
    validatePhotoFile(output);
    return output;
  } finally { bitmap.close(); }
}