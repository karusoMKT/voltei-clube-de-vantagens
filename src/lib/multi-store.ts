export type StoreIdentity = { id: string; name: string; logo_url: string | null; city: string | null };
export function activeMembership<T extends { companyId: string }>(memberships: T[], selected: string | null) {
  return memberships.find((m) => m.companyId === selected) ?? memberships[0] ?? null;
}
export function companyRows<T extends { company_id: string }>(rows: T[], companyId: string | null) {
  return rows.filter((r) => r.company_id === companyId);
}
