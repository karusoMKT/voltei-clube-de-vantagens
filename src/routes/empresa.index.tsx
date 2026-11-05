import { createFileRoute } from "@tanstack/react-router";
import { PageTitle } from "@/components/AppShell";

export const Route = createFileRoute("/empresa/")({
  head: () => ({
    meta: [
      { title: "Caixa · Voltei" },
      { name: "description", content: "Caixa no Voltei." },
      { property: "og:title", content: "Caixa · Voltei" },
      { property: "og:description", content: "Caixa no Voltei." },
    ],
  }),
  component: Caixa,
});

function Caixa() {
  return <PageTitle title="Caixa" />;
}
