import { describe, expect, it } from "vitest";
const url = process.env['VOLTEI_TEST_URL'];
const key = process.env['VOLTEI_TEST_KEY'];
const client = process.env['VOLTEI_CLIENT_TEST_TOKEN'];
const owner = process.env['VOLTEI_OWNER_TEST_TOKEN'];
const company = process.env['VOLTEI_COMPANY_TEST_ID'];
async function rpc(fn: string, token: string | undefined, body: unknown) {
  return fetch(`${url}/rest/v1/rpc/${fn}`, { method: "POST", headers: { apikey: key ?? "", Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
}
describe.skipIf(!(url && key && client && owner && company))("satisfaction database access", () => {
  it("clients cannot configure the store", async () => { expect((await rpc("salvar_configuracao_pesquisa",client,{ _company_id: company, _url: "", _points: 30 })).ok).toBe(false); });
  it("owners cannot answer as customers", async () => { expect((await rpc("responder_pesquisa",owner,{ _company_id: company, _rating: 5 })).ok).toBe(false); });
  it("rejects scores outside 1 to 5", async () => { for (const score of [0,6]) expect((await rpc("responder_pesquisa",client,{ _company_id: company, _rating: score })).ok).toBe(false); });
  it("owners cannot configure another store", async () => { expect((await rpc("salvar_configuracao_pesquisa",owner,{ _company_id: "00000000-0000-4000-8000-000000000099", _url: "", _points: 30 })).ok).toBe(false); });
});
