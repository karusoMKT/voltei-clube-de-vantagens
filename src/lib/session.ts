import { supabase } from "@/integrations/supabase/client";

export type SessionInfo = { userId: string; role: string; companyId: string | null } | null;

export async function getSessionInfo(): Promise<SessionInfo> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const { data: p, error } = await supabase.from("user_roles").select("role, company_id").eq("user_id", data.user.id).maybeSingle();
  if (error || !p) return null;
  return { userId: data.user.id, role: p.role, companyId: p.company_id };
}

export const isStaff = (role: string) => role === "funcionario" || role === "dono";
