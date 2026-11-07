import { useEffect } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Home, Gift, QrCode, User } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { getSessionInfo, isStaff } from "@/lib/session";

export const Route = createFileRoute("/cliente")({
  ssr: false,
  beforeLoad: async () => {
    const info = await getSessionInfo();
    if (!info) throw redirect({ to: "/entrar" });
    if (isStaff(info.role)) throw redirect({ to: "/empresa" });
    return { userId: info.userId };
  },
  component: Layout,
});

function Layout() {
  const { userId } = Route.useRouteContext();
  const qc = useQueryClient();

  // Saldo, histórico e resgates atualizam sozinhos
  useEffect(() => {
    const channel = supabase
      .channel(`cliente-${userId}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "memberships", filter: `customer_id=eq.${userId}` },
        () => qc.invalidateQueries({ queryKey: ["cliente"] }))
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions", filter: `customer_id=eq.${userId}` },
        () => qc.invalidateQueries({ queryKey: ["cliente"] }))
      .on("postgres_changes", { event: "*", schema: "public", table: "redemptions", filter: `customer_id=eq.${userId}` },
        () => qc.invalidateQueries({ queryKey: ["cliente"] }))
      .on("postgres_changes", { event: "*", schema: "public", table: "photo_submissions", filter: `customer_id=eq.${userId}` },
        () => qc.invalidateQueries({ queryKey: ["cliente"] }))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, qc]);

  return (
    <AppShell
      area="Cliente"
      tabs={[
        { to: "/cliente", label: "Início", icon: Home, exact: true },
        { to: "/cliente/premios", label: "Prêmios", icon: Gift },
        { to: "/cliente/qr", label: "Meu QR", icon: QrCode },
        { to: "/cliente/perfil", label: "Perfil", icon: User },
      ]}
    />
  );
}
