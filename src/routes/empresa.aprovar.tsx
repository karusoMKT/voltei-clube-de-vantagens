import { createFileRoute } from "@tanstack/react-router";
import { PageTitle } from "@/components/AppShell";

export const Route = createFileRoute("/empresa/aprovar")({
  head: () => ({
    meta: [
      { title: "Aprovar · Voltei" },
      { name: "description", content: "Aprovar no Voltei." },
      { property: "og:title", content: "Aprovar · Voltei" },
      { property: "og:description", content: "Aprovar no Voltei." },
    ],
  }),
  component: Aprovar,
});

function Aprovar() {
  return <PageTitle title="Aprovar" />;
}
