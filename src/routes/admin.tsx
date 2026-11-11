import { createFileRoute, redirect } from "@tanstack/react-router";
import { PageTitle } from "@/components/AppShell";
import { getSessionInfo, homeFor } from "@/lib/session";

export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: async () => {
    const info = await getSessionInfo();
    if (!info) throw redirect({ to: "/entrar" });
    if (info.role !== "admin") throw redirect({ to: homeFor(info.role) });
  },
  head: () => ({
    meta: [
      { title: "Administração · Voltei" },
      { name: "description", content: "Área do dono da plataforma Voltei." },
      { property: "og:title", content: "Administração · Voltei" },
      { property: "og:description", content: "Área do dono da plataforma Voltei." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Admin,
});

function Admin() {
  return (
    <div className="mx-auto min-h-screen max-w-md">
      <PageTitle title="Administração" />
    </div>
  );
}
