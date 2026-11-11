import { Lock } from "lucide-react";

export function PlanLock({ title, plan }: { title: string; plan: "Profissional" | "Premium" }) {
  return (
    <div className="rounded-3xl border border-border bg-accent p-5">
      <div className="flex items-center gap-2 font-extrabold"><Lock className="h-5 w-5 text-primary" />{title}</div>
      <p className="mt-2 text-sm text-muted-foreground">Disponível no plano {plan}. Fale com o Voltei para fazer o upgrade.</p>
    </div>
  );
}
