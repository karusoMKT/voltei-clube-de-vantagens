import { createFileRoute } from "@tanstack/react-router";
import { PageTitle } from "@/components/AppShell";
import { TrocarPin } from "@/components/TrocarPin";

export const Route = createFileRoute("/cliente/perfil")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Perfil · Voltei" },
      { name: "description", content: "Perfil no Voltei." },
      { property: "og:title", content: "Perfil · Voltei" },
      { property: "og:description", content: "Perfil no Voltei." },
    ],
  }),
  component: Perfil,
});

function Perfil() {
  return (
    <>
      <PageTitle title="Perfil" />
      <div className="px-5 pt-6"><TrocarPin /></div>
    </>
  );
}
