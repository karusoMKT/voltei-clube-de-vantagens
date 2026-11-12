import type { QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type GoToEntrar = (opts: { to: "/entrar"; replace: true }) => unknown;

/**
 * Sai de verdade: para as buscas em andamento, esvazia o cache, encerra a
 * sessão no Supabase e volta para a entrada. A navegação acontece mesmo se o
 * Supabase falhar ao encerrar a sessão, então a tela de login nunca fica presa.
 */
export async function signOutAndLeave({
  queryClient,
  navigate,
}: {
  queryClient: QueryClient;
  navigate: GoToEntrar;
}): Promise<void> {
  await queryClient.cancelQueries();
  queryClient.clear();
  try {
    await supabase.auth.signOut();
  } finally {
    navigate({ to: "/entrar", replace: true });
  }
}
