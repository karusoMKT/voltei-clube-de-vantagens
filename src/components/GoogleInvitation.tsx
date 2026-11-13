import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { showGoogleInvitation } from "@/lib/satisfaction";

export function GoogleInvitation({ submitted, url }: { submitted: boolean; url: string | null }) {
  if (!showGoogleInvitation(submitted, url) || !url) return null;
  return <div className="space-y-3">
    <p className="text-sm text-muted-foreground">Quer compartilhar sua experiência no Google? É opcional, sem pontos extras.</p>
    <Button asChild variant="outline" size="xl" className="w-full rounded-2xl"><a href={url} target="_blank" rel="noopener noreferrer"><ExternalLink />Avaliar no Google</a></Button>
  </div>;
}