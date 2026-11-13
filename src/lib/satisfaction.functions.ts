import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { satisfactionSettingsSchema, satisfactionResponseSchema } from "./satisfaction";
export const getSatisfactionSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ companyId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: owner } = await context.supabase.rpc("is_owner_of", { _company: data.companyId });
    if (!owner) throw new Error("Você não tem acesso às configurações desta loja.");
    const { data: company, error } = await context.supabase.from("companies").select("google_review_url,google_review_points,plan,active").eq("id",data.companyId).single();
    if (error) throw new Error("Não conseguimos carregar as configurações.");
    return company;
  });
export const saveSatisfactionSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => satisfactionSettingsSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("salvar_configuracao_pesquisa", { _company_id: data.companyId, _url: data.url, _points: data.points });
    return error ? { ok: false, message: error.message } : { ok: true, message: "Configurações salvas!" };
  });
export const submitSatisfaction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => satisfactionResponseSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: balance, error } = await context.supabase.rpc("responder_pesquisa", { _company_id: data.companyId, _rating: data.rating });
    return error ? { ok: false, message: error.message, balance: null } : { ok: true, message: "Obrigada pela sua opinião! Pontos adicionados.", balance };
  });
