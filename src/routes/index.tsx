import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Voltei · Clube de fidelidade do comércio local" },
      { name: "description", content: "Junte pontos e ganhe prêmios nos seus lugares favoritos." },
      { property: "og:title", content: "Voltei · Clube de fidelidade do comércio local" },
      { property: "og:description", content: "Junte pontos e ganhe prêmios nos seus lugares favoritos." },
    ],
  }),
  component: Index,
});

const areas = [
  { to: "/entrar", label: "Sou cliente", cls: "bg-primary text-primary-foreground" },
  { to: "/empresa", label: "Sou empresa", cls: "bg-accent text-accent-foreground" },
  { to: "/admin", label: "Administração", cls: "border border-border bg-card text-foreground" },
] as const;

function Index() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-8 px-6">
      <div>
        <h1 className="text-5xl font-extrabold text-primary">Voltei</h1>
        <p className="mt-2 text-lg text-muted-foreground">Que bom te ver de novo!</p>
      </div>
      <div className="flex flex-col gap-3">
        {areas.map((a) => (
          <Link key={a.to} to={a.to} className={`flex min-h-14 items-center justify-center rounded-2xl text-lg font-bold ${a.cls}`}>
            {a.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
