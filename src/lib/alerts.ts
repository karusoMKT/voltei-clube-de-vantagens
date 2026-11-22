import { z } from "zod";
import { onlyDigits } from "./cadastro";

export const ABSENT_DAY_OPTIONS = [15, 30, 45] as const;
export const ALERT_RESEND_DAYS = 30;
export const alertsEnabled = (plan: string, active: boolean, enabled: boolean) => plan === "premium" && active && enabled;

export const alertSettingsSchema = z.object({
  companyId: z.string().uuid(),
  enabled: z.boolean(),
  phone: z.string().transform(onlyDigits).refine((d) => d === "" || (d.length === 11 && d[2] === "9"), "Confira o WhatsApp: (73) 9 0000-0000."),
  days: z.coerce.number().refine((d) => (ABSENT_DAY_OPTIONS as readonly number[]).includes(d), "Escolha 15, 30 ou 45 dias."),
});

/** Para WhatsApp internacional: 11 dígitos brasileiros ganham o 55. */
export const toE164 = (phone: string | null) => {
  const d = onlyDigits(phone ?? "");
  if (d.length < 10) return null;
  return d.length <= 11 ? `55${d}` : d;
};

export const daysBetween = (from: Date, to: Date) => Math.floor((to.getTime() - from.getTime()) / 86_400_000);

export function absentMessage(name: string | null, company: string, points: number) {
  const first = (name ?? "").trim().split(/\s+/)[0] || "tudo bem";
  return `Oi, ${first}! Sentimos sua falta na ${company}. Você tem ${points} pontos esperando por você. Passa aqui pra gente!`;
}

/** Mês anterior no calendário de São Paulo, como [início, fim) em ISO. */
export function previousMonthRange(now: Date) {
  const sp = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  const y = sp.getMonth() === 0 ? sp.getFullYear() - 1 : sp.getFullYear();
  const m = sp.getMonth() === 0 ? 11 : sp.getMonth() - 1;
  const pad = (n: number) => String(n).padStart(2, "0");
  const start = `${y}-${pad(m + 1)}-01T00:00:00-03:00`;
  const ny = m === 11 ? y + 1 : y; const nm = m === 11 ? 0 : m + 1;
  return { label: `${pad(m + 1)}/${y}`, start, end: `${ny}-${pad(nm + 1)}-01T00:00:00-03:00` };
}

export function mostFrequent(names: string[]) {
  const counts = new Map<string, number>();
  for (const n of names) counts.set(n, (counts.get(n) ?? 0) + 1);
  let best: { name: string; count: number } | null = null;
  for (const [name, count] of counts) if (!best || count > best.count) best = { name, count };
  return best;
}

export const ALERT_LABELS: Record<string, string> = { redemption: "Resgate de prêmio", absent_clients: "Clientes ausentes", monthly_summary: "Resumo mensal", test: "Alerta de teste" };
export const STATUS_LABELS: Record<string, string> = { enviado: "Enviado", falhou: "Falhou", sem_webhook: "Registrado (sem integração)", pendente: "Pendente" };
