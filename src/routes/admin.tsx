import { CompanyLogo } from "@/components/CompanyLogo";
import { CompanyLogoInput } from "@/components/CompanyLogoInput";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, UserPlus, MessageCircle, Pencil, Trash2 } from "lucide-react";
import { AreaHeader, PageTitle } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loading, Empty } from "@/components/Empty";
import { signOutAndLeave } from "@/lib/logout";
import { getSessionInfo, homeFor } from "@/lib/session";
import { maskPhone, accessWhatsappLink } from "@/lib/cadastro";
import { PLANS, type PlanId, planLabel, mrr, brl, companySchema, ownerSchema, slugTyping } from "@/lib/plans";
import { listCompanies, createCompany, createOwner, updateCompany, uploadCompanyLogo, deleteCompany } from "@/lib/admin.functions";

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

type Company = { id: string; name: string; slug: string; plan: string; active: boolean; monthly_fee: number; hasOwner: boolean; logo_url: string | null; city: string | null };

function Admin() {
  const fetchCompanies = useServerFn(listCompanies);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data, isPending, error } = useQuery({ queryKey: ["admin", "companies"], queryFn: () => fetchCompanies() });
  const [editing, setEditing] = useState<Company | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [ownerFor, setOwnerFor] = useState<Company | null>(null);
  const [removing, setRemoving] = useState<Company | null>(null);
  const removeFn = useServerFn(deleteCompany);
  const removal = useMutation({
    mutationFn: (id: string) => removeFn({ data: { id } }),
    onSuccess: () => { toast.success("Empresa excluída."); setRemoving(null); qc.invalidateQueries({ queryKey: ["admin", "companies"] }); },
    onError: (e: Error) => toast.error(e.message || "Não conseguimos excluir agora."),
  });

  return (
    <div className="mx-auto min-h-screen max-w-md pb-10">
      <AreaHeader area="Admin" onSignOut={() => signOutAndLeave({ queryClient: qc, navigate })} />
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
                <CompanyLogo name={c.name} url={c.logo_url} /><div className="min-w-0 flex-1"><h3 className="break-words text-lg font-extrabold">{c.name}</h3><p className="text-sm text-muted-foreground">/{c.slug}</p><p className="text-sm text-muted-foreground">{c.city}</p></div>
                <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-extrabold ${c.active ? "bg-accent text-primary" : "bg-muted text-muted-foreground"}`}>{c.active ? "Ativa" : "Inativa"}</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-sm"><span className="rounded-full bg-secondary px-3 py-1 font-bold">{planLabel(c.plan)}</span><span className="font-extrabold">{brl(c.monthly_fee)}/mês</span></div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button variant="outline" size="xl" className="rounded-2xl" onClick={() => setEditing(c)} aria-label={`Editar ${c.name}`}><Pencil />Editar</Button>
                <Button variant="outline" size="xl" className="rounded-2xl border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setRemoving(c)} aria-label={`Excluir ${c.name}`}><Trash2 />Excluir</Button>
              </div>
              {c.hasOwner ? <p className="mt-3 text-sm text-muted-foreground">Dono já tem acesso.</p>
                : <Button variant="secondary" size="xl" className="mt-3 w-full rounded-2xl" onClick={() => setOwnerFor(c)}><UserPlus />Criar acesso do dono</Button>}
            </li>
          ))}</ul>}
        </>}
      </div>
      {editing && <EditarEmpresa key={editing.id} company={editing} onClose={() => setEditing(null)} />}
      <AlertDialog open={!!removing} onOpenChange={(o) => { if (!o && !removal.isPending) setRemoving(null); }}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {removing?.name}?</AlertDialogTitle>
            <AlertDialogDescription>Isso apaga a loja, seus prêmios, membros, pontos e resgates, e tira o acesso do dono e dos caixas. Não dá para desfazer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-12 rounded-2xl" disabled={removal.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="min-h-12 rounded-2xl bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={removal.isPending} onClick={(e) => { e.preventDefault(); if (removing) removal.mutate(removing.id); }}>{removal.isPending ? "Excluindo..." : "Excluir empresa"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
  const saveOwner = useServerFn(createOwner);
  const uploadLogo = useServerFn(uploadCompanyLogo);
  const update = useServerFn(updateCompany);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const blank = { city: "", name: "", slug: "", plan: "basic" as PlanId, monthlyFee: String(PLANS.basic.fee), fullName: "", phone: "", pin: "" };
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [link, setLink] = useState<string | null>(null);
  const m = useMutation({
    mutationFn: async (input: { company: unknown; owner: { fullName: string; phone: string; pin: string } }) => {
      const c = await save({ data: input.company });
      if (!c.ok || !c.id) return { ok: false, message: c.message };
      try {
        let logoUrl: string | null = null;
        if (logoFile) { const payload = new FormData(); payload.set("companyId", c.id); payload.set("file", logoFile); logoUrl = await uploadLogo({ data: payload }); }
        await update({ data: { ...companySchema.parse(input.company), id: c.id, active: true, logoUrl } });
      } catch (e) { toast.error(`Loja criada, mas cidade/logo não foram salvas: ${e instanceof Error ? e.message : "Tente editar a empresa."}`); }
      const o = await saveOwner({ data: { ...input.owner, companyId: c.id } });
      return o.ok ? { ok: true, message: "Loja e acesso do dono criados!" } : { ok: false, message: `Loja criada, mas o acesso do dono falhou: ${o.message}` };
    },
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["admin"] });
      if (!r.ok) { toast.error(r.message); return; }
      toast.success(r.message);
      setLink(accessWhatsappLink(form.phone, form.fullName, form.name, form.pin, window.location.origin));
    },
    onError: () => toast.error("Não conseguimos criar a empresa."),
  });
  function close(o: boolean) { if (!o) { setForm(blank); setLogoFile(null); setLink(null); setErrors({}); } onOpenChange(o); }
  function submit(e: React.FormEvent) {
    e.preventDefault();
    const c = companySchema.safeParse({ city: form.city, name: form.name, slug: form.slug, plan: form.plan, monthlyFee: form.monthlyFee.replace(",", ".") });
    const o = ownerSchema.safeParse({ fullName: form.fullName, phone: form.phone, pin: form.pin, companyId: "00000000-0000-4000-8000-000000000000" });
    const issues = [...(c.success ? [] : c.error.issues), ...(o.success ? [] : o.error.issues)];
    if (!c.success || issues.length) { setErrors(Object.fromEntries(issues.map((i) => [String(i.path[0]), i.message]))); return; }
    setErrors({}); m.mutate({ company: c.data, owner: { fullName: form.fullName, phone: form.phone, pin: form.pin } });
  }
  return <Dialog open={open} onOpenChange={close}><DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl"><DialogHeader><DialogTitle>Nova empresa</DialogTitle></DialogHeader>
    {link ? <div className="space-y-4">
      <p className="text-base">Tudo pronto! Envie o acesso para o dono da <b>{form.name}</b>.</p>
      <Button asChild size="xl" className="w-full rounded-2xl"><a href={link} target="_blank" rel="noreferrer"><MessageCircle />Enviar Acesso via WhatsApp</a></Button>
      <Button variant="ghost" size="xl" className="w-full rounded-2xl" onClick={() => close(false)}>Fechar</Button>
    </div> :
    <form onSubmit={submit} className="space-y-4">
      <Field label="Nome da loja" error={errors["name"]}><Input className="h-12 rounded-2xl" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
      <Field label="Endereço (slug)" error={errors["slug"]}><Input className="h-12 rounded-2xl" placeholder="minha-loja" value={form.slug} onChange={(e) => setForm({ ...form, slug: slugTyping(e.target.value) })} /></Field>
      <CompanyLogoInput file={logoFile} onChange={setLogoFile} />
      <Field label="Cidade" error={errors["city"]}><Input className="h-12 rounded-2xl" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Field>
      <Field label="Plano">
        <div className="grid gap-2">{(Object.keys(PLANS) as PlanId[]).map((p) => (
          <Button variant="outline" type="button" key={p} onClick={() => setForm({ ...form, plan: p, monthlyFee: String(PLANS[p].fee) })}
            className={`h-auto flex-col items-start whitespace-normal rounded-2xl border p-3 text-left ${form.plan === p ? "border-primary bg-accent" : "border-border bg-card"}`}>
            <span className="font-extrabold">{PLANS[p].label} · {brl(PLANS[p].fee)}</span><span className="block text-xs text-muted-foreground">{PLANS[p].features}</span>
          </Button>))}</div>
      </Field>
      <Field label="Mensalidade (R$)" error={errors["monthlyFee"]}><Input className="h-12 rounded-2xl" inputMode="decimal" value={form.monthlyFee} onChange={(e) => setForm({ ...form, monthlyFee: e.target.value })} /></Field>
      <p className="pt-2 font-extrabold">Dono da loja</p>
      <Field label="Nome do dono" error={errors["fullName"]}><Input className="h-12 rounded-2xl" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></Field>
      <Field label="WhatsApp" error={errors["phone"]}><Input className="h-12 rounded-2xl" inputMode="tel" placeholder="(73) 9 0000-0000" value={form.phone} onChange={(e) => setForm({ ...form, phone: maskPhone(e.target.value) })} /></Field>
      <Field label="PIN provisório (6 números)" error={errors["pin"]}><Input className="h-12 rounded-2xl" inputMode="numeric" maxLength={6} value={form.pin} onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, "").slice(0, 6) })} /></Field>
      <Button type="submit" size="xl" className="w-full rounded-2xl" disabled={m.isPending}>{m.isPending ? "Criando..." : "Criar loja e acesso"}</Button>
    </form>}</DialogContent></Dialog>;
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

function EditarEmpresa({ company, onClose }: { company: Company; onClose: () => void }) {
  const qc = useQueryClient();
  const save = useServerFn(updateCompany);
  const upload = useServerFn(uploadCompanyLogo);
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({ name: company.name, slug: company.slug, city: company.city ?? "", plan: company.plan as PlanId, monthlyFee: String(company.monthly_fee), active: company.active });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const mutation = useMutation({ mutationFn: async () => {
    const parsed = companySchema.parse({ ...form, monthlyFee: form.monthlyFee.replace(",", ".") });
    let logoUrl = company.logo_url;
    if (file) { const payload = new FormData(); payload.set("companyId", company.id); payload.set("file", file); logoUrl = await upload({ data: payload }); }
    await save({ data: { ...parsed, id: company.id, active: form.active, logoUrl } });
  }, onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin"] }); qc.invalidateQueries({ queryKey: ["cliente"] }); toast.success("Empresa atualizada!"); onClose(); }, onError: (e) => toast.error(e.message) });
  function submit(e: React.FormEvent) { e.preventDefault(); const parsed = companySchema.safeParse({ ...form, monthlyFee: form.monthlyFee.replace(",", ".") }); if (!parsed.success) { setErrors(Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message]))); return; } setErrors({}); mutation.mutate(); }
  return <Dialog open onOpenChange={(open) => { if (!open && !mutation.isPending) onClose(); }}><DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl"><DialogHeader><DialogTitle>Editar empresa</DialogTitle></DialogHeader>
    <form onSubmit={submit} className="space-y-4">
      <CompanyLogoInput file={file} onChange={setFile} url={company.logo_url} />
      <Field label="Nome da loja" error={errors["name"]}><Input aria-label="Nome da loja" className="h-12 rounded-2xl" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
      <Field label="Endereço (slug)" error={errors["slug"]}><Input className="h-12 rounded-2xl" value={form.slug} onChange={(e) => setForm({ ...form, slug: slugTyping(e.target.value) })} /></Field>
      <Field label="Cidade" error={errors["city"]}><Input aria-label="Cidade" className="h-12 rounded-2xl" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Field>
      <Field label="Plano"><select className="h-12 w-full rounded-2xl border border-border bg-card px-3" value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value as PlanId })}>{(Object.keys(PLANS) as PlanId[]).map((p) => <option key={p} value={p}>{PLANS[p].label}</option>)}</select></Field>
      <Field label="Mensalidade (R$)" error={errors["monthlyFee"]}><Input className="h-12 rounded-2xl" inputMode="decimal" value={form.monthlyFee} onChange={(e) => setForm({ ...form, monthlyFee: e.target.value })} /></Field>
      <div className="flex min-h-12 items-center justify-between"><Label htmlFor="company-active">Empresa ativa</Label><Switch id="company-active" checked={form.active} onCheckedChange={(active) => setForm({ ...form, active })} /></div>
      <Button type="submit" size="xl" className="w-full rounded-2xl" disabled={mutation.isPending}>{mutation.isPending ? "Salvando…" : "Salvar alterações"}</Button>
    </form>
  </DialogContent></Dialog>;
}
