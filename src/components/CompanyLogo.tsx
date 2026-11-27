import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "?";
}

export function CompanyLogo({ name, url, large = false }: { name: string; url?: string | null | undefined; large?: boolean }) {
  const [failed, setFailed] = useState<string | null>(null);
  // Private bucket: always sign the stored path (never rely on public URLs).
  const match = url?.match(/\/company-logos\/(.+?)(\?|$)/);
  const path = match?.[1];
  const local = url?.startsWith("blob:") ? url : null;
  const { data: signed } = useQuery({ queryKey: ["company-logo", path], enabled: !!path, staleTime: 45 * 60 * 1000, queryFn: async () => {
    const { data } = await supabase.storage.from("company-logos").createSignedUrl(path!, 3600);
    return data?.signedUrl ?? null;
  } });
  const src = local ?? signed ?? null;
  return <span className={`flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-secondary font-extrabold text-primary ${large ? "h-16 w-16 text-xl" : "h-12 w-12 text-base"}`}>
    {src && failed !== src ? <img src={src} alt={`Logo de ${name}`} className="h-full w-full bg-card object-cover" onError={() => setFailed(src)} /> : <span aria-label={`Logo de ${name}`}>{initials(name)}</span>}
  </span>;
}
