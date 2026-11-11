import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { staffSchema } from "./plans";
import { phoneToEmail } from "./cadastro";

type Sb = { from: (t: "user_roles") => any };
/** Só o dono da loja gerencia a equipe; a loja vem do cargo protegido dele. */
async function ownerCompany(supabase: Sb, userId: string): Promise<string> {
  const { data } = await supabase.from("user_roles").select("role, company_id").eq("user_id", userId).maybeSingle();
  if (!data || data.role !== "dono" || !data.company_id) throw new Error("Somente o dono da loja pode fazer isso.");
  return data.company_id;
}

export const listStaff = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const companyId = await ownerCompany(context.supabase, context.userId);
    const { data: roles, error } = await context.supabase.from("user_roles").select("user_id, created_at")
      .eq("company_id", companyId).eq("role", "funcionario").order("created_at");
    if (error) throw new Error("Não conseguimos carregar a equipe.");
    const ids = roles.map((r) => r.user_id);
    const { data: profiles } = ids.length
      ? await context.supabase.from("profiles").select("id, full_name, phone").in("id", ids)
      : { data: [] as { id: string; full_name: string | null; phone: string | null }[] };
    const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
    return roles.map((r) => ({ id: r.user_id, name: byId.get(r.user_id)?.full_name ?? "", phone: byId.get(r.user_id)?.phone ?? "" }));
  });

export const createStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => staffSchema.parse(input))
  .handler(async ({ data, context }) => {
    const companyId = await ownerCompany(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing } = await supabaseAdmin.from("profiles").select("id").eq("phone", data.phone).maybeSingle();
    if (existing) return { ok: false, message: "Esse WhatsApp já tem conta no Voltei." };
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: phoneToEmail(data.phone), password: data.pin, email_confirm: true, user_metadata: { full_name: data.fullName },
    });
    if (error || !created.user) return { ok: false, message: "Não conseguimos criar o acesso agora." };
    const id = created.user.id;
    const { error: e1 } = await supabaseAdmin.from("profiles").update({ full_name: data.fullName, phone: data.phone }).eq("id", id);
    const { error: e2 } = await supabaseAdmin.from("user_roles").upsert({ user_id: id, role: "funcionario", company_id: companyId }, { onConflict: "user_id" });
    if (e1 || e2) {
      await supabaseAdmin.auth.admin.deleteUser(id);
      return { ok: false, message: "Não conseguimos criar o acesso agora." };
    }
    return { ok: true, message: "Atendente criado!" };
  });
