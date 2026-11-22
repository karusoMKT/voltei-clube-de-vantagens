import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { queryOptions, useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlanLock } from "@/components/PlanLock";
import { getSatisfactionSettings, saveSatisfactionSettings } from "@/lib/satisfaction.functions";
import { WhatsappAlertsCard, alertsQuery } from "@/components/WhatsappAlertsCard";
import { satisfactionEnabled, satisfactionSettingsSchema } from "@/lib/satisfaction";
const settingsQuery = (companyId: string) => queryOptions({ queryKey: ["empresa","pesquisa",companyId], queryFn: () => getSatisfactionSettings({ data: { companyId } }) });
export const Route = createFileRoute("/empresa/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações da pesquisa · Voltei" }, { name: "description", content: "Configure a pesquisa de satisfação e o link do Google da sua loja." }, { property: "og:title", content: "Configurações da pesquisa · Voltei" }, { property: "og:description", content: "Configure a pesquisa de satisfação e o link do Google da sua loja." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(settingsQuery(context.companyId)), context.queryClient.ensureQueryData(alertsQuery(context.companyId))]),
  component: Settings,
});
function Settings() {
  const { companyId } = Route.useRouteContext();
  const { data } = useSuspenseQuery(settingsQuery(companyId));
  return <div className="space-y-5 px-5 pt-6 pb-8"><h1 className="text-3xl font-extrabold text-foreground">Configurações</h1>{satisfactionEnabled(data.plan,data.active) ? <SettingsForm companyId={companyId} url={data.google_review_url ?? ""} points={data.google_review_points} /> : <PlanLock title="Pesquisa de satisfação e link do Google" plan="Premium" />}<WhatsappAlertsCard companyId={companyId} /></div>;
}
function SettingsForm({ companyId, url, points }: { companyId: string; url: string; points: number }) {
  const [link, setLink] = useState(url);
  const [value, setValue] = useState(String(points));
  const save = useServerFn(saveSatisfactionSettings);
  const qc = useQueryClient();
  const mutation = useMutation({ mutationFn: (data: ReturnType<typeof satisfactionSettingsSchema.parse>) => save({ data }), onSuccess: (r) => { if (!r.ok) { toast.error(r.message); return; } toast.success(r.message); qc.invalidateQueries({ queryKey: ["empresa","pesquisa"] }); qc.invalidateQueries({ queryKey: ["cliente"] }); }, onError: () => toast.error("Não conseguimos salvar agora.") });
  return <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); const r = satisfactionSettingsSchema.safeParse({ companyId, url: link, points: value }); if (!r.success) { toast.error(r.error.issues[0]?.message ?? "Confira os campos."); return; } mutation.mutate(r.data); }}>
    <h2 className="text-xl font-extrabold">Pesquisa de satisfação</h2>
    <div className="space-y-2"><Label htmlFor="survey-points">Pontos pela opinião no Voltei</Label><Input id="survey-points" type="number" min={1} max={10000} step={1} className="h-12 rounded-2xl" value={value} onChange={(e) => setValue(e.target.value)} /></div>
    <div className="space-y-2"><Label htmlFor="google-url">Link da empresa no Google (opcional)</Label><Input id="google-url" type="url" placeholder="https://g.page/..." className="h-12 rounded-2xl" value={link} onChange={(e) => setLink(e.target.value)} /></div>
    <p className="text-sm text-muted-foreground">Pontos pela pesquisa interna, independentemente da nota. Avaliar no Google é opcional e não dá pontos extras.</p>
    <Button type="submit" variant="hero" size="xl" disabled={mutation.isPending}><Save />{mutation.isPending ? "Salvando..." : "Salvar configurações"}</Button>
  </form>;
}
