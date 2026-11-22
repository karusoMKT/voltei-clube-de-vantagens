import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { BellRing, Gift, Lock, Send, UserX, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { getAlertSettings, saveAlertSettings, sendTestAlert } from "@/lib/alerts.functions";
import { ABSENT_DAY_OPTIONS, ALERT_LABELS, STATUS_LABELS, alertSettingsSchema } from "@/lib/alerts";
import { maskPhone } from "@/lib/cadastro";

export const alertsQuery = (companyId: string) => queryOptions({ queryKey: ["empresa", "alertas", companyId], queryFn: () => getAlertSettings({ data: { companyId } }) });

const PREVIEW = [
  { icon: Gift, title: "Resgates", text: "“Maria resgatou Casquinha (100 pts), validado por Ana.”" },
  { icon: UserX, title: "Clientes ausentes", text: "“5 clientes não voltam há 30 dias. Mensagem pronta para chamar.”" },
  { icon: BarChart3, title: "Resumo mensal", text: "“Outubro: 4.200 pontos, 38 resgates, prêmio campeão: Milk-shake.”" },
];

export function WhatsappAlertsCard({ companyId }: { companyId: string }) {
  const { data } = useSuspenseQuery(alertsQuery(companyId));
  const premium = data.plan === "premium";
  return (
    <section className="space-y-4 rounded-3xl border border-border bg-card p-5">
      <div className="flex items-center gap-2"><BellRing className="h-5 w-5 text-primary" /><h2 className="text-xl font-extrabold">Alertas Inteligentes no WhatsApp</h2></div>
      {premium ? <AlertsForm companyId={companyId} data={data} /> : <Locked />}
    </section>
  );
}

function Locked() {
  return <div className="space-y-3">
    <span className="inline-flex items-center gap-1 rounded-full bg-cream px-3 py-1 text-sm font-extrabold text-foreground"><Lock className="h-4 w-4" />Exclusivo Plano Premium</span>
    <ul className="space-y-2 opacity-70">{PREVIEW.map((p) => <li key={p.title} className="flex gap-3 rounded-2xl bg-accent p-3"><p.icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><div><p className="font-extrabold">{p.title}</p><p className="text-sm text-muted-foreground">{p.text}</p></div></li>)}</ul>
    <p className="text-sm text-muted-foreground">Receba esses avisos no seu WhatsApp. Fale com o Voltei para fazer o upgrade.</p>
  </div>;
}

type Data = Awaited<ReturnType<typeof getAlertSettings>>;
function AlertsForm({ companyId, data }: { companyId: string; data: Data }) {
  const [enabled, setEnabled] = useState(data.whatsapp_alerts_enabled);
  const [phone, setPhone] = useState(data.owner_alert_whatsapp ? maskPhone(data.owner_alert_whatsapp) : "");
  const [days, setDays] = useState(data.absent_days_threshold);
  const save = useServerFn(saveAlertSettings);
  const test = useServerFn(sendTestAlert);
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ["empresa", "alertas"] });
  const saving = useMutation({ mutationFn: (d: ReturnType<typeof alertSettingsSchema.parse>) => save({ data: d }), onSuccess: (r) => { r.ok ? toast.success(r.message) : toast.error(r.message); refresh(); }, onError: () => toast.error("Não conseguimos salvar agora.") });
  const testing = useMutation({ mutationFn: () => test({ data: { companyId } }), onSuccess: (r) => { r.ok ? toast.success(r.message) : toast.error(r.message); refresh(); }, onError: () => toast.error("Não conseguimos enviar o teste.") });
  return <div className="space-y-5">
    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); const r = alertSettingsSchema.safeParse({ companyId, enabled, phone, days }); if (!r.success) { toast.error(r.error.issues[0]?.message ?? "Confira os campos."); return; } saving.mutate(r.data); }}>
      <div className="flex items-center justify-between gap-3 rounded-2xl bg-accent p-4"><Label htmlFor="alerts-on" className="font-extrabold">Receber alertas</Label><Switch id="alerts-on" checked={enabled} onCheckedChange={setEnabled} /></div>
      <div className="space-y-2"><Label htmlFor="alert-phone">WhatsApp que recebe os avisos</Label><Input id="alert-phone" inputMode="numeric" placeholder="Em branco: WhatsApp do dono" className="h-12 rounded-2xl" value={phone} onChange={(e) => setPhone(maskPhone(e.target.value))} /></div>
      <div className="space-y-2"><Label>Cliente ausente depois de</Label>
        <div className="grid grid-cols-3 gap-2">{ABSENT_DAY_OPTIONS.map((d) => <Button key={d} type="button" variant={days === d ? "default" : "outline"} className="h-12 rounded-2xl font-extrabold" aria-pressed={days === d} onClick={() => setDays(d)}>{d} dias</Button>)}</div>
      </div>
      <Button type="submit" variant="hero" size="xl" className="w-full" disabled={saving.isPending}>{saving.isPending ? "Salvando..." : "Salvar alertas"}</Button>
    </form>
    <Button type="button" variant="outline" className="h-12 w-full rounded-2xl font-extrabold" disabled={testing.isPending} onClick={() => testing.mutate()}><Send />{testing.isPending ? "Enviando..." : "Enviar alerta de teste"}</Button>
    <div className="space-y-2"><h3 className="font-extrabold">Últimos alertas</h3>
      {data.logs.length ? <ul className="space-y-2">{data.logs.map((l) => <li key={l.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border p-3 text-sm"><div><p className="font-bold">{ALERT_LABELS[l.alert_type] ?? l.alert_type}</p><p className="text-muted-foreground">{new Date(l.created_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</p></div><span className={l.status === "falhou" ? "font-bold text-destructive" : "font-bold text-primary"}>{STATUS_LABELS[l.status] ?? l.status}</span></li>)}</ul> : <p className="text-sm text-muted-foreground">Nenhum alerta ainda.</p>}
    </div>
  </div>;
}
