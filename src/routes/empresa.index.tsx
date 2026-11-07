import { lazy, Suspense, useCallback, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { maskPhone, onlyDigits } from "@/lib/cadastro";
import { maskReais, parseReais, pontosDaCompra } from "@/lib/caixa";

const QrScanner = lazy(() => import("@/components/QrScanner").then((m) => ({ default: m.QrScanner })));

export const Route = createFileRoute("/empresa/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Caixa · Voltei" },
      { name: "description", content: "Lance compras e dê pontos aos clientes." },
      { property: "og:title", content: "Caixa · Voltei" },
      { property: "og:description", content: "Lance compras e dê pontos aos clientes." },
    ],
  }),
  component: Caixa,
});

type Cliente = { id: string; full_name: string | null; instagram: string | null; points_balance: number };

const inputCls =
  "h-14 w-full rounded-2xl border border-border bg-card px-4 text-lg text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-primary focus:ring-4 focus:ring-primary/15";

function Caixa() {
  const { companyId } = Route.useRouteContext();
  const [modo, setModo] = useState<"qr" | "telefone">("qr");
  const [telefone, setTelefone] = useState("");
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [valor, setValor] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const { data: company } = useQuery({
    queryKey: ["empresa", "company", companyId],
    queryFn: async () => {
      const { data, error } = await supabase.from("companies").select("name, points_per_real").eq("id", companyId).single();
      if (error) throw error;
      return data;
    },
  });

  const reset = () => { setCliente(null); setValor(""); setErro(null); setTelefone(""); };

  const buscarTelefone = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("buscar_cliente_por_telefone", { _company_id: companyId, _telefone: onlyDigits(telefone) });
      if (error) throw new Error(error.message);
      const c = (data as Cliente[])[0];
      if (!c) throw new Error("Não achamos esse cliente no clube.");
      return c;
    },
    onSuccess: (c) => { setErro(null); setSucesso(null); setCliente(c); },
    onError: (e) => setErro(e.message),
  });

  const buscarQr = useMutation({
    mutationFn: async (token: string) => {
      const { data, error } = await supabase.from("profiles")
        .select("id, full_name, instagram, memberships!inner(points_balance, company_id)")
        .eq("qr_token", token.trim()).eq("memberships.company_id", companyId).maybeSingle();
      if (error || !data) throw new Error("Não achamos esse cliente no clube.");
      return { id: data.id, full_name: data.full_name, instagram: data.instagram, points_balance: data.memberships[0]?.points_balance ?? 0 };
    },
    onSuccess: (c) => { setErro(null); setSucesso(null); setCliente(c); },
    onError: (e) => setErro(e.message),
  });
  const onScan = useCallback((t: string) => buscarQr.mutate(t), [buscarQr.mutate]);

  const valorNum = parseReais(valor);
  const pts = pontosDaCompra(valorNum, Number(company?.points_per_real ?? 1));
  const primeiroNome = (cliente?.full_name ?? "Cliente").split(" ")[0];

  const confirmar = useMutation({
    mutationFn: async () => {
      if (!cliente) throw new Error("Busque o cliente primeiro.");
      if (valorNum <= 0) throw new Error("Digite o valor da compra.");
      const { data, error } = await supabase.rpc("lancar_compra", { _company_id: companyId, _customer_id: cliente.id, _valor_em_reais: valorNum });
      if (error) throw new Error(error.message);
      return data as number;
    },
    onSuccess: (saldo) => {
      setSucesso(`Pronto! ${primeiroNome} ganhou ${pts} pontos e agora tem ${saldo}.`);
      reset();
    },
    onError: (e) => setErro(e.message),
  });

  return (
    <div className="space-y-5 px-5 pt-6">
      <div>
        <h1 className="text-3xl font-extrabold text-foreground">Caixa</h1>
        {company && <p className="mt-1 text-muted-foreground">{company.name}</p>}
      </div>

      {sucesso && (
        <div role="status" className="flex items-start gap-3 rounded-3xl bg-secondary px-5 py-4 text-secondary-foreground">
          <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-primary" />
          <p className="font-bold">{sucesso}</p>
        </div>
      )}

      {!cliente ? (
        <>
          <div role="tablist" className="grid grid-cols-2 gap-1 rounded-2xl bg-secondary p-1">
            {(["qr", "telefone"] as const).map((m) => (
              <button key={m} role="tab" aria-selected={modo === m} type="button"
                onClick={() => { setModo(m); setErro(null); }}
                className={`min-h-12 rounded-xl font-extrabold transition-colors ${modo === m ? "bg-card text-primary shadow-sm" : "text-muted-foreground"}`}>
                {m === "qr" ? "QR code" : "Telefone"}
              </button>
            ))}
          </div>

          {modo === "qr" ? (
            <div className="space-y-3">
              <Suspense fallback={<div className="aspect-square w-full animate-pulse rounded-3xl bg-secondary" />}>
                <QrScanner onScan={onScan} />
              </Suspense>
              <p className="text-center text-sm text-muted-foreground">
                {buscarQr.isPending ? "Procurando cliente…" : "Aponte para o QR no celular do cliente."}
              </p>
            </div>
          ) : (
            <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); setErro(null);
              if (onlyDigits(telefone).length !== 11) return setErro("Confira o WhatsApp com DDD, assim: (73) 9 0000-0000.");
              buscarTelefone.mutate(); }}>
              <label className="block">
                <span className="mb-1.5 block text-sm font-bold text-foreground">WhatsApp do cliente</span>
                <input className={inputCls} inputMode="numeric" value={telefone} placeholder="(DD) 9 0000-0000"
                  onChange={(e) => { setTelefone(maskPhone(e.target.value)); setErro(null); }} />
              </label>
              <Button type="submit" variant="hero" size="xl" disabled={buscarTelefone.isPending}>
                {buscarTelefone.isPending ? "Buscando…" : "Buscar"}
              </Button>
            </form>
          )}
        </>
      ) : (
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-3 rounded-3xl border border-border bg-card p-5">
            <div className="min-w-0">
              <p className="truncate text-xl font-extrabold text-foreground">{cliente.full_name}</p>
              <p className="text-muted-foreground">{cliente.instagram} · {cliente.points_balance} pontos</p>
            </div>
            <span className="shrink-0 rounded-full bg-secondary px-3 py-1 text-sm font-extrabold text-primary">Encontrada</span>
          </div>

          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setErro(null); confirmar.mutate(); }}>
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-foreground">Valor da compra</span>
              <div className="flex h-20 items-center rounded-3xl border border-border bg-card px-5 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/15">
                <span className="mr-2 text-2xl font-extrabold text-muted-foreground">R$</span>
                <input autoFocus inputMode="numeric" value={valor} placeholder="0,00"
                  onChange={(e) => { setValor(maskReais(e.target.value)); setErro(null); }}
                  className="w-full bg-transparent text-4xl font-extrabold text-foreground outline-none placeholder:text-muted-foreground/40" />
              </div>
            </label>
            {valorNum > 0 && (
              <p className="rounded-2xl bg-cream px-4 py-3 font-bold text-foreground">
                {primeiroNome} ganha {pts} pontos e fica com {cliente.points_balance + pts}.
              </p>
            )}
            <Button type="submit" variant="hero" size="xl" disabled={confirmar.isPending}>
              {confirmar.isPending ? "Lançando…" : "Confirmar compra"}
            </Button>
            <Button type="button" variant="ghost" className="h-12 w-full rounded-2xl font-bold" onClick={reset}>
              Trocar cliente
            </Button>
          </form>
        </div>
      )}

      {erro && <p role="alert" className="rounded-2xl bg-cream px-4 py-3 text-sm font-semibold text-foreground">{erro}</p>}
    </div>
  );
}
