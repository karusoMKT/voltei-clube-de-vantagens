import { z } from "zod";
export const googleUrlSchema = z.string().trim().max(2048).refine((value) => {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password && /^(g\.page|maps\.app\.goo\.gl|goo\.gl|([a-z0-9-]+\.)?google\.(com|com\.br))$/.test(url.hostname);
  } catch { return false; }
}, "Digite um link HTTPS válido do Google.");
export const satisfactionSettingsSchema = z.object({ companyId: z.string().uuid(), url: googleUrlSchema, points: z.coerce.number().int().min(1).max(10000).default(30) });
export const satisfactionResponseSchema = z.object({ companyId: z.string().uuid(), rating: z.number().int().min(1).max(5) });
export const satisfactionEnabled = (plan: string, active: boolean) => plan === "premium" && active;
// Google invitations must never be gated by satisfaction score.
export const showGoogleInvitation = (submitted: boolean, url: string | null) => submitted && !!url;
