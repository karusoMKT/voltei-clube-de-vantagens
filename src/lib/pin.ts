import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

const pin = z.string().regex(/^\d{6}$/, "O PIN precisa ter 6 números.");
export const changePinSchema = z.object({ currentPin: pin, newPin: pin, confirmation: pin })
  .refine((data) => data.newPin === data.confirmation, { path: ["confirmation"], message: "A confirmação precisa ser igual ao novo PIN." });

/** Reauthenticate the actual account before changing its password; no role mutation. */
export async function changePin(input: unknown) {
  const data = changePinSchema.parse(input);
  const { data: identity, error: identityError } = await supabase.auth.getUser();
  if (identityError || !identity.user?.email) throw new Error("Entre novamente para alterar seu PIN.");
  const { data: verified, error: verifyError } = await supabase.auth.signInWithPassword({ email: identity.user.email, password: data.currentPin });
  if (verifyError || verified.user?.id !== identity.user.id) throw new Error("PIN atual incorreto. Confira e tente novamente.");
  const { error } = await supabase.auth.updateUser({ password: data.newPin });
  if (error) throw new Error("Não conseguimos trocar seu PIN agora. Tente novamente.");
}