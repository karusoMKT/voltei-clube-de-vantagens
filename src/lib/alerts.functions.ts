import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { alertSettingsSchema } from "./alerts";

const companyInput = z.object({ companyId: z.string().uuid() });

async function assertOwner(supabase: { rpc: (fn: "is_owner_of", a: { _company: string }) => PromiseLike<{ data: boolean | null }> }, companyId: string) {
  const { data } = await supabase.rpc("is_owner_of", { _company: companyId });
  if (!data) throw new Error("Você não tem acesso a esta loja.");
}

export const getAlertSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => companyInput.parse(i))
  .handler(async ({ data, context }) => {
    await assertOwner(context.supabase, data.companyId);
    const { data: c, error } = await context.supabase.from("companies").select("plan,active,whatsapp_alerts_enabled,owner_alert_whatsapp,absent_days_threshold").eq("id", data.companyId).single();
    if (error) throw new Error("Não conseguimos carregar os alertas.");
    const { data: logs } = await context.supabase.from("whatsapp_alert_logs").select("id,alert_type,status,error,created_at").eq("company_id", data.companyId).order("created_at", { ascending: false }).limit(10);
    return { ...c, logs: logs ?? [] };
  });

export const saveAlertSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => alertSettingsSchema.parse(i))
  .handler(async ({ data, context }) => {
    await assertOwner(context.supabase, data.companyId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: c } = await supabaseAdmin.from("companies").select("plan").eq("id", data.companyId).single();
    if (c?.plan !== "premium") return { ok: false, message: "Alertas no WhatsApp são exclusivos do Plano Premium." };
    const { error } = await supabaseAdmin.from("companies").update({ whatsapp_alerts_enabled: data.enabled, owner_alert_whatsapp: data.phone || null, absent_days_threshold: data.days }).eq("id", data.companyId);
    return error ? { ok: false, message: error.message } : { ok: true, message: "Alertas salvos!" };
  });

export const sendTestAlert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => companyInput.parse(i))
  .handler(async ({ data, context }) => {
    await assertOwner(context.supabase, data.companyId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { deliver } = await import("./alerts.server");
    const { data: c } = await supabaseAdmin.from("companies").select("id,name,plan,owner_alert_whatsapp,absent_days_threshold").eq("id", data.companyId).single();
    if (!c || c.plan !== "premium") return { ok: false, message: "Alertas no WhatsApp são exclusivos do Plano Premium." };
    const r = await deliver(c, "test", null, { message: `Teste do Voltei: os alertas da ${c.name} estão funcionando.` });
    const msg = { enviado: "Alerta de teste enviado!", sem_webhook: "Teste registrado. A integração com o WhatsApp ainda não foi configurada.", falhou: "A integração recusou o teste. Veja o histórico.", duplicado: "" }[r.status];
    return { ok: r.status !== "falhou", message: msg };
  });

/** Chamado depois de entregar um resgate; o servidor confere tudo de novo. */
export const notifyRedemption = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ redemptionId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: r } = await supabaseAdmin.from("redemptions").select("id,company_id,customer_id,status,reward_id,rewards(name,cost_points),profiles(full_name)").eq("id", data.redemptionId).maybeSingle();
    if (!r || r.status !== "entregue") return { ok: false };
    const { data: staff } = await context.supabase.rpc("is_staff_of", { _company: r.company_id });
    if (!staff) return { ok: false };
    const { data: c } = await supabaseAdmin.from("companies").select("id,name,plan,active,whatsapp_alerts_enabled,owner_alert_whatsapp,absent_days_threshold").eq("id", r.company_id).single();
    if (!c || c.plan !== "premium" || !c.active || !c.whatsapp_alerts_enabled) return { ok: true };
    const { data: op } = await supabaseAdmin.from("profiles").select("full_name").eq("id", context.userId).maybeSingle();
    const { deliver } = await import("./alerts.server");
    await deliver(c, "redemption", `redemption:${r.id}`, {
      customer_name: r.profiles?.full_name ?? null, reward_name: r.rewards?.name ?? null, points_used: r.rewards?.cost_points ?? null,
      validated_by: op?.full_name ?? null, validated_at: new Date().toISOString(),
    });
    return { ok: true };
  });
