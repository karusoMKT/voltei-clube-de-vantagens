import { useCustomerWallet } from "@/components/CustomerWallet";
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Empty, Loading } from "@/components/Empty";
import { resgatesQuery } from "@/lib/cliente-data";

export const Route = createFileRoute("/cliente/premios")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Prêmios · Voltei" },
      { name: "description", content: "Troque seus pontos por prêmios." },
      { property: "og:title", content: "Prêmios · Voltei" },
      { property: "og:description", content: "Troque seus pontos por prêmios." },
    ],
  }),
  component: Premios,
});

function Premios() {
  const qc = useQueryClient();
  const { data, isPending, companyId } = useCustomerWallet();
  const { data: resgates } = useQuery(resgatesQuery(companyId));
  const [codigo, setCodigo] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const resgatar = useMutation({
    mutationFn: async (rewardId: string) => {
      const { data, error } = await supabase.rpc("resgatar_premio", { _reward_id: rewardId });
      if (error) throw new Error(error.message);
      return data as string;
    },
    onSuccess: (code) => { setErro(null); setCodigo(code); qc.invalidateQueries({ queryKey: ["cliente"] }); },
    onError: (e) => setErro(e instanceof Error ? e.message : "Não deu certo agora. Tente de novo."),
  });

  if (isPending || !data) return <Loading />;
  const balance = data.membership?.balance ?? 0;

  return (
    <div className="space-y-6 px-5 pt-6">
      <div>
        <h1 className="text-3xl font-extrabold text-foreground">Prêmios</h1>
        <p className="mt-1 text-muted-foreground">Você tem <b className="text-primary">{balance} pontos</b>.</p>
      </div>

      {erro && <p role="alert" className="rounded-2xl bg-cream px-4 py-3 text-sm font-semibold text-foreground">{erro}</p>}

      {data.rewards.length === 0 ? (
        <Empty>A loja ainda não cadastrou prêmios.</Empty>
      ) : (
        <ul className="space-y-3">
          {data.rewards.map((r) => {
            const falta = r.cost_points - balance;
            return (
              <li key={r.id} className="flex items-center gap-4 rounded-3xl border border-border bg-card p-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-cream text-foreground">
                  <Gift className="h-7 w-7" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-extrabold text-foreground">{r.name}</p>
                  <p className="text-sm text-muted-foreground">{r.cost_points} pontos</p>
                </div>
                <Button className="h-12 rounded-2xl px-5 font-extrabold" variant={falta > 0 ? "secondary" : "default"}
                  disabled={falta > 0 || resgatar.isPending} onClick={() => resgatar.mutate(r.id)}>
                  {falta > 0 ? `Faltam ${falta}` : "Resgatar"}
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      <section>
        <h2 className="mb-3 text-lg font-extrabold text-foreground">Meus resgates</h2>
        {resgates && resgates.length > 0 ? (
          <ul className="space-y-3">
            {resgates.map((r) => (
              <li key={r.id} className="flex items-center justify-between rounded-3xl bg-secondary px-5 py-4">
                <div>
                  <p className="font-bold text-foreground">{r.rewards?.name}</p>
                  <p className="text-sm text-muted-foreground">Aguardando retirada</p>
                </div>
                <span className="text-2xl font-extrabold tracking-[0.2em] text-primary">{r.code}</span>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>Nenhum resgate esperando retirada.</Empty>
        )}
      </section>

      <Dialog open={!!codigo} onOpenChange={(o) => !o && setCodigo(null)}>
        <DialogContent className="max-w-sm rounded-3xl text-center">
          <DialogTitle className="text-xl font-extrabold">Prêmio garantido!</DialogTitle>
          <p className="my-4 text-6xl font-extrabold tracking-[0.25em] text-primary">{codigo}</p>
          <DialogDescription className="text-base">Mostre este código no caixa.</DialogDescription>
          <Button variant="hero" size="xl" className="mt-4" onClick={() => setCodigo(null)}>Entendi</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
