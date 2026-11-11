import { createFileRoute } from "@tanstack/react-router";
import { RedemptionsPanel } from "@/components/RedemptionsPanel";

export const Route = createFileRoute("/caixa/resgates")({
  head: () => ({
    meta: [
      { title: "Resgates · Voltei" },
      { name: "description", content: "Entregue os prêmios que os clientes resgataram." },
      { property: "og:title", content: "Resgates · Voltei" },
      { property: "og:description", content: "Entregue os prêmios que os clientes resgataram." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  const { companyId } = Route.useRouteContext();
  return (
    <div className="space-y-5 px-5 pt-6">
      <div>
        <h1 className="text-3xl font-extrabold text-foreground">Resgates</h1>
        <p className="mt-1 text-muted-foreground">Confira o código e entregue o prêmio.</p>
      </div>
      <RedemptionsPanel companyId={companyId} />
    </div>
  );
}
