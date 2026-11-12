import { z } from "zod";
import { onlyDigits } from "./cadastro";

export type PlanId = "basic" | "pro" | "premium";
export const PLANS: Record<PlanId, { label: string; fee: number; features: string }> = {
  basic: { label: "Básico", fee: 97, features: "Pontos por compra e resgates simples" },
  pro: { label: "Profissional", fee: 147, features: "Básico + catálogo de prêmios e retorno financeiro" },
  premium: { label: "Premium", fee: 197, features: "Profissional + Stories, Google, clientes sumidos e top clientes" },
};
export const planLabel = (p: string) => PLANS[p as PlanId]?.label ?? p;

export type Feature = "rewards" | "photos" | "reactivation";
export function planAllows(plan: string, feature: Feature) {
  if (feature === "rewards") return plan === "pro" || plan === "premium";
  return plan === "premium";
}

export function mrr(companies: { active: boolean; monthly_fee: number }[]) {
  return companies.filter((c) => c.active).reduce((s, c) => s + Number(c.monthly_fee), 0);
}

/** Só minúsculas, sem acento, sem caractere especial: tudo que sobra vira hífen. */
function slugChars(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "")
    .slice(0, 60);
}

/** "Av Ubaitaba 123" -> "av-ubaitaba-123" */
export function slugify(value: string) {
  return slugChars(value).replace(/-+$/, "");
}

/** Igual a slugify, mas guarda o hífen final enquanto a pessoa digita a próxima palavra. */
export function slugTyping(value: string) {
  return slugChars(value);
}

export const companySchema = z.object({
  name: z.string().trim().min(2, "Digite o nome da loja.").max(80, "Nome muito longo."),
  slug: z
    .string()
    .transform(slugify)
    .refine((v) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(v), "Use letras minúsculas, números e hífen."),
  plan: z.enum(["basic", "pro", "premium"]),
  monthlyFee: z.coerce.number().min(0, "Mensalidade inválida.").max(100000, "Mensalidade inválida."),
});

export const ownerSchema = z.object({
  companyId: z.string().uuid(),
  fullName: z.string().trim().min(2, "Digite o nome do dono.").max(80),
  phone: z.string().transform(onlyDigits).refine((d) => d.length === 11 && d[2] === "9", "Confira o WhatsApp: (73) 9 0000-0000."),
  pin: z.string().regex(/^\d{6}$/, "O PIN precisa ter 6 números."),
});

export const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** Atendente de caixa criado pelo dono. A loja vem do cargo do dono, nunca do formulário. */
export const staffSchema = ownerSchema.omit({ companyId: true }).extend({
  fullName: z.string().trim().min(2, "Digite o nome do atendente.").max(80),
});
