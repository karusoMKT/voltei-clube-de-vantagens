export type StoreIdentity = { id: string; name: string; logo_url: string | null; city: string | null };
export function activeMembership<T extends { companyId: string }>(memberships: T[], selected: string | null) {
  return memberships.find((m) => m.companyId === selected) ?? memberships[0] ?? null;
}
export function companyRows<T extends { company_id: string }>(rows: T[], companyId: string | null) {
  return rows.filter((r) => r.company_id === companyId);
}
/** Vitrine de descoberta: apenas lojas em que o cliente ainda não participa. */
export function discoverableStores<T extends { id: string }>(stores: T[], memberships: { companyId: string }[]) {
  const joined = new Set(memberships.map((m) => m.companyId));
  return stores.filter((s) => !joined.has(s.id));
}
