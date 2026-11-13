import { useEffect } from "react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Store, CheckCircle2, Gift, BarChart3, Users, Settings } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { signOutAndLeave } from "@/lib/logout";
import { getSessionInfo, homeFor } from "@/lib/session";

export const Route = createFileRoute("/empresa")({
  ssr: false,
  beforeLoad: async () => {
    const info = await getSessionInfo();
    if (!info) throw redirect({ to: "/entrar" });
    if (info.role !== "dono" || !info.companyId) throw redirect({ to: homeFor(info.role) === "/empresa" ? "/cliente" : homeFor(info.role) });
    const { data: c } = await supabase.from("companies").select("plan").eq("id", info.companyId).maybeSingle();
    return { userId: info.userId, companyId: info.companyId, plan: c?.plan ?? "basic" };
  },
  component: Layout,
});

function Layout() {
  const { companyId } = Route.useRouteContext();
  const qc = useQueryClient();
  const navigate = useNavigate();

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
      onSignOut={() => signOutAndLeave({ queryClient: qc, navigate })}
      tabs={[
        { to: "/empresa", label: "Caixa", icon: Store, exact: true },
        { to: "/empresa/aprovar", label: "Aprovar", icon: CheckCircle2 },
        { to: "/empresa/premios", label: "Prêmios", icon: Gift },
        { to: "/empresa/resumo", label: "Resumo", icon: BarChart3 },
        { to: "/empresa/equipe", label: "Equipe", icon: Users },
        { to: "/empresa/configuracoes", label: "Config.", icon: Settings },
      ]}
    />
  );
}
