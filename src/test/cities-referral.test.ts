import { describe, expect, it } from "vitest";
import { cityOptions, storesInCity } from "@/lib/cities";
import { inviteLink, normalizeRefCode } from "@/lib/referral";

describe("cidades", () => {
  it("opções incluem Ilhéus, Itabuna, Itacaré e cidades das lojas, sem duplicar acento", () => {
    expect(cityOptions(["Ilheus", "Uruçuca", null])).toEqual(["Ilhéus", "Itabuna", "Itacaré", "Uruçuca"]);
  });
  it("vitrine mostra só lojas da cidade escolhida", () => {
    const stores = [{ id: "a", city: "Ilhéus" }, { id: "b", city: "Itabuna" }, { id: "c", city: null }];
    expect(storesInCity(stores, "ilheus").map((s) => s.id)).toEqual(["a"]);
    expect(storesInCity(stores, "Itacaré")).toEqual([]);
  });
});

describe("convite", () => {
  it("código válido tem 8 letras/números", () => {
    expect(normalizeRefCode(" ab12cd34 ")).toBe("AB12CD34");
    expect(normalizeRefCode("123")).toBeNull();
  });
  it("link aponta para o cadastro da loja com o código", () => {
    expect(inviteLink("https://voltei.app", "sorveteria-modelo", "AB12CD34")).toBe("https://voltei.app/c/sorveteria-modelo?ref=AB12CD34");
  });
});
