import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "sonner";
import { criarConta } from "@/lib/auth.functions";
import { getSessionInfo, homeFor } from "@/lib/session";
import { loginSchema, maskPhone, phoneToEmail, signupSchema } from "@/lib/cadastro";

type Errors = Partial<Record<"fullName" | "phone" | "instagram" | "pin" | "form", string | undefined>>;

function Field({ label, error, hint, children }: { label: string; error?: string | undefined; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-foreground">{label}</span>
      {children}
      {hint && !error && <span className="mt-1.5 block text-sm text-muted-foreground">{hint}</span>}
      {error && <span role="alert" className="mt-1.5 block text-sm font-semibold text-destructive">{error}</span>}
    </label>
  );
}

const inputCls =
  "h-14 w-full rounded-2xl border border-border bg-card px-4 text-base text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-primary focus:ring-4 focus:ring-primary/15 aria-[invalid=true]:border-destructive";

function firstErrors(issues: { path: (string | number)[]; message: string }[]): Errors {
  const out: Errors = {};
  for (const i of issues) {
    const k = i.path[0] as keyof Errors;
    if (!out[k]) out[k] = i.message;
  }
  return out;
}

export function EntrarForm({ slug, companyName }: { slug?: string | undefined; companyName?: string | undefined }) {
  const [mode, setMode] = useState<"cadastro" | "entrada">(slug ? "cadastro" : "entrada");
  const [form, setForm] = useState({ fullName: "", phone: "", instagram: "", pin: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [forgot, setForgot] = useState(false);
  const navigate = useNavigate();
  const signup = useServerFn(criarConta);

  // Só redireciona com sessão ativa e válida; sem isso a tela de login fica aberta.
  useEffect(() => {
    let alive = true;
    getSessionInfo().then((info) => { if (alive && info) navigate({ to: homeFor(info.role), replace: true }); });
    return () => { alive = false; };
  }, [navigate]);

  async function goHome() {
    const info = await getSessionInfo();
    navigate({ to: info ? homeFor(info.role) : "/cliente", replace: true });
  }

  const set = (k: keyof typeof form, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined, form: undefined }));
  };

  async function signIn(phone: string, pin: string) {
    const { error } = await supabase.auth.signInWithPassword({ email: phoneToEmail(phone), password: pin });
    return error;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    if (mode === "cadastro") {
      const parsed = signupSchema.safeParse({ ...form, slug });
      if (!parsed.success) return setErrors(firstErrors(parsed.error.issues));
      setLoading(true);
      try {
        const res = await signup({ data: { ...form, slug } });
        if (!res.ok) {
          setErrors(res.field === "phone" ? { phone: res.message } : { form: res.message });
          return;
        }
        const err = await signIn(form.phone, form.pin);
        if (err) return setErrors({ form: "Sua conta foi criada! Agora é só entrar com seu PIN." });
        await goHome();
      } catch {
        setErrors({ form: "Algo não saiu como esperado. Tente de novo em instantes." });
      } finally {
        setLoading(false);
      }
    } else {
      const parsed = loginSchema.safeParse(form);
      if (!parsed.success) return setErrors(firstErrors(parsed.error.issues));
      setLoading(true);
      const err = await signIn(form.phone, form.pin);
      if (err) {
        setLoading(false);
        toast.error("WhatsApp ou PIN incorretos. Confira e tente de novo.");
        return;
      }
      await goHome();
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col px-6 py-8">
      <p className="text-xl font-extrabold text-primary">Voltei</p>
      {companyName && (
        <span className="mt-4 self-start rounded-full bg-cream px-3 py-1 text-sm font-bold text-foreground">
          {companyName}
        </span>
      )}

      <h1 className="mt-6 text-3xl font-extrabold leading-tight text-foreground">
        {mode === "cadastro" ? "Entre no clube e ganhe a cada volta." : "Que bom te ver de novo!"}
      </h1>
      <p className="mt-2 text-base text-muted-foreground">
        {mode === "cadastro"
          ? "Pontos por compra, foto e indicação. Prêmios do seu jeito."
          : "Entre com seu WhatsApp e PIN."}
      </p>

      <form onSubmit={onSubmit} noValidate className="mt-8 flex flex-col gap-5">
        {mode === "cadastro" && (
          <Field label="Seu nome" error={errors.fullName}>
            <input className={inputCls} autoComplete="name" value={form.fullName} aria-invalid={!!errors.fullName}
              onChange={(e) => set("fullName", e.target.value)} placeholder="Como você se chama" />
          </Field>
        )}
        <Field label="Seu WhatsApp" error={errors.phone}>
          <input className={inputCls} inputMode="numeric" autoComplete="tel-national" value={form.phone}
            aria-invalid={!!errors.phone} onChange={(e) => set("phone", maskPhone(e.target.value))}
            placeholder="(DD) 9 0000-0000" />
        </Field>
        {mode === "cadastro" && (
          <Field label="Seu Instagram" error={errors.instagram}
            hint="Usamos para conferir as fotos que você posta e dar seus pontos.">
            <input className={inputCls} autoCapitalize="none" autoCorrect="off" value={form.instagram}
              aria-invalid={!!errors.instagram} onChange={(e) => set("instagram", e.target.value)} placeholder="@seuperfil" />
          </Field>
        )}
        <Field label={mode === "cadastro" ? "Crie um PIN de 6 números" : "Seu PIN"} error={errors.pin}>
          <InputOTP maxLength={6} inputMode="numeric" pattern="^[0-9]*$" value={form.pin}
            autoComplete={mode === "cadastro" ? "new-password" : "current-password"} aria-invalid={!!errors.pin}
            onChange={(v) => set("pin", v.replace(/\D/g, ""))}>
            <InputOTPGroup className="w-full justify-between gap-2">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <InputOTPSlot key={i} index={i} className="h-14 w-12 rounded-2xl border border-border bg-card text-xl first:rounded-2xl first:border-l last:rounded-2xl" />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </Field>

        {errors.form && (
          <p role="alert" className="rounded-2xl bg-cream px-4 py-3 text-sm font-semibold text-foreground">{errors.form}</p>
        )}

        <Button type="submit" variant="hero" size="xl" disabled={loading}>
          {loading ? "Só um instante…" : mode === "cadastro" ? "Criar minha conta" : "Entrar"}
        </Button>
      </form>

      {mode === "entrada" && (
        <div className="mt-4 text-center">
          <button type="button" className="min-h-12 text-sm font-bold text-primary" onClick={() => setForgot(true)}>
            Esqueci meu PIN
          </button>
          {forgot && (
            <p className="rounded-2xl bg-secondary px-4 py-3 text-sm text-secondary-foreground">
              Fale com a loja para gerar um novo PIN.
            </p>
          )}
        </div>
      )}

      <div className="mt-auto pt-8 text-center text-sm text-muted-foreground">
        {mode === "cadastro" ? "Já tem conta?" : "Novo por aqui?"}{" "}
        <button type="button" className="min-h-12 font-bold text-primary"
          onClick={() => { setMode(mode === "cadastro" ? "entrada" : "cadastro"); setErrors({}); setForgot(false); }}>
          {mode === "cadastro" ? "Entrar" : "Criar conta de cliente"}
        </button>
      </div>
    </div>
  );
}
