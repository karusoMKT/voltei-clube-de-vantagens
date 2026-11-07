import { describe, expect, it } from "vitest";
const url = process.env['VOLTEI_TEST_URL'];
const key = process.env['VOLTEI_TEST_KEY'];
const owner = process.env['VOLTEI_OWNER_TEST_TOKEN'];
const client = process.env['VOLTEI_CLIENT_TEST_TOKEN'];
const company = process.env['VOLTEI_COMPANY_TEST_ID'];
const inactiveId = process.env['VOLTEI_INACTIVE_TEST_ID'];
const rewardId = process.env['VOLTEI_REWARD_TEST_ID'];
const live = url && key && owner && client && company && inactiveId && rewardId;
async function rpc(fn: string, token: string | undefined, body: unknown) {
  const r = await fetch(`${url}/rest/v1/rpc/${fn}`, { method:"POST", headers: { apikey:key ?? "", Authorization:`Bearer ${token}`, "Content-Type":"application/json" }, body:JSON.stringify(body) });
  return { ok:r.ok, data:await r.json() };
}
describe.skipIf(!live)("company panel access", () => {
  it("client cannot edit point rate or create rewards", async () => {
    expect((await rpc("salvar_regra_pontos",client,{_company_id:company,_points_per_real:2})).ok).toBe(false);
    expect((await rpc("criar_premio",client,{_company_id:company,_name:"Não autorizado",_cost_reais:2,_cost_points:100})).ok).toBe(false);
  });
  it("client cannot toggle rewards or read company summary", async () => {
    expect((await rpc("ativar_premio",client,{_reward_id:rewardId,_active:true})).ok).toBe(false);
    expect((await rpc("resumo_empresa",client,{_company_id:company})).ok).toBe(false);
  });
  it("owner cannot change or summarize another company", async () => {
    const foreign="00000000-0000-4000-8000-000000000099";
    expect((await rpc("salvar_regra_pontos",owner,{_company_id:foreign,_points_per_real:2})).ok).toBe(false);
    expect((await rpc("criar_premio",owner,{_company_id:foreign,_name:"Outro",_cost_reais:2,_cost_points:100})).ok).toBe(false);
    expect((await rpc("resumo_empresa",owner,{_company_id:foreign})).ok).toBe(false);
  });
  it("owner cannot toggle another company's reward", async () => {
    expect((await rpc("ativar_premio",owner,{_reward_id:"00000000-0000-4000-8000-000000000099",_active:true})).ok).toBe(false);
  });
  it("includes the never-purchaser whose membership is older than 30 days", async () => {
    const summary=await rpc("resumo_empresa",owner,{_company_id:company});
    expect(summary.ok).toBe(true);
    expect(summary.data.inactive.some((row:{id:string;lastPurchase:string|null})=>row.id===inactiveId && row.lastPurchase===null)).toBe(true);
  });
  it("owner's zero rate is rejected in the database", async () => {
    const r=await rpc("salvar_regra_pontos",owner,{_company_id:company,_points_per_real:0});
    expect(r.ok).toBe(false);
    expect(r.data.message).toBe("Digite uma regra de pontos maior que zero e até 1.000.");
  });
});