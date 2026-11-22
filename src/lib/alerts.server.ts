import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { ALERT_RESEND_DAYS, absentMessage, daysBetween, mostFrequent, previousMonthRange, toE164 } from "./alerts";

type AlertType = "redemption" | "absent_clients" | "monthly_summary" | "test";
type Company = { id: string; name: string; owner_alert_whatsapp: string | null; absent_days_threshold: number };

export async function ownerPhone(company: Company) {
  if (company.owner_alert_whatsapp) return toE164(company.owner_alert_whatsapp);
  const { data: role } = await supabaseAdmin.from("user_roles").select("user_id").eq("company_id", company.id).eq("role", "dono").limit(1).maybeSingle();
  if (!role) return null;
  const { data: p } = await supabaseAdmin.from("profiles").select("phone").eq("id", role.user_id).maybeSingle();
  return toE164(p?.phone ?? null);
}

/** Registra sempre no histórico; envia ao webhook só se estiver configurado. Repetição com o mesmo ref não envia de novo. */
export async function deliver(company: Company, type: AlertType, ref: string | null, data: Record<string, unknown>) {
  const payload = { alert_type: type, company_id: company.id, company_name: company.name, owner_alert_whatsapp: await ownerPhone(company), sent_at: new Date().toISOString(), ...data };
  const { data: log, error } = await supabaseAdmin.from("whatsapp_alert_logs").insert({ company_id: company.id, alert_type: type, ref, payload: payload as never }).select("id").single();
  if (error) {
    if (error.code === "23505") return { status: "duplicado" as const };
    throw new Error(`Não conseguimos registrar o alerta: ${error.message}`);
  }
  const url = process.env["WHATSAPP_ALERTS_WEBHOOK_URL"];
  let status: "enviado" | "falhou" | "sem_webhook" = "sem_webhook";
  let errText: string | null = null;
  if (url) {
    try {
      const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), signal: AbortSignal.timeout(8000) });
      status = r.ok ? "enviado" : "falhou";
      if (!r.ok) errText = `HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`;
    } catch (e) { status = "falhou"; errText = e instanceof Error ? e.message : "Erro de rede"; }
  }
  await supabaseAdmin.from("whatsapp_alert_logs").update({ status, error: errText }).eq("id", log.id);
  return { status };
}

const premiumCompanies = async () => {
  const { data, error } = await supabaseAdmin.from("companies").select("id,name,owner_alert_whatsapp,absent_days_threshold")
    .eq("plan", "premium").eq("active", true).eq("whatsapp_alerts_enabled", true);
  if (error) throw new Error(error.message);
  return data ?? [];
};

export async function runAbsentClients(now = new Date()) {
  const results: { company: string; count: number; status: string }[] = [];
  for (const c of await premiumCompanies()) {
    const { data: tx } = await supabaseAdmin.from("transactions").select("customer_id,created_at").eq("company_id", c.id).order("created_at", { ascending: false }).limit(10000);
    const last = new Map<string, string>();
    for (const t of tx ?? []) if (!last.has(t.customer_id)) last.set(t.customer_id, t.created_at);
    const absentIds = [...last].filter(([, at]) => daysBetween(new Date(at), now) >= c.absent_days_threshold).map(([id]) => id);
    if (!absentIds.length) continue;
    const since = new Date(now.getTime() - ALERT_RESEND_DAYS * 86_400_000).toISOString();
    const { data: recent } = await supabaseAdmin.from("whatsapp_alert_logs").select("payload").eq("company_id", c.id).eq("alert_type", "absent_clients").gte("created_at", since);
    const alerted = new Set<string>();
    for (const r of recent ?? []) for (const cl of ((r.payload as { clients?: { id: string }[] })?.clients ?? [])) alerted.add(cl.id);
    const fresh = absentIds.filter((id) => !alerted.has(id)).slice(0, 50);
    if (!fresh.length) continue;
    const [{ data: profiles }, { data: members }] = await Promise.all([
      supabaseAdmin.from("profiles").select("id,full_name,phone").in("id", fresh),
      supabaseAdmin.from("memberships").select("customer_id,points_balance").eq("company_id", c.id).in("customer_id", fresh),
    ]);
    const clients = fresh.map((id) => {
      const p = profiles?.find((x) => x.id === id); const bal = members?.find((m) => m.customer_id === id)?.points_balance ?? 0;
      return { id, name: p?.full_name ?? null, whatsapp: toE164(p?.phone ?? null), days_absent: daysBetween(new Date(last.get(id)!), now), points_balance: bal, suggested_message: absentMessage(p?.full_name ?? null, c.name, bal) };
    });
    const r = await deliver(c, "absent_clients", `absent:${now.toISOString().slice(0, 10)}`, { threshold_days: c.absent_days_threshold, clients });
    results.push({ company: c.name, count: clients.length, status: r.status });
  }
  return results;
}

export async function runMonthlySummary(now = new Date()) {
  const { label, start, end } = previousMonthRange(now);
  const results: { company: string; status: string }[] = [];
  for (const c of await premiumCompanies()) {
    const [{ data: tx }, { data: red }, { data: lastTx }] = await Promise.all([
      supabaseAdmin.from("transactions").select("points").eq("company_id", c.id).gt("points", 0).gte("created_at", start).lt("created_at", end).limit(10000),
      supabaseAdmin.from("redemptions").select("rewards(name)").eq("company_id", c.id).gte("created_at", start).lt("created_at", end).limit(10000),
      supabaseAdmin.from("transactions").select("customer_id,created_at").eq("company_id", c.id).lt("created_at", end).order("created_at", { ascending: false }).limit(10000),
    ]);
    const last = new Map<string, string>();
    for (const t of lastTx ?? []) if (!last.has(t.customer_id)) last.set(t.customer_id, t.created_at);
    const endDate = new Date(end); let active = 0; let absent = 0;
    for (const at of last.values()) daysBetween(new Date(at), endDate) >= c.absent_days_threshold ? absent++ : active++;
    const top = mostFrequent((red ?? []).map((r) => r.rewards?.name).filter((n): n is string => !!n));
    const r = await deliver(c, "monthly_summary", `month:${label}`, {
      month: label, points_issued: (tx ?? []).reduce((s, t) => s + t.points, 0), redemptions: red?.length ?? 0,
      active_clients: active, absent_clients: absent, top_reward: top ? { name: top.name, count: top.count } : null,
    });
    results.push({ company: c.name, status: r.status });
  }
  return results;
}
