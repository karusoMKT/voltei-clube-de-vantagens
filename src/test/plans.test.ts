import { describe, expect, it } from "vitest";
import { PLANS, planAllows, mrr, companySchema, slugify, slugTyping } from "@/lib/plans";

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
  it("calculadora de prêmios bloqueada no Básico e liberada no Profissional e Premium", () => {
    expect(planAllows("basic", "calculator")).toBe(false);
    expect(planAllows("pro", "calculator")).toBe(true);
    expect(planAllows("premium", "calculator")).toBe(true);
  });
  it("estado da empresa aceita só UF de 2 letras", () => {
    const base = { name: "Loja", slug: "loja", plan: "basic", monthlyFee: 97 };
    expect(companySchema.safeParse({ ...base, state: "ba" }).data?.state).toBe("BA");
    expect(companySchema.safeParse({ ...base, state: "Bahia" }).success).toBe(false);
  });
  it("Premium tem tudo", () => {
    expect(planAllows("premium", "photos")).toBe(true);
    expect(planAllows("premium", "reactivation")).toBe(true);
  });
  it("MRR soma só empresas ativas", () => {
    expect(mrr([{ active: true, monthly_fee: 97 }, { active: false, monthly_fee: 197 }, { active: true, monthly_fee: 147 }])).toBe(244);
  });
  it("slug só aceita minúsculas, números e hífen", () => {
    expect(companySchema.safeParse({ name: "Loja", slug: "###", plan: "basic", monthlyFee: 97 }).success).toBe(false);
    expect(companySchema.safeParse({ name: "Loja", slug: "loja-nova", plan: "basic", monthlyFee: 97 }).success).toBe(true);
  });
  it("endereço digitado vira slug sozinho: minúsculas, hífen e sem acento", () => {
    expect(slugify("Av Ubaitaba 123")).toBe("av-ubaitaba-123");
    expect(slugify("Café & Cia!")).toBe("cafe-cia");
    expect(slugify("  Loja   Nova-- ")).toBe("loja-nova");
    expect(slugify("São João")).toBe("sao-joao");
  });
  it("o endereço digitado no campo passa no Zod já limpo", () => {
    const r = companySchema.safeParse({ name: "Loja", slug: "Av Ubaitaba 123", plan: "basic", monthlyFee: 97 });
    expect(r.success).toBe(true);
    expect(r.data?.slug).toBe("av-ubaitaba-123");
  });
  it("digitar a próxima palavra continua possível (hífen final só some no fim)", () => {
    expect(slugTyping("Av ")).toBe("av-");
    expect(slugTyping("Av Ubaitaba ")).toBe("av-ubaitaba-");
    expect(slugify("Av Ubaitaba ")).toBe("av-ubaitaba");
  });
});
