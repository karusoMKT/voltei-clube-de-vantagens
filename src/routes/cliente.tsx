import { createFileRoute } from "@tanstack/react-router";
import { Home, Gift, QrCode, User } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/cliente")({ component: Layout });

function Layout() {
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
