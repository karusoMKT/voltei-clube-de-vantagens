import { useEffect, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { CompanyLogo } from "./CompanyLogo";
import { validatePhotoFile } from "@/lib/photo-rules";

export function CompanyLogoInput({ file, onChange, url }: { file: File | null; onChange: (file: File | null) => void; url?: string | null | undefined }) {
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  useEffect(() => { if (!file) { setPreview(null); return; } const objectUrl = URL.createObjectURL(file); setPreview(objectUrl); return () => URL.revokeObjectURL(objectUrl); }, [file]);
  return <div className="space-y-2"><p className="font-bold">Foto / logo</p><div className="flex items-center gap-3">
    <CompanyLogo name="Prévia" url={preview ?? url} large />
    <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="Logo da empresa" onChange={(e) => { const chosen = e.target.files?.[0]; e.target.value = ""; if (!chosen) return; try { validatePhotoFile(chosen); onChange(chosen); } catch (e) { toast.error(e instanceof Error ? e.message : "Imagem inválida."); } }} />
    <Button type="button" variant="outline" className="min-h-12 rounded-2xl" onClick={() => input.current?.click()}><ImagePlus />{file || url ? "Trocar logo" : "Escolher logo"}</Button>
    {file && <Button type="button" variant="ghost" size="icon" aria-label="Cancelar nova logo" onClick={() => onChange(null)}><X /></Button>}
  </div><p className="text-xs text-muted-foreground">JPG, PNG ou WebP · até 8 MB</p></div>;
}
