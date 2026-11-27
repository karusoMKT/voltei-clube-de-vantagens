import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Opt-in: roda só com VOLTEI_REFERRAL_LIVE=1 e as chaves do projeto no ambiente. Cria e apaga dados temporários.
const url = process.env["SUPABASE_URL"] ?? process.env["VITE_SUPABASE_URL"];
const anon = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
const service = process.env["SUPABASE_SERVICE_ROLE_KEY"];
const live = process.env["VOLTEI_REFERRAL_LIVE"] === "1" && !!(url && anon && service);

describe.skipIf(!live)("indicação paga na primeira compra no caixa", () => {
  const admin = live ? createClient(url!, service!, { auth: { persistSession: false } }) : (null as unknown as SupabaseClient);
  const tag = Date.now().toString().slice(-7);
  const pin = "246813";
  const ids: string[] = [];
  let companyId = "";
  let cashier: SupabaseClient, referrer: SupabaseClient, invitee: SupabaseClient;
  let referrerId = "", inviteeId = "", code = "";

  async function user(suffix: string, role: "cliente" | "funcionario") {
    const phone = `7390${tag}${suffix}`;
    const { data, error } = await admin.auth.admin.createUser({ email: `${phone}@voltei.app`, password: pin, email_confirm: true });
    if (error) throw error;
    ids.push(data.user.id);
    if (role === "funcionario") await admin.from("user_roles").upsert({ user_id: data.user.id, role, company_id: companyId }, { onConflict: "user_id" });
    const c = createClient(url!, anon!, { auth: { persistSession: false } });
    const s = await c.auth.signInWithPassword({ email: `${phone}@voltei.app`, password: pin });
    if (s.error) throw s.error;
    return { c, id: data.user.id };
  }
  const balance = async (id: string) => (await admin.from("memberships").select("points_balance").eq("company_id", companyId).eq("customer_id", id).single()).data!.points_balance;
  const buy = (id: string) => cashier.rpc("lancar_compra", { _company_id: companyId, _customer_id: id, _valor_em_reais: 10 });

  beforeAll(async () => {
    const { data, error } = await admin.from("companies").insert({ name: `Teste indicação ${tag}`, slug: `teste-ind-${tag}`, referral_points: 50 } as never).select("id").single();
    if (error) throw error;
    companyId = (data as { id: string }).id;
    ({ c: cashier } = await user("1", "funcionario"));
    ({ c: referrer, id: referrerId } = await user("2", "cliente"));
    ({ c: invitee, id: inviteeId } = await user("3", "cliente"));
    await referrer.rpc("participar_clube", { _company_id: companyId });
    code = (await referrer.rpc("meu_codigo_indicacao", { _company_id: companyId })).data as string;
  }, 30000);

  afterAll(async () => {
    if (!companyId) return;
    for (const t of ["transactions", "referrals", "referral_codes", "memberships", "user_roles"] as const) await admin.from(t as never).delete().eq("company_id", companyId);
    await admin.from("companies").delete().eq("id", companyId);
    for (const id of ids) await admin.auth.admin.deleteUser(id);
  }, 30000);

  it("bloqueia autoindicação", async () => {
    const { error } = await referrer.rpc("aceitar_indicacao", { _code: code });
    expect(error?.message).toMatch(/próprio convite/);
  });

  it("primeira compra do convidado credita o indicador uma vez, com origem no histórico", async () => {
    expect((await invitee.rpc("aceitar_indicacao", { _code: code })).error).toBeNull();
    const before = await balance(referrerId);
    expect((await buy(inviteeId)).error).toBeNull();
    expect(await balance(referrerId)).toBe(before + 50);
    const { data: hist } = await referrer.from("transactions").select("type,points").eq("company_id", companyId).eq("customer_id", referrerId);
    expect(hist).toEqual([{ type: "indicacao", points: 50 }]);
    const { data: ref } = await admin.from("referrals").select("status,points_awarded").eq("company_id", companyId).single();
    expect(ref).toEqual({ status: "concluida", points_awarded: 50 });
  }, 20000);

  it("segunda compra não paga de novo e o convite não pode ser reaplicado", async () => {
    const before = await balance(referrerId);
    // Libera a trava de 2 minutos movendo a compra anterior para trás.
    await admin.from("transactions").update({ created_at: new Date(Date.now() - 600000).toISOString() }).eq("company_id", companyId).eq("customer_id", inviteeId);
    expect((await buy(inviteeId)).error).toBeNull();
    expect(await balance(referrerId)).toBe(before);
    expect((await invitee.rpc("aceitar_indicacao", { _code: code })).error?.message).toMatch(/ainda não comprou/);
  }, 20000);
});
