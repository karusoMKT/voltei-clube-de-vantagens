import { useState } from "react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, UserPlus, LogOut } from "lucide-react";
import { PageTitle } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loading, Empty } from "@/components/Empty";
import { supabase } from "@/integrations/supabase/client";
import { getSessionInfo, homeFor } from "@/lib/session";
import { maskPhone } from "@/lib/cadastro";
import { PLANS, type PlanId, planLabel, mrr, brl, companySchema, ownerSchema } from "@/lib/plans";
import { listCompanies, createCompany, createOwner } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: async () => {
    const info = await getSessionInfo();
    if (!info) throw redirect({ to: "/entrar" });
    if (info.role !== "admin") throw redirect({ to: homeFor(info.role) });
  },
  head: () => ({
    meta: [
      { title: "Administração · Voltei" },
      { name: "description", content: "Área do dono da plataforma Voltei." },
      { property: "og:title", content: "Administração · Voltei" },
      { property: "og:description", content: "Área do dono da plataforma Voltei." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Admin,
});

type Company = { id: string; name: string; slug: string; plan: string; active: boolean; monthly_fee: number; hasOwner: boolean };

function Admin() {
  const fetchCompanies = useServerFn(listCompanies);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data, isPending, error } = useQuery({ queryKey: ["admin", "companies"], queryFn: () => fetchCompanies() });
  const [newOpen, setNewOpen] = useState(false);
  const [ownerFor, setOwnerFor] = useState<Company | null>(null);

  async function sair() {
    await qc.cancelQueries(); qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/entrar", replace: true });
  }

  return (
    <div className="mx-auto min-h-screen max-w-md pb-10">
      <PageTitle title="Administração" />
      <div className="space-y-5 px-5">
        {isPending ? <Loading /> : error || !data ? <div role="alert">{error?.message ?? "Erro ao carregar."}</div> : <>
          <section className="rounded-3xl bg-primary p-5 text-primary-foreground">
            <p className="text-sm font-bold opacity-90">MRR total</p>
            <p className="text-4xl font-extrabold">{brl(mrr(data))}</p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {(Object.keys(PLANS) as PlanId[]).map((p) => (
                <div key={p} className="rounded-2xl bg-primary-foreground/15 p-3 text-center">
                  <p className="text-2xl font-extrabold">{data.filter((c) => c.active && c.plan === p).length}</p>
                  <p className="text-xs font-bold">{PLANS[p].label}</p>
                </div>
              ))}
            </div>
          </section>
          <Button size="xl" className="w-full rounded-2xl" onClick={() => setNewOpen(true)}><Plus />Nova empresa</Button>
          {!data.length ? <Empty>Nenhuma empresa ainda.</Empty> : <ul className="space-y-3">{data.map((c) => (
            <li key={c.id} className="rounded-3xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0"><h3 className="break-words text-lg font-extrabold">{c.name}</h3><p className="text-sm text-muted-foreground">/{c.slug}</p></div>
                <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-extrabold ${c.active ? "bg-accent text-primary" : "bg-muted text-muted-foreground"}`}>{c.active ? "Ativa" : "Inativa"}</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-sm"><span className="rounded-full bg-secondary px-3 py-1 font-bold">{planLabel(c.plan)}</span><span className="font-extrabold">{brl(c.monthly_fee)}/mês</span></div>
              {c.hasOwner ? <p className="mt-3 text-sm text-muted-foreground">Dono já tem acesso.</p>
                : <Button variant="secondary" size="xl" className="mt-3 w-full rounded-2xl" onClick={() => setOwnerFor(c)}><UserPlus />Criar acesso do dono</Button>}
            </li>
          ))}</ul>}
        </>}
        <Button variant="ghost" size="xl" className="w-full rounded-2xl" onClick={sair}><LogOut />Sair</Button>
      </div>
      <NovaEmpresa open={newOpen} onOpenChange={setNewOpen} />
      <CriarDono company={ownerFor} onClose={() => setOwnerFor(null)} />
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string | undefined; children: React.ReactNode }) {
  return <div className="space-y-1"><Label className="font-bold">{label}</Label>{children}{error && <p className="text-sm text-destructive">{error}</p>}</div>;
}

function NovaEmpresa({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const qc = useQueryClient();
  const save = useServerFn(createCompany);
  const [form, setForm] = useState({ name: "", slug: "", plan: "basic" as PlanId, monthlyFee: String(PLANS.basic.fee) });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const m = useMutation({
    mutationFn: (input: unknown) => save({ data: input }),
    onSuccess: (r) => {
      if (!r.ok) { toast.error(r.message); return; }
      toast.success(r.message);
      qc.invalidateQueries({ queryKey: ["admin"] });
      setForm({ name: "", slug: "", plan: "basic", monthlyFee: String(PLANS.basic.fee) });
      onOpenChange(false);
    },
    onError: () => toast.error("Não conseguimos criar a empresa."),
  });
  function submit(e: React.FormEvent) {
    e.preventDefault();
    const r = companySchema.safeParse({ ...form, monthlyFee: form.monthlyFee.replace(",", ".") });
    if (!r.success) { setErrors(Object.fromEntries(r.error.issues.map((i) => [String(i.path[0]), i.message]))); return; }
    setErrors({}); m.mutate(r.data);
  }
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="rounded-3xl"><DialogHeader><DialogTitle>Nova empresa</DialogTitle></DialogHeader>
    <form onSubmit={submit} className="space-y-4">
      <Field label="Nome" error={errors["name"]}><Input className="h-12 rounded-2xl" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
      <Field label="Endereço (slug)" error={errors["slug"]}><Input className="h-12 rounded-2xl" placeholder="minha-loja" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase() })} /></Field>
      <Field label="Plano">
        <div className="grid gap-2">{(Object.keys(PLANS) as PlanId[]).map((p) => (
          <button type="button" key={p} onClick={() => setForm({ ...form, plan: p, monthlyFee: String(PLANS[p].fee) })}
            className={`rounded-2xl border p-3 text-left ${form.plan === p ? "border-primary bg-accent" : "border-border bg-card"}`}>
            <span className="font-extrabold">{PLANS[p].label} · {brl(PLANS[p].fee)}</span><span className="block text-xs text-muted-foreground">{PLANS[p].features}</span>
          </button>))}</div>
      </Field>
      <Field label="Mensalidade (R$)" error={errors["monthlyFee"]}><Input className="h-12 rounded-2xl" inputMode="decimal" value={form.monthlyFee} onChange={(e) => setForm({ ...form, monthlyFee: e.target.value })} /></Field>
      <Button type="submit" size="xl" className="w-full rounded-2xl" disabled={m.isPending}>{m.isPending ? "Criando..." : "Criar empresa"}</Button>
    </form></DialogContent></Dialog>;
}

function CriarDono({ company, onClose }: { company: Company | null; onClose: () => void }) {
  const qc = useQueryClient();
  const save = useServerFn(createOwner);
  const [form, setForm] = useState({ fullName: "", phone: "", pin: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const m = useMutation({
    mutationFn: (input: unknown) => save({ data: input }),
    onSuccess: (r) => {
      if (!r.ok) { toast.error(r.message); return; }
      toast.success(r.message);
      qc.invalidateQueries({ queryKey: ["admin"] });
      setForm({ fullName: "", phone: "", pin: "" }); onClose();
    },
    onError: () => toast.error("Não conseguimos criar o acesso."),
  });
  function submit(e: React.FormEvent) {
    e.preventDefault();
    const r = ownerSchema.safeParse({ ...form, companyId: company?.id });
    if (!r.success) { setErrors(Object.fromEntries(r.error.issues.map((i) => [String(i.path[0]), i.message]))); return; }
    setErrors({}); m.mutate({ ...form, companyId: company?.id });
  }
  return <Dialog open={!!company} onOpenChange={(o) => !o && onClose()}><DialogContent className="rounded-3xl"><DialogHeader><DialogTitle>Acesso do dono · {company?.name}</DialogTitle></DialogHeader>
    <form onSubmit={submit} className="space-y-4">
      <Field label="Nome" error={errors["fullName"]}><Input className="h-12 rounded-2xl" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></Field>
      <Field label="WhatsApp" error={errors["phone"]}><Input className="h-12 rounded-2xl" inputMode="tel" placeholder="(73) 9 0000-0000" value={form.phone} onChange={(e) => setForm({ ...form, phone: maskPhone(e.target.value) })} /></Field>
      <Field label="PIN provisório (6 números)" error={errors["pin"]}><Input className="h-12 rounded-2xl" inputMode="numeric" maxLength={6} value={form.pin} onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, "").slice(0, 6) })} /></Field>
      <Button type="submit" size="xl" className="w-full rounded-2xl" disabled={m.isPending}>{m.isPending ? "Criando..." : "Criar acesso"}</Button>
    </form></DialogContent></Dialog>;
}
