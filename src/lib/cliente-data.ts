import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Reward = { id: string; name: string; cost_points: number };

async function uid() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Entre na sua conta para continuar.");
  return data.user.id;
}

/** Perfil + primeira empresa do cliente com saldo e prêmios. */
export const clienteQuery = queryOptions({
  queryKey: ["cliente"],
  queryFn: async () => {
    const id = await uid();
    const { data: profile, error } = await supabase
      .from("profiles").select("id, full_name, qr_token").eq("id", id).single();
    if (error) throw error;
    const { data: m } = await supabase
      .from("memberships").select("company_id, points_balance, companies(name)")
      .eq("customer_id", id).order("created_at").limit(1).maybeSingle();
    let rewards: Reward[] = [];
    if (m) {
      const { data } = await supabase.from("rewards").select("id, name, cost_points")
        .eq("company_id", m.company_id).eq("active", true).order("cost_points");
      rewards = data ?? [];
    }
    return {
      profile,
      membership: m ? { companyId: m.company_id, balance: m.points_balance, companyName: m.companies?.name ?? "" } : null,
      rewards,
    };
  },
});

export const historicoQuery = queryOptions({
  queryKey: ["cliente", "historico"],
  queryFn: async () => {
    const id = await uid();
    const { data, error } = await supabase.from("transactions")
      .select("id, type, points, created_at").eq("customer_id", id)
      .order("created_at", { ascending: false }).limit(15);
    if (error) throw error;
    return data;
  },
});

export const resgatesQuery = queryOptions({
  queryKey: ["cliente", "resgates"],
  queryFn: async () => {
    const id = await uid();
    const { data, error } = await supabase.from("redemptions")
      .select("id, code, created_at, rewards(name)").eq("customer_id", id).eq("status", "pendente")
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
  compra: "Compra", resgate: "Resgate", foto: "Foto", google: "Avaliação no Google",
  indicacao: "Indicação", ajuste: "Ajuste da loja",
};
