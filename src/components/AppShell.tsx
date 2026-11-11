import { Link, Outlet } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";

export type Tab = { to: string; label: string; icon: LucideIcon; exact?: boolean };

export function PageTitle({ title }: { title: string }) {
  return (
    <div className="px-5 pt-8">
      <h1 className="text-3xl font-extrabold text-foreground">{title}</h1>
    </div>
  );
}

export function AppShell({ area, tabs }: { area: string; tabs: Tab[] }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-background">
      <header className="flex items-center justify-between px-5 pt-5">
        <Link to="/" className="text-xl font-extrabold text-primary">Voltei</Link>
        <span className="rounded-full bg-secondary px-3 py-1 text-sm font-bold text-secondary-foreground">{area}</span>
      </header>
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
