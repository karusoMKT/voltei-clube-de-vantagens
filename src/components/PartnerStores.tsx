import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Gift, MapPin, Plus } from "lucide-react";
import { discoverStores, joinStore } from "@/lib/multi-store.functions";
import { discoverableStores, mapsLink } from "@/lib/multi-store";
import { useCustomerWallet } from "./CustomerWallet";
import { CompanyLogo } from "./CompanyLogo";
import { Button } from "./ui/button";
import { storesInCity } from "@/lib/cities";
import { CityPreference } from "./CityPreference";

export function PartnerStores() {
  const getStores = useServerFn(discoverStores);
  const join = useServerFn(joinStore);
  const qc = useQueryClient();
  const wallet = useCustomerWallet();
  const stores = useQuery({ queryKey: ["cliente", "parceiras"], queryFn: () => getStores() });
  const mutation = useMutation({ mutationFn: (companyId: string) => join({ data: { companyId } }),
    onSuccess: async (_, companyId) => { await qc.invalidateQueries({ queryKey: ["cliente"] }); wallet.select(companyId); toast.success("Você entrou no clube!"); },
    onError: (e) => toast.error(e.message) });

  if (stores.isPending) return <section className="space-y-3"><h2 className="text-lg font-extrabold">Lojas com Clube Voltei</h2><p className="text-muted-foreground">Carregando lojas…</p></section>;
  if (stores.error) return <section className="space-y-3"><h2 className="text-lg font-extrabold">Lojas com Clube Voltei</h2><div role="alert"><p>Não conseguimos carregar as lojas.</p><Button variant="outline" onClick={() => stores.refetch()}>Tentar novamente</Button></div></section>;

  const city = wallet.data?.profile.city ?? null;
  const userId = wallet.data?.profile.id;
  const notJoined = discoverableStores(stores.data ?? [], wallet.data?.memberships ?? []);
  const available = storesInCity(notJoined, city);
  if (city && !available.length && notJoined.length) {
    return <section className="space-y-3"><h2 className="text-lg font-extrabold">Lojas com Clube Voltei</h2>
      <p className="text-muted-foreground">Ainda não temos lojas novas em {city}. Quer ver outra cidade?</p>
      {userId && <CityPreference key={city} compact userId={userId} city={city} />}</section>;
  }
  if (!available.length) {
    return stores.data?.length
      ? <p className="text-sm text-muted-foreground">Você já participa de todos os clubes da região.</p>
      : <section className="space-y-3"><h2 className="text-lg font-extrabold">Lojas com Clube Voltei</h2><p className="text-muted-foreground">Nenhuma loja disponível por enquanto.</p></section>;
  }

  return <section className="space-y-3"><h2 className="text-lg font-extrabold">Lojas com Clube Voltei{city ? ` em ${city}` : ""}</h2>
    <ul className="space-y-3">{available.map((s) => (
      <li key={s.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4">
        <CompanyLogo name={s.name} url={s.logo_url} large /><div className="min-w-0 flex-1"><h3 className="break-words font-extrabold">{s.name}</h3>
          {(() => { const label = [s.address, [s.city, s.state].filter(Boolean).join("/")].filter(Boolean).join(" · "); const href = mapsLink(s.address, s.city); return label && href ? <a href={href} target="_blank" rel="noreferrer" className="mt-1 inline-flex min-h-8 items-center gap-1 text-sm font-bold text-primary underline-offset-2 hover:underline"><MapPin className="h-4 w-4 shrink-0" />{label}</a> : null; })()}</div>
        {Array.isArray(s.rewards) && s.rewards.length > 0 && <ul className="w-full space-y-1 rounded-2xl bg-cream p-3">{(s.rewards as { name: string; cost_points: number }[]).map((r) => (
          <li key={r.name} className="flex items-center justify-between gap-2 text-sm"><span className="flex min-w-0 items-center gap-2 font-bold"><Gift className="h-4 w-4 shrink-0 text-primary" /><span className="break-words">{r.name}</span></span><span className="shrink-0 font-extrabold text-primary">{r.cost_points} pts</span></li>))}</ul>}
        <Button size="xl" className="w-full rounded-2xl" disabled={mutation.isPending} onClick={() => mutation.mutate(s.id)}>
          <Plus />{mutation.isPending && mutation.variables === s.id ? "Participando…" : "Participar"}
        </Button>
      </li>
    ))}</ul>
  </section>;
}
