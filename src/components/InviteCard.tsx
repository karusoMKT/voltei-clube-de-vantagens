import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Share2, UserPlus } from "lucide-react";
import { getMyInvite } from "@/lib/referral.functions";
import { inviteLink } from "@/lib/referral";
import { Button } from "./ui/button";

export function InviteCard({ companyId, companyName }: { companyId: string; companyName: string }) {
  const fetchInvite = useServerFn(getMyInvite);
  const { data, error } = useQuery({ queryKey: ["cliente", "convite", companyId], queryFn: () => fetchInvite({ data: { companyId } }) });
  if (error || !data || !data.points) return null;
  const link = inviteLink(window.location.origin, data.slug, data.code);
  async function share() {
    const text = `Entre no clube da ${companyName} no Voltei e ganhe pontos a cada compra:`;
    try {
      if (navigator.share) { await navigator.share({ title: "Voltei", text, url: link }); return; }
      await navigator.clipboard.writeText(`${text} ${link}`);
      toast.success("Link copiado! É só colar para seu amigo.");
    } catch { /* cancelado */ }
  }
  return (
    <section className="rounded-3xl border border-border bg-cream p-5">
      <p className="flex items-center gap-2 text-lg font-extrabold"><UserPlus className="h-5 w-5 text-primary" />Convide um amigo</p>
      <p className="mt-1 text-sm text-muted-foreground">Você ganha {data.points} pontos quando ele fizer a primeira compra na {companyName}.</p>
      <p className="mt-3 text-sm font-bold">Seu código: <span className="tracking-widest text-primary">{data.code}</span></p>
      {(data.pending > 0 || data.done > 0) && <p className="mt-1 text-sm text-muted-foreground">{data.done} convite(s) pontuado(s) · {data.pending} aguardando compra</p>}
      <Button variant="hero" size="xl" className="mt-3 w-full rounded-2xl" onClick={share}><Share2 />Compartilhar convite</Button>
    </section>
  );
}
