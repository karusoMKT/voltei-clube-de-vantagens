import { z } from "zod";

export const rateSchema = z.number().finite().positive("Digite uma regra maior que zero.").max(1000, "Use até 1.000 pontos por real.");
export const rewardSchema = z.object({
  name: z.string().trim().min(1, "Digite o nome do prêmio.").max(100, "Use até 100 letras."),
  costReais: z.number({ invalid_type_error: "Digite o custo em reais do prêmio." }).finite().min(0, "O custo não pode ser negativo.").max(99999.99, "Use um custo de até R$ 99.999,99."),
  costPoints: z.number().int("Digite pontos inteiros.").positive("Digite um custo em pontos maior que zero.").max(100000000),
});
export function rewardReturn(costReais: number | null, costPoints: number, rate: number) {
  if (costReais === null || costPoints <= 0 || rate <= 0) return null;
  const ratio = costReais / (costPoints / rate);
  return { ratio, label: ratio < 0.03 ? "Baixo" : ratio <= 0.08 ? "Bom" : "Alto" };
}
export const BASIC_REWARD_LIMIT = 3;
export const HEALTHY_RETURN = 0.05;
/** Pontos para que o prêmio custe 5% do que o cliente gastou: custo ÷ 5% × pontos por real. */
export function suggestPoints(costReais: number, rate: number) {
  if (!Number.isFinite(costReais) || costReais <= 0 || rate <= 0) return null;
  return Math.max(1, Math.round((costReais / HEALTHY_RETURN) * rate));
}
export function rewardLimitReached(plan: string, activeCount: number) {
  return plan === "basic" && activeCount >= BASIC_REWARD_LIMIT;
}
export function whatsappReturn(name: string, company: string, points: number, phone: string | null) {
  const valid = z.object({ name: z.string().trim().max(100), company: z.string().trim().max(200), points: z.number().int().nonnegative(), phone: z.string().regex(/^\d{10,13}$/) }).safeParse({ name, company, points, phone });
  if (!valid.success) return null;
  const number = valid.data.phone.length <= 11 ? `55${valid.data.phone}` : valid.data.phone;
  const message = `Oi, ${valid.data.name}! Sentimos sua falta na ${valid.data.company}. Passe aqui, você tem ${valid.data.points} pontos esperando.`;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
export const summarySchema = z.object({
  month: z.string(), customers: z.number(), purchases: z.number(), points: z.number(), redemptions: z.number(),
  inactive: z.array(z.object({ id: z.string(), name: z.string().nullable(), phone: z.string().nullable(), balance: z.number(), lastPurchase: z.string().nullable() })),
});