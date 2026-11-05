import { createServerFn } from "@tanstack/react-start";
import { signupSchema, phoneToEmail } from "./cadastro";

type Result = { ok: true } | { ok: false; field?: "phone" | "slug"; message: string };

export const criarConta = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => signupSchema.parse(input))
  .handler(async ({ data }): Promise<Result> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let companyId: string | null = null;
    if (data.slug) {
      const { data: company } = await supabaseAdmin
        .from("companies")
        .select("id")
        .eq("slug", data.slug)
        .eq("active", true)
        .maybeSingle();
      if (!company) return { ok: false, field: "slug", message: "Não achamos essa loja. Peça o link certo no balcão." };
      companyId = company.id;
    }

    const { data: existing } = await supabaseAdmin.from("profiles").select("id").eq("phone", data.phone).maybeSingle();
    if (existing) return { ok: false, field: "phone", message: "Esse WhatsApp já tem conta. É só entrar com seu PIN." };

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: phoneToEmail(data.phone),
      password: data.pin,
      email_confirm: true,
      user_metadata: { full_name: data.fullName },
    });
    if (error || !created.user) {
      const dup = error?.message?.toLowerCase().includes("already");
      return dup
        ? { ok: false, field: "phone", message: "Esse WhatsApp já tem conta. É só entrar com seu PIN." }
        : { ok: false, message: "Não conseguimos criar sua conta agora. Tente de novo em instantes." };
    }
    const userId = created.user.id;

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({ id: userId, full_name: data.fullName, phone: data.phone, instagram: data.instagram, role: "cliente" });
    const { error: memberError } = companyId
      ? await supabaseAdmin.from("memberships").insert({ customer_id: userId, company_id: companyId })
      : { error: null };

    if (profileError || memberError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return { ok: false, message: "Não conseguimos criar sua conta agora. Tente de novo em instantes." };
    }
    return { ok: true };
  });
