import { createFileRoute } from "@tanstack/react-router";
import { PageTitle } from "@/components/AppShell";

export const Route = createFileRoute("/cliente/premios")({
  head: () => ({
    meta: [
      { title: "Prêmios · Voltei" },
      { name: "description", content: "Prêmios no Voltei." },
      { property: "og:title", content: "Prêmios · Voltei" },
      { property: "og:description", content: "Prêmios no Voltei." },
    ],
  }),
  component: Premios,
});

function Premios() {
  return <PageTitle title="Prêmios" />;
}
