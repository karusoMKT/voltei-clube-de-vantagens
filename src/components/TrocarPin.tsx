import { useState } from "react";
import { toast } from "sonner";
import { changePin, changePinSchema } from "@/lib/pin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function TrocarPin() {
  const [form, setForm] = useState({ currentPin: "", newPin: "", confirmation: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    const parsed = changePinSchema.safeParse(form);
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message])));
      toast.error(parsed.error.issues[0]?.message ?? "Confira os PINs.");
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await changePin(parsed.data);
      setForm({ currentPin: "", newPin: "", confirmation: "" });
      toast.success("PIN trocado! Use o novo na próxima entrada.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não conseguimos trocar o PIN."); }
    finally { setLoading(false); }
  }

  return (
    <form onSubmit={salvar} className="flex flex-col gap-4">
      {([
        ["currentPin", "PIN atual", "current-password"],
        ["newPin", "Novo PIN de 6 números", "new-password"],
        ["confirmation", "Confirme o novo PIN", "new-password"],
      ] as const).map(([key, label, autoComplete]) => <div key={key} className="space-y-2">
        <Label htmlFor={`change-${key}`} className="font-bold">{label}</Label>
        <Input id={`change-${key}`} className="h-14 rounded-2xl" type="password" inputMode="numeric" maxLength={6} autoComplete={autoComplete} disabled={loading}
          value={form[key]} aria-invalid={!!errors[key]} aria-describedby={errors[key] ? `error-${key}` : undefined}
          onChange={(e) => { setForm({ ...form, [key]: e.target.value.replace(/\D/g, "").slice(0, 6) }); setErrors({}); }} />
        {errors[key] && <p id={`error-${key}`} className="text-sm text-destructive">{errors[key]}</p>}
      </div>)}
      <Button type="submit" variant="hero" size="xl" disabled={loading}>{loading ? "Só um instante…" : "Alterar meu PIN"}</Button>
    </form>
  );
}
