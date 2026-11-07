import { describe, expect, it } from "vitest";

const url = process.env['VOLTEI_TEST_URL'];
const key = process.env['VOLTEI_TEST_KEY'];
const client = process.env['VOLTEI_CLIENT_TEST_TOKEN'];
const owner = process.env['VOLTEI_OWNER_TEST_TOKEN'];
const pending = process.env['VOLTEI_PENDING_TEST_TOKEN'];
const live = url && key && client && owner && pending;
async function call(path: string, token: string | undefined, method = "GET", body?: unknown) {
  const r = await fetch(`${url}${path}`, { method, headers: { apikey: key ?? "", Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}) });
  return { ok: r.ok, data: await r.json() };
}
describe.skipIf(!live)("photo approval access and limits", () => {
  it("allows only one pending submission per customer", async () => {
    const rows = await call("/rest/v1/photo_submissions?status=eq.pendente&select=company_id,image_path", pending);
    expect(rows.data.length).toBe(1);
    const r = await call("/rest/v1/rpc/enviar_foto", pending, "POST", { _company_id: rows.data[0].company_id, _image_path: rows.data[0].image_path });
    expect(r.ok).toBe(false);
    expect(r.data.message).toBe("Você já tem um print aguardando aprovação.");
  });
  it("blocks a second photo on the same approval day in the same company", async () => {
    const rows = await call("/rest/v1/photo_submissions?status=eq.aprovada&select=company_id,image_path", client);
    expect(rows.data.length).toBeGreaterThan(0);
    const r = await call("/rest/v1/rpc/enviar_foto", client, "POST", { _company_id: rows.data[0].company_id, _image_path: rows.data[0].image_path });
    expect(r.ok).toBe(false);
    expect(r.data.message).toBe("Você já ganhou pontos por foto nesta loja hoje. Volte amanhã!");
  });
  it("approval records exactly the default 30 photo points", async () => {
    const rows = await call("/rest/v1/transactions?type=eq.foto&select=points&order=created_at.desc&limit=1", client);
    expect(rows.ok).toBe(true);
    expect(rows.data[0].points).toBe(30);
  });
  it("customers cannot approve or refuse prints", async () => {
    const rows = await call("/rest/v1/photo_submissions?select=id&limit=1", client);
    for (const fn of ["aprovar_foto", "recusar_foto"]) {
      const r = await call(`/rest/v1/rpc/${fn}`, client, "POST", { _submission_id: rows.data[0].id });
      expect(r.ok).toBe(false);
      expect(r.data.message).toBe("Você não tem acesso a este print.");
    }
  });
  it("reviewing an approved photo again cannot add points", async () => {
    const rows = await call("/rest/v1/photo_submissions?status=eq.aprovada&select=id&limit=1", client);
    const r = await call("/rest/v1/rpc/aprovar_foto", owner, "POST", { _submission_id: rows.data[0].id });
    expect(r.ok).toBe(false);
    expect(r.data.message).toBe("Esse print já foi analisado.");
  });
  it("direct changes and the legacy arbitrary photo reward are denied", async () => {
    const r = await call("/rest/v1/photo_submissions?status=eq.pendente", client, "PATCH", { status: "aprovada" });
    expect(r.ok).toBe(false);
    const legacy = await call("/rest/v1/rpc/revisar_print", owner, "POST", { _submission: "00000000-0000-4000-8000-000000000099", _aprovar: true, _points: 999 });
    expect(legacy.ok).toBe(false);
  });
  it("another customer cannot read the private print", async () => {
    const rows = await call("/rest/v1/photo_submissions?status=eq.aprovada&select=image_path&limit=1", client);
    const r = await fetch(`${url}/storage/v1/object/authenticated/prints/${rows.data[0].image_path}`, { headers: { apikey: key ?? "", Authorization: `Bearer ${pending}` } });
    expect(r.ok).toBe(false);
  });
});