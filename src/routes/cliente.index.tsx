import { createFileRoute } from "@tanstack/react-router";
import { PageTitle } from "@/components/AppShell";

export const Route = createFileRoute("/cliente/")({
  head: () => ({
    meta: [
      { title: "Início · Voltei" },
      { name: "description", content: "Início no Voltei." },
      { property: "og:title", content: "Início · Voltei" },
      { property: "og:description", content: "Início no Voltei." },
    ],
  }),
  component: Inicio,
});

function Inicio() {
  return <PageTitle title="Início" />;
}
