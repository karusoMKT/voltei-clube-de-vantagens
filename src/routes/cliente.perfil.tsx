import { createFileRoute } from "@tanstack/react-router";
import { PageTitle } from "@/components/AppShell";
import { TrocarPin } from "@/components/TrocarPin";
import { CityPreference } from "@/components/CityPreference";
import { useCustomerWallet } from "@/components/CustomerWallet";

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
  const { data } = useCustomerWallet();
  return (
    <>
      <PageTitle title="Perfil" />
      <div className="space-y-5 px-5 pt-6">{data && <CityPreference key={data.profile.city ?? ""} userId={data.profile.id} city={data.profile.city ?? null} />}<TrocarPin /></div>
    </>
  );
}
