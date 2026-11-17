import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MapPin, Plus } from "lucide-react";
import { discoverStores, joinStore } from "@/lib/multi-store.functions";
import { discoverableStores } from "@/lib/multi-store";
import { useCustomerWallet } from "./CustomerWallet";
import { CompanyLogo } from "./CompanyLogo";
import { Button } from "./ui/button";

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

  const available = discoverableStores(stores.data ?? [], wallet.data?.memberships ?? []);
  if (!available.length) {
    return stores.data?.length
      ? <p className="text-sm text-muted-foreground">Você já participa de todos os clubes da região.</p>
      : <section className="space-y-3"><h2 className="text-lg font-extrabold">Lojas com Clube Voltei</h2><p className="text-muted-foreground">Nenhuma loja disponível por enquanto.</p></section>;
  }

  return <section className="space-y-3"><h2 className="text-lg font-extrabold">Lojas com Clube Voltei</h2>
    <ul className="space-y-3">{available.map((s) => (
      <li key={s.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4">
        <CompanyLogo name={s.name} url={s.logo_url} large /><div className="min-w-0 flex-1"><h3 className="break-words font-extrabold">{s.name}</h3>{s.city && <p className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-4 w-4 shrink-0" />{s.city}</p>}</div>
        <Button size="xl" className="w-full rounded-2xl" disabled={mutation.isPending} onClick={() => mutation.mutate(s.id)}>
          <Plus />{mutation.isPending && mutation.variables === s.id ? "Participando…" : "Participar"}
        </Button>
      </li>
    ))}</ul>
  </section>;
}
