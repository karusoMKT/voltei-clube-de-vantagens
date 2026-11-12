import { Link, Outlet } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type Tab = { to: string; label: string; icon: LucideIcon; exact?: boolean };

export function PageTitle({ title }: { title: string }) {
  return (
    <div className="px-5 pt-8">
      <h1 className="text-3xl font-extrabold text-foreground">{title}</h1>
    </div>
  );
}

/** Cabeçalho igual em todas as áreas: marca, etiqueta da área e o botão Sair. */
export function AreaHeader({ area, onSignOut }: { area: string; onSignOut?: (() => void) | undefined }) {
  return (
    <header className="flex items-center justify-between gap-2 px-5 pt-5">
      <Link to="/" className="text-xl font-extrabold text-primary">Voltei</Link>
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-secondary px-3 py-1 text-sm font-bold text-secondary-foreground">{area}</span>
        {onSignOut && (
          <button
            type="button"
            onClick={onSignOut}
            className="flex min-h-12 items-center gap-1.5 rounded-2xl border border-border bg-card px-3 text-sm font-bold text-muted-foreground transition-colors hover:text-foreground active:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        )}
      </div>
    </header>
  );
}

export function AppShell({
  area,
  tabs,
  onSignOut,
}: {
  area: string;
  tabs: Tab[];
  onSignOut?: (() => void) | undefined;
}) {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-background">
      <AreaHeader area={area} onSignOut={onSignOut} />
      <main className="flex-1 pb-28"><Outlet /></main>
      <nav className="fixed inset-x-0 bottom-0 z-10 mx-auto max-w-md border-t border-border bg-card px-2 pb-[env(safe-area-inset-bottom)]">
        <ul className="grid" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
          {tabs.map(({ to, label, icon: Icon, exact }) => (
            <li key={to}>
              <Link
                to={to}
                activeOptions={{ exact: !!exact }}
                className="my-2 flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-xs font-bold text-muted-foreground transition-colors"
                activeProps={{ className: "bg-secondary text-primary" }}
              >
                <Icon className="h-6 w-6" />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
