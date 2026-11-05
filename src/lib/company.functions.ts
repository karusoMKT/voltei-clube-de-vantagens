import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/** Nome público da loja pelo slug (só nome, para o link de cadastro). */
export const getCompanyBySlug = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ slug: z.string().max(80) }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: c } = await supabaseAdmin
      .from("companies").select("name, slug").eq("slug", data.slug).eq("active", true).maybeSingle();
    return c;
  });
