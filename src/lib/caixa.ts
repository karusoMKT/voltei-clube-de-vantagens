/** Pontos de uma compra: valor × pontos por real, arredondado para baixo. */
export const pontosDaCompra = (valor: number, pointsPerReal: number) =>
  valor > 0 ? Math.floor(valor * pointsPerReal) : 0;

/** "12,50" ou "1.234,5" -> 12.5 / 1234.5 */
export function parseReais(v: string) {
  const n = Number(v.replace(/[^\d,]/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

/** Máscara de moeda enquanto digita: só dígitos, últimos dois são centavos. */
export function maskReais(v: string) {
  const d = v.replace(/\D/g, "").replace(/^0+/, "").slice(0, 7);
  if (!d) return "";
  const cents = d.padStart(3, "0");
  const int = cents.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${int},${cents.slice(-2)}`;
}
