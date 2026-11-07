import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { imageSize } from "image-size";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { MAX_PHOTO_SIDE, validatePhotoFile } from "./photo-rules";

export const uploadPhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    if (!(input instanceof FormData)) throw new Error("Escolha seu print para enviar.");
    const companyId = z.string().uuid().parse(input.get("companyId"));
    const file = input.get("file");
    if (!(file instanceof File)) throw new Error("Escolha seu print para enviar.");
    validatePhotoFile(file);
    return { companyId, file };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle();
    const { data: member } = await supabase.from("memberships").select("company_id").eq("customer_id", userId).eq("company_id", data.companyId).maybeSingle();
    if (role?.role !== "cliente" || !member) return { ok: false, message: "Você não pode enviar prints para esta loja." };
    const bytes = new Uint8Array(await data.file.arrayBuffer());
    let image;
    try { image = imageSize(bytes); } catch { return { ok: false, message: "Não conseguimos abrir este print. Escolha outra imagem." }; }
    if (!image.width || !image.height || Math.max(image.width, image.height) > MAX_PHOTO_SIDE || !["jpg", "png", "webp"].includes(image.type ?? "")) {
      return { ok: false, message: "Envie um print JPG, PNG ou WebP de até 1600 px." };
    }
    const ext = image.type === "jpg" ? "jpg" : image.type === "png" ? "png" : "webp";
    const mime = ext === "jpg" ? "image/jpeg" : `image/${ext}`;
    const path = `${data.companyId}/${userId}/${crypto.randomUUID()}.${ext}`;
    // Privileged storage writes only after verifying the caller, membership and actual file bytes.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: storageError } = await supabaseAdmin.storage.from("prints").upload(path, bytes, { contentType: mime, upsert: false });
    if (storageError) return { ok: false, message: "Não conseguimos enviar agora. Tente de novo em instantes." };
    const { error } = await supabase.rpc("enviar_foto", { _company_id: data.companyId, _image_path: path });
    if (error) {
      await supabaseAdmin.storage.from("prints").remove([path]);
      return { ok: false, message: error.message };
    }
    return { ok: true, message: "Foto enviada, aguardando aprovação." };
  });

const reviewSchema = z.object({ submissionId: z.string().uuid(), approve: z.boolean() });
export const reviewPhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => reviewSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc(data.approve ? "aprovar_foto" : "recusar_foto", { _submission_id: data.submissionId });
    return error ? { ok: false, message: error.message } : { ok: true, message: data.approve ? "Foto aprovada! Pontos adicionados." : "Foto recusada." };
  });