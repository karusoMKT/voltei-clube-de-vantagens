import { PartnerStores } from "@/components/PartnerStores";
import { useCustomerWallet } from "@/components/CustomerWallet";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ImagePlus } from "lucide-react";
import { SatisfactionCard } from "@/components/SatisfactionCard";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Empty, Loading } from "@/components/Empty";
import { firstName, historicoQuery, photosQuery, proximoPremio, tipoLabel } from "@/lib/cliente-data";

export const Route = createFileRoute("/cliente/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Início · Voltei" },
      { name: "description", content: "Seus pontos e prêmios no Voltei." },
      { property: "og:title", content: "Início · Voltei" },
      { property: "og:description", content: "Seus pontos e prêmios no Voltei." },
    ],
  }),
  component: Inicio,
});

const fmtData = (d: string) => new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

function Inicio() {
  const { data, isPending, companyId } = useCustomerWallet();
  const { data: historico } = useQuery(historicoQuery(companyId));
  const { data: photos } = useQuery(photosQuery(companyId));
  if (isPending || !data) return <Loading />;
  const m = data.membership;
  const balance = m?.balance ?? 0;
  const prox = proximoPremio(balance, data.rewards);
  const pct = prox ? Math.min(100, Math.round((balance / prox.cost_points) * 100)) : 100;

  return (
    <div className="space-y-6 px-5 pt-6">
      <h1 className="text-2xl font-extrabold leading-tight text-foreground">
        Oi, {firstName(data.profile.full_name)}! <span className="block font-semibold text-muted-foreground">Que bom te ver de novo.</span>
      </h1>

      {m ? (
        <section className="rounded-3xl bg-primary p-6 text-primary-foreground shadow-lg shadow-primary/25">
          <p className="text-sm font-bold opacity-80">{m.companyName}</p>
          <p className="mt-1 text-5xl font-extrabold">{balance}<span className="ml-2 text-lg font-bold opacity-80">pontos</span></p>
          <div className="mt-5 h-3 overflow-hidden rounded-full bg-primary-foreground/20">
            <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-2 text-sm font-semibold">
            {prox ? `Faltam ${prox.cost_points - balance} pontos para ${prox.name}` : "Você já pode resgatar um prêmio!"}
          </p>
        </section>
      ) : (
        <Empty>Você ainda não está no clube de nenhuma loja. Peça o link no balcão.</Empty>
      )}

      <PartnerStores />

      {m?.photoEnabled && <Button asChild variant="hero" size="xl"><Link to="/cliente/foto"><ImagePlus />Enviar foto (+{m.photoPoints} pontos)</Link></Button>}
      {m?.surveyEnabled && <SatisfactionCard key={m.companyId} companyId={m.companyId} userId={data.profile.id} points={m.surveyPoints} url={m.googleUrl} />}

      <section>
        <h2 className="mb-3 text-lg font-extrabold text-foreground">Histórico recente</h2>
        {photos?.filter((p) => p.status === "pendente").map((p) => <p key={p.id} className="mb-3 rounded-2xl bg-secondary px-4 py-3 text-sm font-bold">Foto enviada, aguardando aprovação.<span className="mt-1 block font-normal text-muted-foreground">{fmtData(p.created_at)}</span></p>)}
        {historico && historico.length > 0 ? (
          <ul className="divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card">
            {historico.map((t) => (
              <li key={t.id} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="font-bold text-foreground">{tipoLabel[t.type] ?? t.type}</p>
                  <p className="text-sm text-muted-foreground">{fmtData(t.created_at)}</p>
                </div>
                <span className={`text-lg font-extrabold ${t.points >= 0 ? "text-primary" : "text-muted-foreground"}`}>
                  {t.points > 0 ? `+${t.points}` : t.points}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>Suas compras e resgates aparecem aqui.</Empty>
        )}
      </section>
    </div>
  );
}
