import { describe, expect, it } from "vitest";

const url = process.env["VOLTEI_TEST_URL"];
const key = process.env["VOLTEI_TEST_KEY"];
const customer = process.env["VOLTEI_CLIENT_TEST_TOKEN"];
const live = url && key && customer;

type Store = { id: string; logo_url: string | null };

async function storeWithLogo() {
  const response = await fetch(`${url}/rest/v1/rpc/lojas_parceiras`, {
    method: "POST",
    headers: { apikey: key ?? "", Authorization: `Bearer ${customer}`, "Content-Type": "application/json" },
    body: "{}",
  });
  expect(response.ok).toBe(true);
  const stores = await response.json() as Store[];
  const membershipsResponse = await fetch(`${url}/rest/v1/memberships?select=company_id`, {
    headers: { apikey: key ?? "", Authorization: `Bearer ${customer}` },
  });
  expect(membershipsResponse.ok).toBe(true);
  const memberships = await membershipsResponse.json() as { company_id: string }[];
  const joined = new Set(memberships.map((item) => item.company_id));
  const store = stores.find((item) => item.logo_url && !joined.has(item.id));
  if (!store?.logo_url) throw new Error("Cadastre uma loja ativa com logo que o cliente ainda não participa para este teste.");
  return { id: store.id, publicUrl: store.logo_url, path: store.logo_url.split("/company-logos/")[1]! };
}

describe.skipIf(!live)("logos das empresas: acesso real", () => {
  it("cliente autorizado abre a imagem por um link assinado", async () => {
    const store = await storeWithLogo();
    const signed = await fetch(`${url}/storage/v1/object/sign/company-logos/${store.path}`, {
      method: "POST",
      headers: { apikey: key ?? "", Authorization: `Bearer ${customer}`, "Content-Type": "application/json" },
      body: JSON.stringify({ expiresIn: 3600 }),
    });
    expect(signed.ok).toBe(true);
    const payload = await signed.json() as { signedURL: string };
    const image = await fetch(`${url}${payload.signedURL}`);
    expect(image.ok).toBe(true);
    expect(image.headers.get("content-type")).toMatch(/^image\//);
  });

  it("a URL pública salva não libera o bucket privado anonimamente", async () => {
    const store = await storeWithLogo();
    const response = await fetch(store.publicUrl);
    expect(response.ok).toBe(false);
  });

  it("cliente não pode enviar logos", async () => {
    const store = await storeWithLogo();
    const response = await fetch(`${url}/storage/v1/object/company-logos/${store.id}/${crypto.randomUUID()}.png`, {
      method: "POST",
      headers: { apikey: key ?? "", Authorization: `Bearer ${customer}`, "Content-Type": "image/png" },
      body: new Uint8Array([137, 80, 78, 71]),
    });
    expect(response.ok).toBe(false);
  });
});
