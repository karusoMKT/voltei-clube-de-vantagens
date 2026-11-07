import { createFileRoute } from "@tanstack/react-router";
import { PageTitle } from "@/components/AppShell";

export const Route = createFileRoute("/empresa/resumo")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Resumo · Voltei" },
      { name: "description", content: "Resumo no Voltei." },
      { property: "og:title", content: "Resumo · Voltei" },
      { property: "og:description", content: "Resumo no Voltei." },
    ],
  }),
  component: Resumo,
});

function Resumo() {
  return <PageTitle title="Resumo" />;
}
