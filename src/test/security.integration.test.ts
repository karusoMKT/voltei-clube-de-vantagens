import { describe, expect, it } from "vitest";

const url = process.env['VOLTEI_TEST_URL'];
const key = process.env['VOLTEI_TEST_KEY'];
const clientToken = process.env['VOLTEI_CLIENT_TEST_TOKEN'];
const ownerToken = process.env['VOLTEI_OWNER_TEST_TOKEN'];
const clientId = process.env['VOLTEI_CLIENT_TEST_ID'];
const foreignCompany = "00000000-0000-4000-8000-000000000099";
const live = url && key && clientToken && ownerToken && clientId;

async function request(path: string, token: string | undefined, method = "GET", body?: unknown) {
  if (!url || !key) throw new Error("Live test configuration missing");
  return fetch(`${url}${path}`, {
    method,
    headers: { apikey: key, ...(token ? { Authorization: `Bearer ${token}` } : {}), "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

describe.skipIf(!live)("live Voltei access rules", () => {
  for (const table of ["companies", "profiles", "user_roles", "memberships", "transactions", "redemptions", "rewards", "photo_submissions"]) {
    it(`visitor cannot read ${table}`, async () => {
      const r = await request(`/rest/v1/${table}?select=*&limit=1`, undefined);
      expect(r.ok).toBe(false);
    });
  }
  for (const table of ["memberships", "transactions", "redemptions", "user_roles"]) {
    it(`client cannot directly update ${table}`, async () => {
      const fields = table === "memberships" ? { points_balance: 999999 } : table === "transactions" ? { points: 999999 } : table === "redemptions" ? { status: "entregue" } : { role: "admin" };
      const r = await request(`/rest/v1/${table}?${table === "user_roles" ? "user_id" : "customer_id"}=eq.${clientId}`, clientToken, "PATCH", fields);
      expect(r.ok).toBe(false);
    });
  }
  it("client cannot overwrite QR token", async () => {
    const r = await request(`/rest/v1/profiles?id=eq.${clientId}`, clientToken, "PATCH", { qr_token: "forged" });
    expect(r.ok).toBe(false);
  });
  it("client cannot insert a nonzero balance", async () => {
    const r = await request("/rest/v1/memberships", clientToken, "POST", { customer_id: clientId, company_id: foreignCompany, points_balance: 999999 });
    expect(r.ok).toBe(false);
  });
  for (const role of ["client", "owner"] as const) {
    it(`${role} cannot buy at a different company`, async () => {
      const r = await request("/rest/v1/rpc/lancar_compra", role === "client" ? clientToken : ownerToken, "POST", { _company_id: foreignCompany, _customer_id: clientId, _valor_em_reais: 10 });
      expect(r.ok).toBe(false);
      expect((await r.json()).message).toBe("Você não tem acesso a esta loja.");
    });
    it(`${role} cannot search a different company`, async () => {
      const r = await request("/rest/v1/rpc/buscar_cliente_por_telefone", role === "client" ? clientToken : ownerToken, "POST", { _company_id: foreignCompany, _telefone: "73999990003" });
      expect(r.ok).toBe(false);
      expect((await r.json()).message).toBe("Você não tem acesso a esta loja.");
    });
  }
  it("client reads only their own membership", async () => {
    const r = await request("/rest/v1/memberships?select=customer_id,company_id,points_balance", clientToken);
    expect(r.ok).toBe(true);
    const rows = await r.json();
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((row: { customer_id: string }) => row.customer_id === clientId)).toBe(true);
  });
  it("owner cannot redeem as a customer", async () => {
    const r = await request("/rest/v1/rpc/resgatar_premio", ownerToken, "POST", { _reward_id: foreignCompany });
    expect(r.ok).toBe(false);
    expect((await r.json()).message).toBe("Só clientes podem resgatar prêmios.");
  });
  it("client cannot deliver a redemption", async () => {
    const r = await request("/rest/v1/rpc/entregar_resgate", clientToken, "POST", { _redemption_id: foreignCompany });
    expect(r.ok).toBe(false);
    expect((await r.json()).message).toBe("Não achamos esse resgate.");
  });
  it("client cannot call the internal points function", async () => {
    const r = await request("/rest/v1/rpc/_apply_points", clientToken, "POST", { _company: foreignCompany, _customer: clientId, _type: "ajuste", _points: 999999, _reais: 0 });
    expect(r.ok).toBe(false);
  });
});