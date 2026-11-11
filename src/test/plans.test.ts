import { describe, expect, it } from "vitest";
import { PLANS, planAllows, mrr, companySchema } from "@/lib/plans";

describe("planos", () => {
  it("preços: Básico 97, Profissional 147, Premium 197", () => {
    expect([PLANS.basic.fee, PLANS.pro.fee, PLANS.premium.fee]).toEqual([97, 147, 197]);
  });
  it("Básico não tem catálogo, fotos nem reativação", () => {
    expect(planAllows("basic", "rewards")).toBe(false);
    expect(planAllows("basic", "photos")).toBe(false);
    expect(planAllows("basic", "reactivation")).toBe(false);
  });
  it("Profissional tem catálogo mas não fotos", () => {
    expect(planAllows("pro", "rewards")).toBe(true);
    expect(planAllows("pro", "photos")).toBe(false);
  });
  it("Premium tem tudo", () => {
    expect(planAllows("premium", "photos")).toBe(true);
    expect(planAllows("premium", "reactivation")).toBe(true);
  });
  it("MRR soma só empresas ativas", () => {
    expect(mrr([{ active: true, monthly_fee: 97 }, { active: false, monthly_fee: 197 }, { active: true, monthly_fee: 147 }])).toBe(244);
  });
  it("slug só aceita minúsculas, números e hífen", () => {
    expect(companySchema.safeParse({ name: "Loja", slug: "loja nova", plan: "basic", monthlyFee: 97 }).success).toBe(false);
    expect(companySchema.safeParse({ name: "Loja", slug: "loja-nova", plan: "basic", monthlyFee: 97 }).success).toBe(true);
  });
});
