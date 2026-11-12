import { useEffect } from "react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Store, Gift } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { signOutAndLeave } from "@/lib/logout";
import { getSessionInfo, homeFor, isStaff } from "@/lib/session";

export const Route = createFileRoute("/caixa")({
  ssr: false,
  beforeLoad: async () => {
    const info = await getSessionInfo();
    if (!info) throw redirect({ to: "/entrar" });
    if (!isStaff(info.role) || !info.companyId) throw redirect({ to: homeFor(info.role) });
    return { companyId: info.companyId };
  },
  component: Layout,
});

function Layout() {
  const { companyId } = Route.useRouteContext();
  const qc = useQueryClient();
  const navigate = useNavigate();
  useEffect(() => {
    const channel = supabase
      .channel(`caixa-${companyId}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "redemptions", filter: `company_id=eq.${companyId}` },
        () => qc.invalidateQueries({ queryKey: ["empresa"] }))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [companyId, qc]);
  return (
    <AppShell
      area="Caixa"
      onSignOut={() => signOutAndLeave({ queryClient: qc, navigate })}
      tabs={[
        { to: "/caixa", label: "Caixa", icon: Store, exact: true },
        { to: "/caixa/resgates", label: "Resgates", icon: Gift },
      ]}
    />
  );
}
