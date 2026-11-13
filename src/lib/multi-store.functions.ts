import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const discoverStores = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { data, error } = await context.supabase.rpc("lojas_parceiras");
  if (error) throw new Error("Não conseguimos carregar as lojas.");
  return data;
});
export const joinStore = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ companyId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("participar_clube", { _company_id: data.companyId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
