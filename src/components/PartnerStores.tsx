import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MapPin, ArrowRight, Plus } from "lucide-react";
import { discoverStores, joinStore } from "@/lib/multi-store.functions";
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
  return <section className="space-y-3"><h2 className="text-lg font-extrabold">Lojas com Clube Voltei</h2>
    {stores.isPending ? <p className="text-muted-foreground">Carregando lojas…</p> : stores.error ? <div role="alert"><p>Não conseguimos carregar as lojas.</p><Button variant="outline" onClick={() => stores.refetch()}>Tentar novamente</Button></div> : !stores.data?.length ? <p className="text-muted-foreground">Nenhuma loja disponível por enquanto.</p> :
    <ul className="space-y-3">{stores.data.map((s) => {
      const joined = wallet.data?.memberships.some((m) => m.companyId === s.id);
      return <li key={s.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4">
        <CompanyLogo name={s.name} url={s.logo_url} large /><div className="min-w-0 flex-1"><h3 className="break-words font-extrabold">{s.name}</h3>{s.city && <p className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-4 w-4 shrink-0" />{s.city}</p>}</div>
        <Button variant={joined ? "secondary" : "default"} size="xl" className="w-full rounded-2xl" disabled={mutation.isPending} onClick={() => joined ? (wallet.select(s.id), window.scrollTo({ top: 0, behavior: "smooth" })) : mutation.mutate(s.id)}>
          {joined ? <ArrowRight /> : <Plus />}{joined ? "Ver Clube" : mutation.isPending && mutation.variables === s.id ? "Participando…" : "Participar"}
        </Button>
      </li>;
    })}</ul>}
  </section>;
}
