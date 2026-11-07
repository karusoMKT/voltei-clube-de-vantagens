import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ImagePlus, Upload, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/Empty";
import { clienteQuery, photosQuery } from "@/lib/cliente-data";
import { preparePhoto } from "@/lib/photo-image";
import { uploadPhoto } from "@/lib/photo.functions";

export const Route = createFileRoute("/cliente/foto")({
  head: () => ({ meta: [
    { title: "Envie seu print · Voltei" },
    { name: "description", content: "Envie o print da sua marcação para ganhar pontos no Voltei." },
    { property: "og:title", content: "Envie seu print · Voltei" },
    { property: "og:description", content: "Sua marcação vale pontos no clube da loja." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Foto,
});

function Foto() {
  const { data, isPending } = useQuery(clienteQuery);
  const { data: photos } = useQuery(photosQuery);
  const qc = useQueryClient();
  const send = useServerFn(uploadPhoto);
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  const upload = useMutation({
    mutationFn: async () => {
      if (!file || !data?.membership) throw new Error("Escolha seu print para enviar.");
      const form = new FormData();
      form.set("companyId", data.membership.companyId);
      form.set("file", file);
      const result = await send({ data: form });
      if (!result.ok) throw new Error(result.message);
    },
    onSuccess: () => { setFile(null); setError(null); qc.invalidateQueries({ queryKey: ["cliente"] }); },
    onError: (e) => setError(e.message),
  });
  if (isPending || !data) return <Loading />;
  const pending = photos?.some((p) => p.status === "pendente");
  return <div className="space-y-5 px-5 pt-5">
    <Button asChild variant="ghost" className="h-12 px-0 text-primary"><Link to="/cliente"><ArrowLeft /> Início</Link></Button>
    <h1 className="text-2xl font-extrabold leading-tight text-foreground">Envie o print da sua marcação</h1>
    <ol className="space-y-4 rounded-3xl bg-card p-5">
      {["Poste uma foto ou story marcando o @ da loja", "Tire um print da marcação", "Envie o print aqui"].map((step, i) =>
        <li key={step} className="flex items-center gap-3 text-sm font-semibold"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">{i + 1}</span>{step}</li>)}
    </ol>
    {pending || upload.isSuccess ? <div role="status" className="flex gap-3 rounded-2xl bg-secondary p-5 font-bold"><CheckCircle2 className="h-6 w-6 shrink-0 text-primary" />Foto enviada, aguardando aprovação.</div> : <>
      <div className="flex items-center justify-between gap-3"><h2 className="font-extrabold">Seu print</h2><span className="text-sm font-bold text-primary">+{data.membership?.photoPoints ?? 30} pontos</span></div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" aria-label="Escolher print" className="sr-only" disabled={preparing || upload.isPending} onChange={async (e) => {
        const chosen = e.target.files?.[0];
        e.target.value = "";
        if (!chosen) return;
        setPreparing(true); setError(null); setFile(null);
        try { setFile(await preparePhoto(chosen)); }
        catch (e) { setError(e instanceof Error ? e.message : "Não conseguimos abrir esta imagem."); }
        finally { setPreparing(false); }
      }} />
      {preview && <img src={preview} alt="Prévia do print escolhido" className="max-h-80 w-full rounded-2xl border border-border bg-card object-contain" />}
      <Button variant="outline" size="xl" className="rounded-2xl" disabled={preparing || upload.isPending} onClick={() => input.current?.click()}><ImagePlus />{preparing ? "Preparando print…" : preview ? "Trocar imagem" : "Escolher imagem"}</Button>
      <p className="text-sm text-muted-foreground">JPG, PNG ou WebP · até 8 MB</p>
      <p className="rounded-2xl bg-cream px-4 py-3 text-sm font-semibold">Os pontos chegam depois da aprovação da loja. Uma foto aprovada por dia.</p>
      <Button variant="hero" size="xl" disabled={!file || preparing || upload.isPending || !data.membership} onClick={() => upload.mutate()}><Upload />{upload.isPending ? "Enviando…" : "Enviar para aprovação"}</Button>
    </>}
    {error && <p role="alert" className="rounded-2xl bg-cream p-4 font-semibold">{error}</p>}
  </div>;
}