import { describe, expect, it } from "vitest";
import { activeMembership, companyRows, discoverableStores } from "@/lib/multi-store";

describe("carteira multi-loja", () => {
  const memberships = [{ companyId: "a", balance: 120 }, { companyId: "b", balance: 0 }];
  it("selecionar outra loja muda o saldo sem somar carteiras", () => {
    expect(activeMembership(memberships, "b")?.balance).toBe(0);
    expect(activeMembership(memberships, "a")?.balance).toBe(120);
  });
  it("prêmios e extrato mostram apenas a empresa ativa", () => {
    expect(companyRows([{ company_id: "a", points: 120 }, { company_id: "b", points: 30 }], "b")).toEqual([{ company_id: "b", points: 30 }]);
  });
  it("loja selecionada removida usa uma participação válida", () => {
    expect(activeMembership(memberships, "removida")?.companyId).toBe("a");
    expect(activeMembership([], "a")).toBeNull();
  });
});

describe("vitrine de descoberta", () => {
  const stores = [{ id: "a" }, { id: "b" }, { id: "c" }];
  it("esconde lojas em que o cliente já participa", () => {
    expect(discoverableStores(stores, [{ companyId: "a" }, { companyId: "c" }])).toEqual([{ id: "b" }]);
  });
  it("sem participações, mostra todas as lojas", () => {
    expect(discoverableStores(stores, [])).toEqual(stores);
  });
  it("participando de todas, a vitrine fica vazia", () => {
    expect(discoverableStores(stores, [{ companyId: "a" }, { companyId: "b" }, { companyId: "c" }])).toEqual([]);
  });
});