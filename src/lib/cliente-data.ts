import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Reward = { id: string; name: string; cost_points: number };

async function uid() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Entre na sua conta para continuar.");
  return data.user.id;
}

/** Todas as carteiras; cada saldo e prêmio permanece associado à empresa. */
export const clienteQuery = queryOptions({
  queryKey: ["cliente", "carteiras"],
  queryFn: async () => {
    const id = await uid();
    const { data: profile, error } = await supabase.from("profiles").select("id, full_name, qr_token, instagram").eq("id", id).single();
    if (error) throw error;
    const { data: rows, error: membershipError } = await supabase.from("memberships")
      .select("company_id, points_balance, companies(name, logo_url, city, points_photo, plan, active, google_review_url, google_review_points)")
      .eq("customer_id", id).order("created_at");
    if (membershipError) throw membershipError;
    const memberships = (rows ?? []).filter((m) => m.companies?.active).map((m) => ({
      companyId: m.company_id, balance: m.points_balance, companyName: m.companies?.name ?? "",
      logoUrl: m.companies?.logo_url ?? null, city: m.companies?.city ?? null,
      photoPoints: m.companies?.points_photo ?? 30, photoEnabled: m.companies?.plan === "premium",
      surveyEnabled: m.companies?.plan === "premium", surveyPoints: m.companies?.google_review_points ?? 30,
      googleUrl: m.companies?.google_review_url ?? null,
    }));
    const ids = memberships.map((m) => m.companyId);
    const { data: rewards, error: rewardError } = ids.length ? await supabase.from("rewards")
      .select("id, company_id, name, cost_points").in("company_id", ids).eq("active", true).order("cost_points") : { data: [], error: null };
    if (rewardError) throw rewardError;
    return { profile, memberships, rewards: rewards ?? [] };
  },
});

export const historicoQuery = (companyId: string | null) => queryOptions({
  queryKey: ["cliente", "historico", companyId],
  enabled: !!companyId,
  queryFn: async () => {
    const id = await uid();
    const { data, error } = await supabase.from("transactions")
      .select("id, company_id, type, points, created_at").eq("customer_id", id).eq("company_id", companyId ?? "")
      .order("created_at", { ascending: false }).limit(15);
    if (error) throw error;
    return data;
  },
});

export const photosQuery = (companyId: string | null) => queryOptions({
  queryKey: ["cliente", "fotos", companyId],
  enabled: !!companyId,
  queryFn: async () => {
    const id = await uid();
    const { data, error } = await supabase.from("photo_submissions")
      .select("id, company_id, status, created_at").eq("customer_id", id).eq("company_id", companyId ?? "")
      .order("created_at", { ascending: false }).limit(30);
    if (error) throw error;
    return data;
  },
});

export const resgatesQuery = (companyId: string | null) => queryOptions({
  queryKey: ["cliente", "resgates", companyId],
  enabled: !!companyId,
  queryFn: async () => {
    const id = await uid();
    const { data, error } = await supabase.from("redemptions")
      .select("id, code, created_at, rewards(name)").eq("customer_id", id).eq("status", "pendente").eq("company_id", companyId ?? "")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
});

/** Próximo prêmio ainda não alcançado (o mais barato acima do saldo). */
export function proximoPremio(balance: number, rewards: Reward[]) {
  return rewards.filter((r) => r.cost_points > balance).sort((a, b) => a.cost_points - b.cost_points)[0] ?? null;
}

export const firstName = (n?: string | null) => (n ?? "").trim().split(/\s+/)[0] || "";
export const shortCode = (token: string) => token.slice(0, 6).toUpperCase();

export const tipoLabel: Record<string, string> = {
  compra: "Compra", resgate: "Resgate", foto: "Foto", google: "Avaliação no Google", pesquisa: "Pesquisa de satisfação",
  indicacao: "Indicação", ajuste: "Ajuste da loja",
};
