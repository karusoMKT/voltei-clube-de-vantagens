import { supabase } from "@/integrations/supabase/client";

export type SessionInfo = { userId: string; role: string; companyId: string | null } | null;

export async function getSessionInfo(): Promise<SessionInfo> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const { data: p } = await supabase.from("profiles").select("role, company_id").eq("id", data.user.id).maybeSingle();
  return { userId: data.user.id, role: p?.role ?? "cliente", companyId: p?.company_id ?? null };
}

export const isStaff = (role: string) => role === "funcionario" || role === "dono";
