/** Código de convite: 8 letras/números maiúsculos. */
export function normalizeRefCode(value: string | null | undefined) {
  const v = (value ?? "").trim().toUpperCase();
  return /^[A-Z0-9]{8}$/.test(v) ? v : null;
}
export function inviteLink(origin: string, slug: string, code: string) {
  return `${origin}/c/${encodeURIComponent(slug)}?ref=${encodeURIComponent(code)}`;
}
