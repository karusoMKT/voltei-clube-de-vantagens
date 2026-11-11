import { createFileRoute } from "@tanstack/react-router";
import { EntrarForm } from "@/components/EntrarForm";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Voltei · Clube de fidelidade do comércio local" },
      { name: "description", content: "Junte pontos e ganhe prêmios nos seus lugares favoritos." },
      { property: "og:title", content: "Voltei · Clube de fidelidade do comércio local" },
      { property: "og:description", content: "Junte pontos e ganhe prêmios nos seus lugares favoritos." },
    ],
  }),
  component: Index,
});

function Index() {
  return <EntrarForm />;
}
