import { describe, expect, it } from "vitest";
import { maskReais, parseReais, pontosDaCompra } from "@/lib/caixa";

describe("caixa", () => {
  it("pontos = valor × pontos por real, arredondado para baixo", () => {
    expect(pontosDaCompra(23.9, 1)).toBe(23);
    expect(pontosDaCompra(10.5, 2)).toBe(21);
  });
  it("máscara e leitura do valor em reais", () => {
    expect(maskReais("2390")).toBe("23,90");
    expect(parseReais("1.234,50")).toBe(1234.5);
  });
});
