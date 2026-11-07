import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, X, ZoomIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { reviewPhoto } from "@/lib/photo.functions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Empty, Loading } from "@/components/Empty";

export function PhotoReviews({ companyId }: { companyId: string }) {
  const qc = useQueryClient();
  const review = useServerFn(reviewPhoto);
  const [message, setMessage] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<{ url: string; name: string } | null>(null);
  const { data, isPending, isError } = useQuery({
    queryKey: ["empresa", "fotos", companyId],
    refetchInterval: 240000,
    queryFn: async () => {
      const { data, error } = await supabase.from("photo_submissions")
        .select("id, image_path, instagram_handle, created_at, profiles!photo_submissions_customer_id_fkey(full_name, instagram)")
        .eq("company_id", companyId).eq("status", "pendente").order("created_at");
      if (error) throw error;
      return Promise.all(data.map(async (s) => {
        const { data: signed } = await supabase.storage.from("prints").createSignedUrl(s.image_path, 300);
        return { ...s, url: signed?.signedUrl ?? null };
      }));
    },
  });
  const mutation = useMutation({
    mutationFn: async (args: { submissionId: string; approve: boolean }) => {
      const result = await review({ data: args });
      if (!result.ok) throw new Error(result.message);
      return result.message;
    },
    onSuccess: (msg) => { setMessage(msg); qc.invalidateQueries({ queryKey: ["empresa", "fotos"] }); },
    onError: (e) => setMessage(e.message),
  });
  return <section className="space-y-3">
    <h2 className="text-lg font-extrabold">Fotos aguardando aprovação</h2>
    {message && <p role="status" className="rounded-2xl bg-secondary p-4 font-bold">{message}</p>}
    {isPending ? <Loading /> : isError ? <p role="alert">Não conseguimos carregar os prints agora.</p> : !data?.length ? <Empty>Nenhum print pendente agora.</Empty> : <ul className="space-y-4">
      {data.map((s) => <li key={s.id} className="rounded-3xl border border-border bg-card p-4">
        <p className="font-extrabold">{s.profiles?.full_name}</p>
        <p className="mb-3 text-sm text-muted-foreground">{s.profiles?.instagram ?? s.instagram_handle ?? "Instagram não informado"}</p>
        {s.url ? <Button variant="ghost" className="relative h-44 w-full overflow-hidden rounded-2xl bg-secondary p-0" aria-label={`Ampliar print de ${s.profiles?.full_name ?? "cliente"}`} onClick={() => setExpanded({ url: s.url ?? "", name: s.profiles?.full_name ?? "Cliente" })}>
          <img src={s.url} alt={`Print de ${s.profiles?.full_name ?? "cliente"}`} className="h-full w-full object-contain" /><span className="absolute bottom-2 right-2 rounded-full bg-card p-2 text-primary"><ZoomIn /></span>
        </Button> : <p className="py-4 text-sm text-muted-foreground">Não conseguimos abrir o print. Atualize a página.</p>}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Button className="h-12 rounded-2xl font-extrabold" disabled={mutation.isPending || !s.url} onClick={() => mutation.mutate({ submissionId: s.id, approve: true })}><Check />Aprovar</Button>
          <Button variant="outline" className="h-12 rounded-2xl font-extrabold" disabled={mutation.isPending} onClick={() => mutation.mutate({ submissionId: s.id, approve: false })}><X />Recusar</Button>
        </div>
      </li>)}
    </ul>}
    <Dialog open={!!expanded} onOpenChange={(open) => !open && setExpanded(null)}><DialogContent className="max-w-2xl rounded-3xl">
      <DialogTitle>Print de {expanded?.name}</DialogTitle><DialogDescription>Marcação enviada para aprovação.</DialogDescription>
      {expanded && <img src={expanded.url} alt={`Print ampliado de ${expanded.name}`} className="max-h-[65vh] w-full object-contain" />}
    </DialogContent></Dialog>
  </section>;
}