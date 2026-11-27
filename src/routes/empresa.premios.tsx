import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Gift, Plus, Save, AlertTriangle, Pencil, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Empty, Loading } from "@/components/Empty";
import { getCompanyRewards, saveCompanyRate, createCompanyReward, toggleCompanyReward, updateCompanyReward } from "@/lib/company-panels.functions";
import { rateSchema, rewardSchema, rewardReturn, suggestPoints, rewardLimitReached, BASIC_REWARD_LIMIT, HEALTHY_RETURN } from "@/lib/company-panels";
import { toast } from "sonner";
import { PlanLock } from "@/components/PlanLock";
import { planAllows } from "@/lib/plans";
import { maskReais, parseReais } from "@/lib/caixa";

export const Route = createFileRoute("/empresa/premios")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Prêmios da loja · Voltei" },
      { name: "description", content: "Defina a regra de pontos e acompanhe o retorno dos prêmios da sua loja." },
      { property: "og:title", content: "Prêmios da loja · Voltei" },
      { property: "og:description", content: "Defina a regra de pontos e acompanhe o retorno dos prêmios da sua loja." },
    ],
  }),
  component: EmpresaPremios,
});

function EmpresaPremios() {
  const { companyId, plan } = Route.useRouteContext();
  const qc = useQueryClient();
  const fetchRewards = useServerFn(getCompanyRewards);
  const saveRate = useServerFn(saveCompanyRate);
  const createReward = useServerFn(createCompanyReward);
  const toggleReward = useServerFn(toggleCompanyReward);
  const updateReward = useServerFn(updateCompanyReward);
  const [editing, setEditing] = useState<string | null>(null);
  const [pointsTouched, setPointsTouched] = useState(false);
  const { data, isPending, error } = useQuery({ queryKey: ["empresa", "premios", companyId], queryFn: () => fetchRewards({ data: { companyId } }) });
  const [rate, setRate] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", costReais: "", costPoints: "" });
  const [formError, setFormError] = useState<string | null>(null);
  const refresh = () => { qc.invalidateQueries({ queryKey: ["empresa"] }); qc.invalidateQueries({ queryKey: ["cliente"] }); };
  const rateMutation = useMutation({
    mutationFn: async (value: number) => { const result = await saveRate({ data: { companyId, rate: value } }); if (!result.ok) throw new Error(result.message); return result.message; },
    onSuccess: (msg) => { setMessage(msg); setRate(null); refresh(); }, onError: (e) => setMessage(e.message),
  });
  const createMutation = useMutation({
    mutationFn: async (values: { name: string; costReais: number; costPoints: number }) => { const result = editing ? await updateReward({ data: { ...values, rewardId: editing } }) : await createReward({ data: { ...values, companyId } }); if (!result.ok) throw new Error(result.message); return result.message; },
    onSuccess: (msg) => { toast.success(msg); setOpen(false); setEditing(null); setForm({ name: "", costReais: "", costPoints: "" }); refresh(); }, onError: (e) => { setFormError(e.message); toast.error(e.message); },
  });
  const toggleMutation = useMutation({
    mutationFn: async (values: { rewardId: string; active: boolean }) => { const result = await toggleReward({ data: values }); if (!result.ok) throw new Error(result.message); return result.message; },
    onSuccess: (msg) => { setMessage(msg); refresh(); }, onError: (e) => setMessage(e.message),
  });
  if (isPending) return <Loading />;
  if (error || !data) return <div role="alert" className="px-5 pt-6">{error?.message ?? "Não conseguimos carregar os prêmios."}</div>;
  const money = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const rateNow = data.company.points_per_real;
  const activeCount = data.rewards.filter((r) => r.active).length;
  const limitReached = rewardLimitReached(plan, activeCount);
  const reaisValue = form.costReais ? parseReais(form.costReais) : 0;
  const calc = planAllows(plan, "calculator");
  const suggestion = calc ? suggestPoints(reaisValue, rateNow) : null;
  const formReturn = !calc ? null : rewardReturn(form.costReais ? reaisValue : null, Number(form.costPoints), rateNow);
  const openNew = () => { setFormError(null); setEditing(null); setPointsTouched(false); setForm({ name: "", costReais: "", costPoints: "" }); setOpen(true); };
  const openEdit = (r: { id: string; name: string; cost_reais: number | null; cost_points: number }) => {
    setFormError(null); setEditing(r.id); setPointsTouched(true);
    setForm({ name: r.name, costReais: r.cost_reais === null ? "" : maskReais(r.cost_reais.toFixed(2)), costPoints: String(r.cost_points) }); setOpen(true);
  };
  const displayRate = rate ?? String(data.company.points_per_real).replace(".", ",");
  return <div className="space-y-5 px-5 pt-6">
    <h1 className="text-3xl font-extrabold">Seus prêmios</h1>
    <form className="border-y border-border py-4" onSubmit={(e) => {
      e.preventDefault(); const parsed = rateSchema.safeParse(Number(displayRate.replace(",", ".")));
      if (!parsed.success) { setMessage(parsed.error.issues[0]?.message ?? "Confira a regra de pontos."); return; }
      rateMutation.mutate(parsed.data);
    }}>
      <label htmlFor="points-rate" className="mb-3 block font-extrabold">Regra de pontos</label>
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-bold">R$ 1 =</span><Input id="points-rate" aria-label="Pontos por real" inputMode="decimal" maxLength={8} value={displayRate} onChange={(e) => setRate(e.target.value.replace(/[^\d,.]/g, ""))} className="h-12 w-20 rounded-2xl bg-card text-center font-extrabold text-primary" /><span className="text-sm font-semibold">ponto(s)</span>
        <Button type="submit" variant="secondary" className="ml-auto h-12 rounded-2xl" disabled={rateMutation.isPending}><Save />Salvar</Button>
      </div>
    </form>
    {!calc ? <PlanLock title="Calculadora de retorno dos prêmios" plan="Profissional" /> : <div className="rounded-3xl border border-border bg-card p-4 text-sm">
      <p className="font-extrabold">Como calculamos o retorno</p>
      <p className="mt-1 text-muted-foreground">Retorno é o custo do prêmio dividido pelo gasto do cliente. Ideal: 3% a 8%.</p>
      <p className="mt-2 rounded-2xl bg-secondary px-3 py-2 font-bold text-primary">custo em R$ ÷ (pontos ÷ {String(rateNow).replace(".", ",")} ponto(s) por real)</p>
      <div className="mt-3 flex flex-wrap gap-2 text-xs font-extrabold"><span className="rounded-full bg-muted px-3 py-1">Baixo &lt; 3%</span><span className="rounded-full bg-secondary px-3 py-1 text-primary">Bom 3% a 8%</span><span className="rounded-full bg-cream px-3 py-1">Alto &gt; 8%</span></div>
    </div>}
    {message && <p role="status" className="rounded-2xl bg-secondary p-4 font-bold">{message}</p>}
    {plan === "basic" && <p className="text-sm font-semibold text-muted-foreground">Plano Básico: {activeCount} de {BASIC_REWARD_LIMIT} prêmios ativos.</p>}
    {limitReached && <div role="note" className="rounded-3xl border border-border bg-accent p-4"><p className="flex items-center gap-2 font-extrabold"><Lock className="h-5 w-5 text-primary" />Você chegou ao limite de {BASIC_REWARD_LIMIT} prêmios ativos</p><p className="mt-1 text-sm text-muted-foreground">No plano Profissional você cadastra prêmios sem limite. Fale com o Voltei para fazer o upgrade.</p></div>}
    <Button variant="hero" size="xl" disabled={limitReached} onClick={openNew}><Plus />Novo prêmio</Button>
    {!data.rewards.length ? <Empty>Nenhum prêmio cadastrado ainda.</Empty> : <ul className="space-y-3">
      {data.rewards.map((r) => {
        const ret = !calc ? null : rewardReturn(r.cost_reais, r.cost_points, data.company.points_per_real);
        return <li key={r.id} className={`rounded-3xl border border-border bg-card p-4 ${r.active ? "" : "opacity-70"}`}>
          <div className="flex items-start gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cream text-primary"><Gift className="h-6 w-6" /></span><div className="min-w-0 flex-1"><h2 className="break-words font-extrabold">{r.name}</h2><p className="text-sm text-muted-foreground">{r.cost_points.toLocaleString("pt-BR")} pontos · {r.cost_reais === null ? "Custo não informado" : money(r.cost_reais)}</p></div><Button variant="outline" className="h-12 shrink-0 rounded-2xl" aria-label={`Editar ${r.name}`} onClick={() => openEdit(r)}><Pencil />Editar</Button></div>
          {calc && <div className="mt-3 flex flex-wrap items-center gap-2"><span className="text-sm font-semibold">Retorno <strong className="text-base font-extrabold">{ret ? `${(ret.ratio * 100).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%` : "—"}</strong></span>{ret && <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${ret.label === "Alto" ? "bg-cream" : ret.label === "Bom" ? "bg-secondary text-primary" : "bg-muted"}`}>{ret.label}</span>}</div>}
          {ret?.label === "Alto" && <p className="mt-2 flex items-center gap-2 text-sm font-semibold"><AlertTriangle className="h-4 w-4 shrink-0 text-primary" />Pode pesar no seu caixa.</p>}
          <label className="mt-3 flex min-h-12 cursor-pointer items-center justify-between border-t border-border pt-2 text-sm font-bold"><span>{r.active ? "Ativo" : "Desativado"}</span><span className="flex min-h-12 min-w-12 items-center justify-end"><Switch aria-label={`Ativar ${r.name}`} checked={r.active} disabled={toggleMutation.isPending} onCheckedChange={(active) => toggleMutation.mutate({ rewardId: r.id, active })} /></span></label>
        </li>;
      })}
    </ul>}
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-w-sm rounded-3xl"><DialogTitle className="text-xl font-extrabold">{editing ? "Editar prêmio" : "Novo prêmio"}</DialogTitle><DialogDescription>Um motivo a mais para voltar.</DialogDescription>
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setFormError(null); const parsed = rewardSchema.safeParse({ name: form.name, costReais: form.costReais ? parseReais(form.costReais) : NaN, costPoints: Number(form.costPoints) }); if (!parsed.success) { setFormError(parsed.error.issues[0]?.message ?? "Confira os custos do prêmio."); return; } createMutation.mutate(parsed.data); }}>
        <label className="block text-sm font-bold">Nome do prêmio<Input autoFocus maxLength={100} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-2 h-12 rounded-2xl" /></label>
        <label className="block text-sm font-bold">Custo em reais<Input inputMode="decimal" placeholder="0,00" value={form.costReais} onChange={(e) => { const costReais = maskReais(e.target.value); const sug = !calc ? null : suggestPoints(costReais ? parseReais(costReais) : 0, rateNow); setForm({ ...form, costReais, costPoints: pointsTouched ? form.costPoints : sug ? String(sug) : "" }); }} className="mt-2 h-12 rounded-2xl" /></label>
        <label className="block text-sm font-bold">Custo em pontos<Input inputMode="numeric" maxLength={9} value={form.costPoints} onChange={(e) => { setPointsTouched(true); setForm({ ...form, costPoints: e.target.value.replace(/\D/g, "") }); }} className="mt-2 h-12 rounded-2xl" /></label>
        {suggestion && <div className="rounded-2xl bg-secondary p-3 text-sm"><p className="flex items-center gap-2 font-bold"><Sparkles className="h-4 w-4 text-primary" />Sugestão: {suggestion.toLocaleString("pt-BR")} pontos (retorno de {HEALTHY_RETURN * 100}%)</p>{String(suggestion) !== form.costPoints && <Button type="button" variant="secondary" className="mt-2 h-12 rounded-2xl" onClick={() => { setPointsTouched(false); setForm({ ...form, costPoints: String(suggestion) }); }}>Usar sugestão</Button>}</div>}
        {formReturn && <p className="text-sm font-semibold">Retorno deste prêmio: {(formReturn.ratio * 100).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}% · {formReturn.label}</p>}
        {formError && <p role="alert" className="rounded-2xl bg-cream p-3 text-sm font-semibold">{formError}</p>}
        <Button type="submit" variant="hero" size="xl" disabled={createMutation.isPending}><Plus />{createMutation.isPending ? "Salvando…" : editing ? "Salvar alterações" : "Criar prêmio"}</Button>
      </form>
    </DialogContent></Dialog>
  </div>;
}
