import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getMyInvite = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ companyId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: code, error } = await context.supabase.rpc("meu_codigo_indicacao", { _company_id: data.companyId });
    if (error) throw new Error(error.message);
    const [{ data: company }, { data: refs }] = await Promise.all([
      context.supabase.from("companies").select("slug,referral_points").eq("id", data.companyId).maybeSingle(),
      context.supabase.from("referrals").select("status,points_awarded").eq("company_id", data.companyId).eq("referrer_id", context.userId),
    ]);
    return { code: code as string, slug: company?.slug ?? "", points: company?.referral_points ?? 0,
      pending: (refs ?? []).filter((r) => r.status === "pendente").length,
      done: (refs ?? []).filter((r) => r.status === "concluida").length };
  });

export const acceptInvite = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ code: z.string().regex(/^[A-Z0-9]{8}$/) }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: companyId, error } = await context.supabase.rpc("aceitar_indicacao", { _code: data.code });
    if (error) return { ok: false as const, message: error.message };
    return { ok: true as const, companyId: companyId as string };
  });

/** Cidades para o cadastro (lojas ativas). Dado público, só nomes de cidade. */
export const listCities = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("companies").select("city").eq("active", true);
  return (data ?? []).map((c) => c.city).filter((c): c is string => !!c);
});
