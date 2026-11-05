import { createFileRoute } from "@tanstack/react-router";
import { PageTitle } from "@/components/AppShell";

export const Route = createFileRoute("/empresa/premios")({
  head: () => ({
    meta: [
      { title: "Prêmios · Voltei" },
      { name: "description", content: "Prêmios no Voltei." },
      { property: "og:title", content: "Prêmios · Voltei" },
      { property: "og:description", content: "Prêmios no Voltei." },
    ],
  }),
  component: EmpresaPremios,
});

function EmpresaPremios() {
  return <PageTitle title="Prêmios" />;
}
