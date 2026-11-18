import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { maskPhone } from "@/lib/cadastro";

export type AccessData = { name: string; phone: string; company: string; pin: string; link: string };

/** Card de confirmação do acesso criado: dados do dono + botão de envio no WhatsApp. */
export function AccessSuccess({ data, onClose }: { data: AccessData; onClose: () => void }) {
  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-border bg-card p-4">
        <p className="text-base font-extrabold text-foreground">Acesso criado!</p>
        <p className="mt-1 text-sm text-muted-foreground">Confira os dados antes de enviar.</p>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Dono</dt>
            <dd className="break-words text-right font-extrabold text-foreground">{data.name}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Loja</dt>
            <dd className="break-words text-right font-extrabold text-foreground">{data.company}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">WhatsApp</dt>
            <dd className="font-extrabold text-foreground">{maskPhone(data.phone)}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">PIN provisório</dt>
            <dd className="rounded-2xl bg-secondary px-3 py-1 font-extrabold tracking-[0.3em] text-foreground">{data.pin}</dd>
          </div>
        </dl>
      </div>
      <Button asChild variant="whatsapp" size="xl" className="w-full rounded-2xl">
        <a href={data.link} target="_blank" rel="noreferrer"><MessageCircle />Enviar Acesso no WhatsApp</a>
      </Button>
      <Button variant="ghost" size="xl" className="w-full rounded-2xl" onClick={onClose}>Fechar</Button>
    </div>
  );
}
