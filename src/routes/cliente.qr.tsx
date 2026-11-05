import { createFileRoute } from "@tanstack/react-router";
import { PageTitle } from "@/components/AppShell";

export const Route = createFileRoute("/cliente/qr")({
  head: () => ({
    meta: [
      { title: "Meu QR · Voltei" },
      { name: "description", content: "Meu QR no Voltei." },
      { property: "og:title", content: "Meu QR · Voltei" },
      { property: "og:description", content: "Meu QR no Voltei." },
    ],
  }),
  component: MeuQr,
});

function MeuQr() {
  return <PageTitle title="Meu QR" />;
}
