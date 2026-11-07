import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Empty, Loading } from "@/components/Empty";

export const Route = createFileRoute("/empresa/aprovar")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Aprovar · Voltei" },
      { name: "description", content: "Entregue os prêmios resgatados." },
      { property: "og:title", content: "Aprovar · Voltei" },
      { property: "og:description", content: "Entregue os prêmios resgatados." },
    ],
  }),
  component: Aprovar,
});

function Aprovar() {
  const { companyId } = Route.useRouteContext();
  const qc = useQueryClient();
  const [msg, setMsg] = useState<string | null>(null);

  const { data, isPending } = useQuery({
    queryKey: ["empresa", "resgates", companyId],
    queryFn: async () => {
      const { data, error } = await supabase.from("redemptions")
        .select("id, code, created_at, profiles(full_name), rewards(name)")
        .eq("company_id", companyId).eq("status", "pendente").order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const entregar = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("entregar_resgate", { _redemption_id: id });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => { setMsg("Prêmio entregue!"); qc.invalidateQueries({ queryKey: ["empresa", "resgates"] }); },
    onError: (e) => setMsg(e.message),
  });

  if (isPending) return <Loading />;

  return (
    <div className="space-y-5 px-5 pt-6">
      <div>
        <h1 className="text-3xl font-extrabold text-foreground">Aprovar</h1>
        <p className="mt-1 text-muted-foreground">Resgates esperando entrega.</p>
      </div>
      {msg && <p role="status" className="rounded-2xl bg-secondary px-4 py-3 font-bold text-secondary-foreground">{msg}</p>}
      {data && data.length > 0 ? (
        <ul className="space-y-3">
          {data.map((r) => (
            <li key={r.id} className="rounded-3xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-lg font-extrabold text-foreground">{r.profiles?.full_name}</p>
                  <p className="text-muted-foreground">{r.rewards?.name}</p>
                </div>
                <span className="text-3xl font-extrabold tracking-[0.2em] text-primary">{r.code}</span>
              </div>
              <Button className="mt-4 h-12 w-full rounded-2xl text-base font-extrabold" disabled={entregar.isPending}
                onClick={() => entregar.mutate(r.id)}>
                Entregar
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <Empty>Nenhum resgate pendente agora.</Empty>
      )}
    </div>
  );
}
