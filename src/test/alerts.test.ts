import { describe, expect, it } from "vitest";
import { alertSettingsSchema, alertsEnabled, previousMonthRange, mostFrequent, toE164, absentMessage, daysBetween } from "@/lib/alerts";
const id = "00000000-0000-0000-0000-000000000001";
describe("alertas no WhatsApp", () => {
  it("só lojas Premium ativas com alertas ligados recebem", () => {
    expect(alertsEnabled("premium", true, true)).toBe(true);
    expect(alertsEnabled("pro", true, true)).toBe(false);
    expect(alertsEnabled("basic", true, true)).toBe(false);
    expect(alertsEnabled("premium", true, false)).toBe(false);
  });
  it("prazo de cliente ausente aceita só 15, 30 ou 45 dias", () => {
    expect(alertSettingsSchema.safeParse({ companyId: id, enabled: true, phone: "", days: 30 }).success).toBe(true);
    expect(alertSettingsSchema.safeParse({ companyId: id, enabled: true, phone: "", days: 20 }).success).toBe(false);
  });
  it("WhatsApp do aviso vira número internacional", () => {
    expect(alertSettingsSchema.parse({ companyId: id, enabled: true, phone: "(73) 9 9864-2732", days: 15 }).phone).toBe("73998642732");
    expect(toE164("73998642732")).toBe("5573998642732");
  });
  it("cliente com 30 dias sem pontuar conta como ausente no prazo de 30", () => {
    expect(daysBetween(new Date("2026-10-01T12:00:00Z"), new Date("2026-10-31T12:00:00Z"))).toBe(30);
  });
  it("resumo mensal cobre o mês anterior, inclusive em janeiro", () => {
    expect(previousMonthRange(new Date("2026-12-01T15:00:00Z")).label).toBe("11/2026");
    expect(previousMonthRange(new Date("2027-01-01T15:00:00Z"))).toMatchObject({ label: "12/2026", end: "2027-01-01T00:00:00-03:00" });
  });
  it("prêmio mais resgatado e mensagem sugerida", () => {
    expect(mostFrequent(["Casquinha", "Milk-shake", "Casquinha"])).toEqual({ name: "Casquinha", count: 2 });
    expect(absentMessage("Ana Souza", "Sorveteria", 80)).toContain("Oi, Ana! Sentimos sua falta na Sorveteria. Você tem 80 pontos");
  });
});
