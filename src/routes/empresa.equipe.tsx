import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Empty, Loading } from "@/components/Empty";
import { maskPhone } from "@/lib/cadastro";
import { staffSchema } from "@/lib/plans";
import { listStaff, createStaff } from "@/lib/team.functions";

export const Route = createFileRoute("/empresa/equipe")({
  head: () => ({
    meta: [
      { title: "Equipe · Voltei" },
      { name: "description", content: "Cadastre os atendentes de caixa da sua loja." },
      { property: "og:title", content: "Equipe · Voltei" },
      { property: "og:description", content: "Cadastre os atendentes de caixa da sua loja." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Equipe,
});

function Equipe() {
  const fetchStaff = useServerFn(listStaff);
  const { data, isPending, error } = useQuery({ queryKey: ["empresa", "equipe"], queryFn: () => fetchStaff() });
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-5 px-5 pt-6">
      <div>
        <h1 className="text-3xl font-extrabold text-foreground">Equipe</h1>
        <p className="mt-1 text-muted-foreground">Atendentes que usam o caixa da loja.</p>
      </div>
      <Button size="xl" className="w-full rounded-2xl" onClick={() => setOpen(true)}><UserPlus />Novo atendente</Button>
      {isPending ? <Loading /> : error || !data ? <p role="alert">{error?.message ?? "Erro ao carregar."}</p>
        : !data.length ? <Empty>Nenhum atendente ainda.</Empty>
        : <ul className="space-y-3">{data.map((s) => (
            <li key={s.id} className="rounded-3xl border border-border bg-card p-4">
              <p className="break-words text-lg font-extrabold text-foreground">{s.name}</p>
              <p className="text-sm text-muted-foreground">{maskPhone(s.phone)}</p>
            </li>))}</ul>}
      <NovoAtendente open={open} onOpenChange={setOpen} />
    </div>
  );
}

function NovoAtendente({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const qc = useQueryClient();
  const save = useServerFn(createStaff);
  const [form, setForm] = useState({ fullName: "", phone: "", pin: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const m = useMutation({
    mutationFn: (input: unknown) => save({ data: input }),
    onSuccess: (r) => {
      if (!r.ok) { toast.error(r.message); return; }
      toast.success(r.message);
      qc.invalidateQueries({ queryKey: ["empresa", "equipe"] });
      setForm({ fullName: "", phone: "", pin: "" }); onOpenChange(false);
    },
    onError: (e) => toast.error(e.message || "Não conseguimos criar o atendente."),
  });
  function submit(e: React.FormEvent) {
    e.preventDefault();
    const r = staffSchema.safeParse(form);
    if (!r.success) { setErrors(Object.fromEntries(r.error.issues.map((i) => [String(i.path[0]), i.message]))); return; }
    setErrors({}); m.mutate(form);
  }
  const field = (label: string, key: keyof typeof form, input: React.ReactNode) => (
    <div className="space-y-1"><Label className="font-bold">{label}</Label>{input}{errors[key] && <p className="text-sm text-destructive">{errors[key]}</p>}</div>
  );
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="rounded-3xl"><DialogHeader><DialogTitle>Novo atendente</DialogTitle></DialogHeader>
    <form onSubmit={submit} className="space-y-4">
      {field("Nome", "fullName", <Input className="h-12 rounded-2xl" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />)}
      {field("WhatsApp", "phone", <Input className="h-12 rounded-2xl" inputMode="tel" placeholder="(73) 9 0000-0000" value={form.phone} onChange={(e) => setForm({ ...form, phone: maskPhone(e.target.value) })} />)}
      {field("PIN (6 números)", "pin", <Input className="h-12 rounded-2xl" inputMode="numeric" maxLength={6} value={form.pin} onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, "").slice(0, 6) })} />)}
      <Button type="submit" size="xl" className="w-full rounded-2xl" disabled={m.isPending}>{m.isPending ? "Criando..." : "Criar acesso"}</Button>
    </form></DialogContent></Dialog>;
}
