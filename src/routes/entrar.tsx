import { createFileRoute } from "@tanstack/react-router";
import { EntrarForm } from "@/components/EntrarForm";

export const Route = createFileRoute("/entrar")({
  head: () => ({
    meta: [
      { title: "Entrar · Voltei" },
      { name: "description", content: "Entre no clube e ganhe a cada volta." },
      { property: "og:title", content: "Entrar · Voltei" },
      { property: "og:description", content: "Pontos por compra, foto e indicação. Prêmios do seu jeito." },
    ],
  }),
  component: () => <EntrarForm />,
});
