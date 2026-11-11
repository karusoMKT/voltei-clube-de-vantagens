import { describe, expect, it } from "vitest";
import { accessWhatsappLink, maskPhone, normalizeInstagram, phoneToEmail, signupSchema } from "@/lib/cadastro";

describe("cadastro", () => {
  it("link de acesso vai para o WhatsApp do dono com o PIN", () => {
    const url = accessWhatsappLink("(73) 9 9999-0009", "Ana", "Loja X", "654321", "https://voltei.app");
    expect(url.startsWith("https://wa.me/5573999990009?text=")).toBe(true);
    expect(decodeURIComponent(url.split("text=")[1]!)).toContain("PIN provisório 654321");
  });
  it("mascara WhatsApp como (DD) 9 0000-0000", () => {
    expect(maskPhone("73900000000")).toBe("(73) 9 0000-0000");
  });
  it("Instagram salvo sempre com @", () => {
    expect(normalizeInstagram("sorvete")).toBe("@sorvete");
    expect(normalizeInstagram("@sorvete")).toBe("@sorvete");
  });
  it("e-mail interno vem do telefone", () => {
    expect(phoneToEmail("(73) 9 0000-0000")).toBe("73900000000@voltei.app");
  });
  it("PIN precisa ter exatamente 6 números", () => {
    const base = { fullName: "Ana", phone: "(73) 9 0000-0000", instagram: "ana" };
    expect(signupSchema.safeParse({ ...base, pin: "12345" }).success).toBe(false);
    expect(signupSchema.safeParse({ ...base, pin: "123456" }).success).toBe(true);
  });
});
