import { describe, expect, it } from "vitest";
import { rateSchema, rewardSchema, rewardReturn, whatsappReturn } from "@/lib/company-panels";

describe("reward return", () => {
  it("calculates cost divided by customer spend using points per real", () => {
    expect(rewardReturn(2, 100, 2)?.ratio).toBe(0.04);
  });
  it("labels below 3 percent as low", () => { expect(rewardReturn(2.99,100,1)?.label).toBe("Baixo"); });
  it("labels 3 to 8 percent inclusive as good", () => {
    expect(rewardReturn(3,100,1)?.label).toBe("Bom"); expect(rewardReturn(8,100,1)?.label).toBe("Bom");
  });
  it("labels above 8 percent as high", () => { expect(rewardReturn(8.01,100,1)?.label).toBe("Alto"); });
  it("does not invent an unknown reward cost", () => { expect(rewardReturn(null,100,1)).toBeNull(); });
});
describe("reward inputs and contact", () => {
  it("rejects zero or negative rates and zero point cost", () => {
    expect(rateSchema.safeParse(0).success).toBe(false); expect(rateSchema.safeParse(-1).success).toBe(false);
    expect(rewardSchema.safeParse({name:"Prêmio",costReais:2,costPoints:0}).success).toBe(false);
  });
  it("encodes the requested WhatsApp message and Brazilian phone", () => {
    const link = whatsappReturn("Ana", "Sorveteria Modelo", 120, "73999990003");
    expect(link?.split("?")[0]).toBe("https://wa.me/5573999990003");
    expect(decodeURIComponent(link?.split("text=")[1] ?? "")).toBe("Oi, Ana! Sentimos sua falta na Sorveteria Modelo. Passe aqui, você tem 120 pontos esperando.");
    expect(whatsappReturn("Ana", "Loja", 120, "javascript:alert(1)")).toBeNull();
  });
});