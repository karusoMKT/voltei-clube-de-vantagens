import { useState } from "react";
import { Store } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function CompanyLogo({ name, url, large = false }: { name: string; url?: string | null | undefined; large?: boolean }) {
  const [failed, setFailed] = useState<string | null>(null);
  const marker = "/storage/v1/object/public/company-logos/";
  const path = url?.includes(marker) ? url.split(marker)[1] : undefined;
  // Signed URLs also work while the workspace blocks public buckets.
  const { data: signed } = useQuery({ queryKey: ["company-logo", url], enabled: !!path, staleTime: 45 * 60 * 1000, queryFn: async () => {
    if (!path) return null;
    const { data } = await supabase.storage.from("company-logos").createSignedUrl(path, 3600);
    return data?.signedUrl ?? null;
  } });
  const src = signed ?? url;
  return <span className={`flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-card text-primary ${large ? "h-16 w-16" : "h-12 w-12"}`}>
    {src && failed !== src ? <img src={src} alt={`Logo de ${name}`} className="h-full w-full object-contain" onError={() => setFailed(src)} /> : <Store className={large ? "h-8 w-8" : "h-6 w-6"} />}
  </span>;
}
