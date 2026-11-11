import { createFileRoute } from "@tanstack/react-router";
import { EntrarForm } from "@/components/EntrarForm";

export const Route = createFileRoute("/entrar")({
  validateSearch: (s: Record<string, unknown>): { equipe?: boolean } => (s["equipe"] === true || s["equipe"] === "true" ? { equipe: true } : {}),
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Entrar · Voltei" },
      { name: "description", content: "Entre no clube e ganhe a cada volta." },
      { property: "og:title", content: "Entrar · Voltei" },
      { property: "og:description", content: "Pontos por compra, foto e indicação. Prêmios do seu jeito." },
    ],
  }),
  component: Page,
});

function Page() {
  const { equipe } = Route.useSearch();
  return <EntrarForm equipe={!!equipe} />;
}
