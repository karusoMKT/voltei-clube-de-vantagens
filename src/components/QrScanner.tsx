import { useEffect, useRef, useState } from "react";

export function QrScanner({ onScan }: { onScan: (text: string) => void }) {
  const id = useRef(`qr-${Math.random().toString(36).slice(2)}`).current;
  const [erro, setErro] = useState<string | null>(null);
  const done = useRef(false);

  useEffect(() => {
    let scanner: { stop: () => Promise<void>; isScanning: boolean } | null = null;
    let cancelled = false;
    import("html5-qrcode").then(async ({ Html5Qrcode }) => {
      if (cancelled) return;
      const s = new Html5Qrcode(id);
      scanner = s;
      try {
        await s.start({ facingMode: "environment" }, { fps: 10, qrbox: 220 }, (text) => {
          if (done.current) return;
          done.current = true;
          onScan(text);
        }, () => {});
      } catch {
        setErro("Não conseguimos abrir a câmera. Libere o acesso ou use o telefone.");
      }
    });
    return () => {
      cancelled = true;
      if (scanner?.isScanning) scanner.stop().catch(() => {});
    };
  }, [id, onScan]);

  return (
    <div>
      <div id={id} className="aspect-square w-full overflow-hidden rounded-3xl bg-foreground/90" />
      {erro && <p role="alert" className="mt-3 rounded-2xl bg-cream px-4 py-3 text-sm font-semibold text-foreground">{erro}</p>}
    </div>
  );
}
