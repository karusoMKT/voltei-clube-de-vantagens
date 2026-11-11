import { createFileRoute } from "@tanstack/react-router";
import { CaixaPanel } from "@/components/CaixaPanel";

export const Route = createFileRoute("/caixa/")({
  head: () => ({
    meta: [
      { title: "Caixa · Voltei" },
      { name: "description", content: "Leia o QR ou o WhatsApp do cliente e lance a compra." },
      { property: "og:title", content: "Caixa · Voltei" },
      { property: "og:description", content: "Leia o QR ou o WhatsApp do cliente e lance a compra." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  const { companyId } = Route.useRouteContext();
  return <CaixaPanel companyId={companyId} />;
}
