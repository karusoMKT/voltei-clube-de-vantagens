import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Star, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { submitSatisfaction } from "@/lib/satisfaction.functions";
import { GoogleInvitation } from "@/components/GoogleInvitation";
export function SatisfactionCard({ companyId, userId, points, url }: { companyId: string; userId: string; points: number; url: string | null }) {
  const [rating, setRating] = useState(0);
  const [submitted, setSubmitted] = useState<{ rating: number; points_awarded: number } | null>(null);
  const qc = useQueryClient();
  const submit = useServerFn(submitSatisfaction);
  const queryKey = ["cliente","pesquisa",companyId,userId];
  const { data: response, isPending, error } = useQuery({ queryKey, queryFn: async () => { const { data, error } = await supabase.from("satisfaction_responses").select("rating,points_awarded").eq("company_id",companyId).eq("customer_id",userId).maybeSingle(); if (error) throw error; return data; } });
  const mutation = useMutation({ mutationFn: () => submit({ data: { companyId, rating } }), onSuccess: (r) => { if (!r.ok) { toast.error(r.message); return; } const completed = { rating, points_awarded: points }; setSubmitted(completed); qc.setQueryData(queryKey,completed); qc.invalidateQueries({ queryKey: ["cliente"] }); toast.success(r.message); }, onError: () => toast.error("Não conseguimos enviar sua opinião.") });
  const completed = response ?? submitted;
  if (isPending && !completed) return <p className="text-sm text-muted-foreground">Carregando pesquisa...</p>;
  if (error && !completed) return <p role="alert" className="text-sm text-destructive">Não conseguimos carregar sua pesquisa.</p>;
  return <section className="space-y-4 border-y border-border py-5">
    <h2 className="text-xl font-extrabold text-foreground">{completed ? "Obrigada pela sua opinião!" : "Sua opinião vale pontos!"}</h2>
    {completed ? <p className="flex items-center gap-2 font-bold text-primary"><CheckCircle2 className="h-5 w-5" />+{completed.points_awarded} pontos pela pesquisa</p> : <>
      <p className="text-muted-foreground">Como foi sua experiência na loja? Ganhe {points} pontos por responder, qualquer que seja a nota.</p>
      <div role="group" aria-label="Nota da experiência" className="flex justify-between gap-2">{[1,2,3,4,5].map((n) => <Button key={n} type="button" variant="ghost" aria-label={`${n} ${n === 1 ? "estrela" : "estrelas"}`} aria-pressed={rating===n} className="h-14 w-14 rounded-2xl text-primary" onClick={() => setRating(n)} disabled={mutation.isPending}><Star className={`h-7 w-7 ${n<=rating ? "fill-current" : ""}`} /></Button>)}</div>
      <p className="min-h-6 text-center font-bold">{rating ? `${rating} de 5` : ""}</p>
      <Button variant="hero" size="xl" disabled={!rating || mutation.isPending} onClick={() => mutation.mutate()}>{mutation.isPending ? "Enviando..." : "Enviar opinião"}</Button>
      <p className="text-xs text-muted-foreground">Uma pesquisa por cliente nesta loja.</p>
    </>}
    <GoogleInvitation submitted={!!completed} url={url} />
  </section>;
}
