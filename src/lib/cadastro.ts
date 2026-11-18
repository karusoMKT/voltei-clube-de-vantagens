import { z } from "zod";

export const onlyDigits = (v: string) => v.replace(/\D/g, "");

/** Formata como (DD) 9 0000-0000 enquanto digita. */
export function maskPhone(value: string) {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 3) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2, 3)} ${d.slice(3)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 3)} ${d.slice(3, 7)}-${d.slice(7)}`;
}

/** Sempre salva com um único @ no começo. */
export function normalizeInstagram(value: string) {
  const handle = value.trim().replace(/^@+/, "").toLowerCase();
  return handle ? `@${handle}` : "";
}

export const phoneToEmail = (phone: string) => `${onlyDigits(phone)}@voltei.app`;

const phone = z
  .string()
  .transform(onlyDigits)
  .refine((d) => d.length === 11 && d[2] === "9", "Confira o WhatsApp com DDD, assim: (73) 9 0000-0000.");
const pin = z.string().regex(/^\d{6}$/, "O PIN precisa ter 6 números.");

export const signupSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Conta pra gente como você se chama.")
    .max(80, "Esse nome ficou um pouco longo. Pode abreviar?"),
  phone,
  instagram: z
    .string()
    .transform(normalizeInstagram)
    .refine((v) => /^@[a-z0-9._]{1,30}$/.test(v), "Digite seu @ do Instagram, só letras, números, ponto ou _."),
  pin,
  slug: z.string().trim().max(80).optional(),
});

export const loginSchema = z.object({ phone, pin });

export type SignupInput = z.input<typeof signupSchema>;

/** Link wa.me com a mensagem de acesso para o dono recém-criado. */
export function accessWhatsappLink(phone: string, name: string, company: string, pin: string, origin: string) {
  const msg = `Olá, ${name}! Seu acesso ao Voltei da ${company} está pronto.\nWhatsApp de acesso: ${maskPhone(phone)}\nPIN provisório ${pin}\nEntre em ${origin}/entrar com esses dados. Depois troque o PIN no seu perfil.`;
  return `https://wa.me/55${onlyDigits(phone)}?text=${encodeURIComponent(msg)}`;
}
