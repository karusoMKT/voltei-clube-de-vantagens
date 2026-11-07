import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Users, ShoppingBag, Sparkles, Gift, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Empty, Loading } from "@/components/Empty";
import { getCompanySummary } from "@/lib/company-panels.functions";
import { whatsappReturn } from "@/lib/company-panels";

export const Route = createFileRoute("/empresa/resumo")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Resumo · Voltei" },
      { name: "description", content: "Acompanhe o clube da loja neste mês e reencontre clientes no WhatsApp." },
      { property: "og:title", content: "Resumo · Voltei" },
      { property: "og:description", content: "Acompanhe o clube da loja neste mês e reencontre clientes no WhatsApp." },
    ],
  }),
  component: Resumo,
});

function Resumo() {
  const { companyId } = Route.useRouteContext();
  const fetchSummary = useServerFn(getCompanySummary);
  const { data, isPending, error } = useQuery({ queryKey: ["empresa", "resumo", companyId], queryFn: () => fetchSummary({ data: { companyId } }), refetchInterval: 60000 });
  if (isPending) return <Loading />;
  if (error || !data) return <div role="alert" className="px-5 pt-6">{error?.message ?? "Não conseguimos carregar o resumo."}</div>;
  const month = new Date(`${data.month}-15T12:00:00-03:00`).toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "America/Sao_Paulo" });
  const metrics = [
    { label: "Clientes no clube", value: data.customers, icon: Users },
    { label: "Compras com pontos", value: data.purchases, icon: ShoppingBag },
    { label: "Pontos dados", value: data.points, icon: Sparkles },
    { label: "Prêmios resgatados", value: data.redemptions, icon: Gift },
  ];
  return <div className="space-y-6 px-5 pt-6">
    <div><h1 className="text-3xl font-extrabold">Resumo do mês</h1><p className="mt-1 capitalize text-muted-foreground">{month}</p></div>
    <div className="grid grid-cols-2 gap-3">{metrics.map(({ label, value, icon: Icon }) => <div key={label} className="min-h-36 rounded-3xl border border-border bg-card p-4"><Icon className="mb-2 h-5 w-5 text-primary" /><p className="break-all text-3xl font-extrabold text-primary">{value.toLocaleString("pt-BR")}</p><p className="mt-1 text-sm font-bold">{label}</p></div>)}</div>
    <section className="space-y-3"><h2 className="text-xl font-extrabold">{data.inactive.length} {data.inactive.length === 1 ? "cliente sumiu" : "clientes sumiram"}</h2>
      <p className="text-sm text-muted-foreground">Sem comprar há mais de 30 dias.</p>
      {!data.inactive.length ? <Empty>Nenhum cliente sumido por aqui.</Empty> : <ul className="space-y-3">{data.inactive.map((customer) => {
        const name = customer.name ?? "Cliente";
        const link = whatsappReturn(name, data.companyName, customer.balance, customer.phone);
        return <li key={customer.id} className="rounded-3xl border border-border bg-card p-4"><h3 className="break-words font-extrabold">{name}</h3><p className="mt-1 text-sm text-muted-foreground">{customer.lastPurchase ? `Última compra: ${new Date(customer.lastPurchase).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}` : "Ainda não comprou"}</p><p className="mt-1 text-sm font-bold text-primary">{customer.balance.toLocaleString("pt-BR")} pontos esperando</p>
          {link ? <Button asChild variant="secondary" size="xl" className="mt-3 rounded-2xl"><a href={link} target="_blank" rel="noopener noreferrer"><MessageCircle />Chamar no WhatsApp</a></Button> : <Button variant="secondary" size="xl" className="mt-3 rounded-2xl" disabled><MessageCircle />WhatsApp não informado</Button>}
        </li>;
      })}</ul>}
    </section>
  </div>;
}
