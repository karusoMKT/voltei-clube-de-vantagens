import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { companySchema, ownerSchema } from "./plans";
import { phoneToEmail } from "./cadastro";

type Ctx = { supabase: { rpc: (fn: "is_admin") => PromiseLike<{ data: boolean | null }> } };
async function assertAdmin(context: Ctx) {
  const { data } = await context.supabase.rpc("is_admin");
  if (!data) throw new Error("Somente o admin pode fazer isso.");
}

export const listCompanies = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase.from("companies").select("id,name,slug,plan,active,monthly_fee").order("created_at", { ascending: false });
    if (error) throw new Error("Não conseguimos carregar as empresas.");
    const { data: owners } = await context.supabase.from("user_roles").select("company_id").eq("role", "dono");
    const withOwner = new Set((owners ?? []).map((o) => o.company_id));
    return data.map((c) => ({ ...c, monthly_fee: Number(c.monthly_fee), hasOwner: withOwner.has(c.id) }));
  });

export const createCompany = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => companySchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: id, error } = await context.supabase.rpc("admin_criar_empresa" as never, { _name: data.name, _slug: data.slug, _plan: data.plan, _monthly_fee: data.monthlyFee } as never);
    return error ? { ok: false as const, message: error.message, id: null } : { ok: true as const, message: "Empresa criada!", id: id as unknown as string };
  });

export const createOwner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ownerSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: company } = await supabaseAdmin.from("companies").select("id").eq("id", data.companyId).maybeSingle();
    if (!company) return { ok: false, message: "Empresa não encontrada." };
    const { data: existing } = await supabaseAdmin.from("profiles").select("id").eq("phone", data.phone).maybeSingle();
    if (existing) return { ok: false, message: "Esse WhatsApp já tem conta no Voltei." };
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: phoneToEmail(data.phone), password: data.pin, email_confirm: true, user_metadata: { full_name: data.fullName },
    });
    if (error || !created.user) return { ok: false, message: "Não conseguimos criar o acesso agora." };
    const id = created.user.id;
    const { error: e1 } = await supabaseAdmin.from("profiles").update({ full_name: data.fullName, phone: data.phone }).eq("id", id);
    const { error: e2 } = await supabaseAdmin.from("user_roles").upsert({ user_id: id, role: "dono", company_id: data.companyId }, { onConflict: "user_id" });
    if (e1 || e2) {
      await supabaseAdmin.auth.admin.deleteUser(id);
      return { ok: false, message: "Não conseguimos criar o acesso agora." };
    }
    return { ok: true, message: "Acesso do dono criado!" };
  });
