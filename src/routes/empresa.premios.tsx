import { createFileRoute } from "@tanstack/react-router";
import { PageTitle } from "@/components/AppShell";

export const Route = createFileRoute("/empresa/premios")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Prêmios da loja · Voltei" },
      { name: "description", content: "Prêmios no Voltei." },
      { property: "og:title", content: "Prêmios da loja · Voltei" },
      { property: "og:description", content: "Prêmios no Voltei." },
    ],
  }),
  component: EmpresaPremios,
});

function EmpresaPremios() {
  return <PageTitle title="Prêmios" />;
}
