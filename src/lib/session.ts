import { supabase } from "@/integrations/supabase/client";

export type SessionInfo = { userId: string; role: string; companyId: string | null } | null;

/**
 * Só uma sessão ativa e válida conta: sem sessão guardada, com o Supabase
 * rejeitando o token ou sem papel cadastrado, o resultado é null e ninguém
 * é redirecionado para uma área.
 */
export async function getSessionInfo(): Promise<SessionInfo> {
  try {
    const { data: local } = await supabase.auth.getSession();
    if (!local.session) return null;
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    const { data: p, error: roleError } = await supabase
      .from("user_roles")
      .select("role, company_id")
      .eq("user_id", data.user.id)
      .maybeSingle();
    if (roleError || !p) return null;
    return { userId: data.user.id, role: p.role, companyId: p.company_id };
  } catch {
    return null;
  }
}

export const isStaff = (role: string) => role === "funcionario" || role === "dono";

/** Área inicial de cada papel depois da entrada. */
export const isOwner = (role: string) => role === "dono";

/** Área inicial de cada papel: admin → /admin, dono → /empresa, funcionário → /caixa, cliente → /cliente. */
export const homeFor = (role: string) =>
  role === "admin" ? "/admin" : role === "dono" ? "/empresa" : role === "funcionario" ? "/caixa" : "/cliente";
