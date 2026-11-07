import { z } from "zod";

export const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
export const MAX_PHOTO_SIDE = 1600;
export const photoFileSchema = z.object({
  size: z.number().positive("Escolha uma imagem.").max(MAX_PHOTO_BYTES, "Escolha uma imagem de até 8 MB."),
  type: z.enum(["image/jpeg", "image/png", "image/webp"], { message: "Envie uma imagem JPG, PNG ou WebP." }),
});
export function validatePhotoFile(file: { size: number; type: string }) {
  if (file.size <= 0) throw new Error("Escolha uma imagem para enviar.");
  if (file.size > MAX_PHOTO_BYTES) throw new Error("Escolha uma imagem de até 8 MB.");
  const result = photoFileSchema.safeParse(file);
  if (!result.success) throw new Error("Envie uma imagem JPG, PNG ou WebP.");
}
export function photoDimensions(width: number, height: number) {
  const ratio = Math.min(1, MAX_PHOTO_SIDE / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * ratio)), height: Math.max(1, Math.round(height * ratio)) };
}