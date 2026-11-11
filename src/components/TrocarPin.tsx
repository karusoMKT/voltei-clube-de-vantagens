import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const inputCls =
  "h-14 w-full rounded-2xl border border-border bg-card px-4 text-base tracking-[0.5em] text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/15";

export function TrocarPin() {
  const [pin, setPin] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{6}$/.test(pin)) return setMsg({ ok: false, text: "O PIN precisa ter 6 números." });
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pin });
    setLoading(false);
    setPin("");
    setMsg(error ? { ok: false, text: "Não deu para trocar agora. Tente de novo em instantes." } : { ok: true, text: "PIN trocado! Use o novo na próxima entrada." });
  }

  return (
    <form onSubmit={salvar} className="mx-5 mt-6 flex flex-col gap-3 rounded-3xl border border-border bg-card p-5">
      <label className="block">
        <span className="mb-1.5 block text-sm font-bold text-foreground">Novo PIN de 6 números</span>
        <input className={inputCls} type="password" inputMode="numeric" maxLength={6} autoComplete="new-password"
          value={pin} onChange={(e) => { setPin(e.target.value.replace(/\D/g, "").slice(0, 6)); setMsg(null); }} placeholder="••••••" />
      </label>
      {msg && <p role="status" className={`text-sm font-semibold ${msg.ok ? "text-primary" : "text-destructive"}`}>{msg.text}</p>}
      <Button type="submit" variant="hero" size="xl" disabled={loading}>{loading ? "Só um instante…" : "Trocar PIN"}</Button>
    </form>
  );
}
