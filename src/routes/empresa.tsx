import { useEffect } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Store, CheckCircle2, Gift, BarChart3 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { getSessionInfo, homeFor, isStaff } from "@/lib/session";

export const Route = createFileRoute("/empresa")({
  ssr: false,
  beforeLoad: async () => {
    const info = await getSessionInfo();
    if (!info) throw redirect({ to: "/entrar" });
    if (!isStaff(info.role) || !info.companyId) throw redirect({ to: homeFor(info.role) === "/empresa" ? "/cliente" : homeFor(info.role) });
    return { userId: info.userId, companyId: info.companyId };
  },
  component: Layout,
});

function Layout() {
  const { companyId } = Route.useRouteContext();
  const qc = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel(`empresa-${companyId}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "redemptions", filter: `company_id=eq.${companyId}` },
        () => qc.invalidateQueries({ queryKey: ["empresa"] }))
      .on("postgres_changes", { event: "*", schema: "public", table: "photo_submissions", filter: `company_id=eq.${companyId}` },
        () => qc.invalidateQueries({ queryKey: ["empresa"] }))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [companyId, qc]);

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
