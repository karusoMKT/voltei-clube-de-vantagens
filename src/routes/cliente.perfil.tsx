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
      <div className="space-y-5 px-5 pt-6">{data && <div className="flex items-center gap-3 rounded-3xl border border-border bg-card p-4"><span aria-hidden className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-xl font-extrabold text-primary-foreground">{(data.profile.full_name ?? "?").trim().charAt(0).toUpperCase()}</span><div className="min-w-0"><p className="break-words text-lg font-extrabold">{data.profile.full_name ?? "Cliente"}</p>{data.profile.instagram && <p className="text-sm text-muted-foreground">{data.profile.instagram}</p>}</div></div>}{data && <CityPreference key={data.profile.city ?? ""} userId={data.profile.id} city={data.profile.city ?? null} />}<TrocarPin /></div>
    </>
  );
}
