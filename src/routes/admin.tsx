import { createFileRoute } from "@tanstack/react-router";
import { PageTitle } from "@/components/AppShell";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Administração · Voltei" },
      { name: "description", content: "Área do dono da plataforma Voltei." },
      { property: "og:title", content: "Administração · Voltei" },
      { property: "og:description", content: "Área do dono da plataforma Voltei." },
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
