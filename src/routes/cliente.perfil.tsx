import { createFileRoute } from "@tanstack/react-router";
import { PageTitle } from "@/components/AppShell";

export const Route = createFileRoute("/cliente/perfil")({
  head: () => ({
    meta: [
      { title: "Perfil · Voltei" },
      { name: "description", content: "Perfil no Voltei." },
      { property: "og:title", content: "Perfil · Voltei" },
      { property: "og:description", content: "Perfil no Voltei." },
    ],
  }),
  component: Perfil,
});

function Perfil() {
  return <PageTitle title="Perfil" />;
}
