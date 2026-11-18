import { useEffect } from "react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Home, Gift, QrCode, User } from "lucide-react";
import { CustomerWallet, WalletSelector } from "@/components/CustomerWallet";
import { InstallPwaBanner } from "@/components/InstallPwaBanner";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { signOutAndLeave } from "@/lib/logout";
import { getSessionInfo, homeFor } from "@/lib/session";

export const Route = createFileRoute("/cliente")({
  ssr: false,
  beforeLoad: async () => {
    const info = await getSessionInfo();
    if (!info) throw redirect({ to: "/entrar" });
    if (info.role !== "cliente") throw redirect({ to: homeFor(info.role) });
    return { userId: info.userId };
  },
  component: Layout,
});

function Layout() {
  const { userId } = Route.useRouteContext();
  const qc = useQueryClient();
  const navigate = useNavigate();

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
    <CustomerWallet><AppShell
      area="Cliente"
      beforeContent={<><InstallPwaBanner /><WalletSelector /></>}
      onSignOut={() => signOutAndLeave({ queryClient: qc, navigate })}
      tabs={[
        { to: "/cliente", label: "Início", icon: Home, exact: true },
        { to: "/cliente/premios", label: "Prêmios", icon: Gift },
        { to: "/cliente/qr", label: "Meu QR", icon: QrCode },
        { to: "/cliente/perfil", label: "Perfil", icon: User },
      ]}
    /></CustomerWallet>
  );
}
