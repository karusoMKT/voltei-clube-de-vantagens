import { createFileRoute } from "@tanstack/react-router";
import { PhotoReviews } from "@/components/PhotoReviews";
import { PlanLock } from "@/components/PlanLock";
import { RedemptionsPanel } from "@/components/RedemptionsPanel";

export const Route = createFileRoute("/empresa/aprovar")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Aprovar · Voltei" },
      { name: "description", content: "Aprove as fotos dos clientes e entregue os prêmios resgatados." },
      { property: "og:title", content: "Aprovar · Voltei" },
      { property: "og:description", content: "Aprove as fotos dos clientes e entregue os prêmios resgatados." },
    ],
  }),
  component: Aprovar,
});

function Aprovar() {
  const { companyId, plan } = Route.useRouteContext();

  return (
    <div className="space-y-5 px-5 pt-6">
      <div>
        <h1 className="text-3xl font-extrabold text-foreground">Aprovar</h1>
        <p className="mt-1 text-muted-foreground">Fotos e prêmios esperando você.</p>
      </div>
      {plan === "premium" ? <PhotoReviews companyId={companyId} /> : <PlanLock title="Pontos por Stories do Instagram" plan="Premium" />}
      <RedemptionsPanel companyId={companyId} />
    </div>
  );
}
