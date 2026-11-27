/** Cidades sugeridas no cadastro; somam-se às cidades das lojas cadastradas. */
export const DEFAULT_CITIES = ["Ilhéus", "Itabuna", "Itacaré"];

/** Compara cidades sem acento, caixa ou espaços extras. */
export function cityKey(value: string | null | undefined) {
  return (value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase().replace(/\s+/g, " ");
}

/** Lista única e ordenada: padrão + cidades das lojas. */
export function cityOptions(extra: (string | null | undefined)[]) {
  const map = new Map<string, string>();
  for (const c of [...DEFAULT_CITIES, ...extra]) { const t = (c ?? "").trim(); if (t && !map.has(cityKey(t))) map.set(cityKey(t), t); }
  return [...map.values()].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

/** Só as lojas da cidade escolhida; sem cidade escolhida, mostra todas. */
export function storesInCity<T extends { city: string | null }>(stores: T[], city: string | null | undefined) {
  if (!cityKey(city)) return stores;
  return stores.filter((s) => cityKey(s.city) === cityKey(city));
}

export const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
