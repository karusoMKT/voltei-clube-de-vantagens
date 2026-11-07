import { z } from "zod";

export const rateSchema = z.number().finite().positive("Digite uma regra maior que zero.").max(1000, "Use até 1.000 pontos por real.");
export const rewardSchema = z.object({
  name: z.string().trim().min(1, "Digite o nome do prêmio.").max(100, "Use até 100 letras."),
  costReais: z.number().finite().min(0, "O custo não pode ser negativo.").max(99999.99, "Use um custo de até R$ 99.999,99."),
  costPoints: z.number().int("Digite pontos inteiros.").positive("Digite um custo em pontos maior que zero.").max(100000000),
});
export function rewardReturn(costReais: number | null, costPoints: number, rate: number) {
  if (costReais === null || costPoints <= 0 || rate <= 0) return null;
  const ratio = costReais / (costPoints / rate);
  return { ratio, label: ratio < 0.03 ? "Baixo" : ratio <= 0.08 ? "Bom" : "Alto" };
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