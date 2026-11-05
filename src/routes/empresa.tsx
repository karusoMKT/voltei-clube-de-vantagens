import { createFileRoute } from "@tanstack/react-router";
import { Store, CheckCircle2, Gift, BarChart3 } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/empresa")({ component: Layout });

function Layout() {
  return (
    <AppShell
      area="Empresa"
      tabs={[
        { to: "/empresa", label: "Caixa", icon: Store, exact: true },
        { to: "/empresa/aprovar", label: "Aprovar", icon: CheckCircle2 },
        { to: "/empresa/premios", label: "Prêmios", icon: Gift },
        { to: "/empresa/resumo", label: "Resumo", icon: BarChart3 },
      ]}
    />
  );
}
