import { describe, expect, it } from "vitest";

const url = process.env["VOLTEI_TEST_URL"];
const key = process.env["VOLTEI_TEST_KEY"];
const customer = process.env["VOLTEI_CLIENT_TEST_TOKEN"];
const owner = process.env["VOLTEI_OWNER_TEST_TOKEN"];
const company = process.env["VOLTEI_COMPANY_TEST_ID"];
async function rpc(name: string, token: string | undefined, body: unknown = {}) {
  const response = await fetch(`${url}/rest/v1/rpc/${name}`, { method: "POST", headers: { apikey: key ?? "", Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return { ok: response.ok, data: await response.json() };
}
describe.skipIf(!(url && key && customer && owner && company))("multi-loja: permissões reais", () => {
  it("dono não pode criar participação de cliente", async () => {
    expect((await rpc("participar_clube", owner, { _company_id: company })).ok).toBe(false);
  });
  it("cliente não pode editar empresa", async () => {
    expect((await rpc("admin_editar_empresa", customer, { _id: company, _name: "Não autorizado", _slug: "nao-autorizado", _plan: "basic", _monthly_fee: 97, _city: "", _logo_url: null, _active: true })).ok).toBe(false);
  });
  it("vitrine não expõe mensalidade nem regra de pontos", async () => {
    const result = await rpc("lojas_parceiras", customer);
    expect(result.ok).toBe(true);
    expect(result.data.length).toBeGreaterThan(0);
    expect(Object.keys(result.data[0]).sort()).toEqual(["city", "id", "logo_url", "name", "slug"]);
  });
});