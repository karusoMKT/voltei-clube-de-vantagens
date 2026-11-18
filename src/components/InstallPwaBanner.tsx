import { useEffect, useState } from "react";
import { Download, Share, SquarePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DISMISS_KEY, isDismissed, isIosSafari } from "@/lib/install-banner";

type PromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export function InstallPwaBanner() {
  const [prompt, setPrompt] = useState<PromptEvent | null>(null);
  const [mode, setMode] = useState<"none" | "android" | "ios">("none");

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches
      || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone || isDismissed(localStorage.getItem(DISMISS_KEY))) return;
    if (isIosSafari(navigator.userAgent)) { setMode("ios"); return; }
    const onPrompt = (e: Event) => { e.preventDefault(); setPrompt(e as PromptEvent); setMode("android"); };
    const onInstalled = () => setMode("none");
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => { window.removeEventListener("beforeinstallprompt", onPrompt); window.removeEventListener("appinstalled", onInstalled); };
  }, []);

  if (mode === "none") return null;
  const dismiss = () => { localStorage.setItem(DISMISS_KEY, String(Date.now())); setMode("none"); };
  const install = async () => {
    if (!prompt) return;
    await prompt.prompt();
    await prompt.userChoice;
    setPrompt(null); setMode("none");
  };

  return (
    <div className="px-5 pt-4">
      <section className="relative rounded-2xl border border-border bg-card p-4 pr-12 shadow-sm" aria-label="Instalar o app Voltei">
        <Button type="button" variant="ghost" size="icon" onClick={dismiss} aria-label="Fechar" className="absolute right-1 top-1 h-12 w-12 rounded-2xl text-muted-foreground">
          <X className="h-5 w-5" />
        </Button>
        {mode === "android" ? (
          <>
            <p className="font-bold text-foreground">Instale o app Voltei no seu celular para acessar seus pontos mais rápido</p>
            <div className="mt-3 flex gap-2">
              <Button type="button" onClick={install} className="min-h-12 flex-1 rounded-2xl font-bold"><Download />Instalar agora</Button>
              <Button type="button" variant="outline" onClick={dismiss} className="min-h-12 rounded-2xl font-bold">Agora não</Button>
            </div>
          </>
        ) : (
          <>
            <p className="font-bold text-foreground">Para instalar o Voltei:</p>
            <ol className="mt-2 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><Share className="h-5 w-5 shrink-0 text-primary" />Toque em <b className="text-foreground">Compartilhar</b> na barra inferior.</li>
              <li className="flex items-center gap-2"><SquarePlus className="h-5 w-5 shrink-0 text-primary" />Escolha <b className="text-foreground">Adicionar à Tela de Início</b>.</li>
            </ol>
            <Button type="button" variant="outline" onClick={dismiss} className="mt-3 min-h-12 w-full rounded-2xl font-bold">Agora não</Button>
          </>
        )}
      </section>
    </div>
  );
}
