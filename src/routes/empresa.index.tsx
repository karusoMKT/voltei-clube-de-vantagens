import { createFileRoute } from "@tanstack/react-router";
import { CaixaPanel } from "@/components/CaixaPanel";

export const Route = createFileRoute("/empresa/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Caixa · Voltei" },
      { name: "description", content: "Lance compras e dê pontos aos clientes." },
      { property: "og:title", content: "Caixa · Voltei" },
      { property: "og:description", content: "Lance compras e dê pontos aos clientes." },
    ],
  }),
  component: Caixa,
});

function Caixa() {
  const { companyId } = Route.useRouteContext();
  return <CaixaPanel companyId={companyId} />;
}
