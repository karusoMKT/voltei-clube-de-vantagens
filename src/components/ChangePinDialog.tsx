import { useState } from "react";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { TrocarPin } from "@/components/TrocarPin";

export function ChangePinDialog() {
  const [open, setOpen] = useState(false);
  return <>
    <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl text-muted-foreground" title="Alterar meu PIN" aria-label="Alterar meu PIN" onClick={() => setOpen(true)}><KeyRound className="h-4 w-4" /></Button>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl">
      <DialogHeader><DialogTitle>Alterar meu PIN</DialogTitle><DialogDescription>Confirme seu PIN atual e escolha o novo.</DialogDescription></DialogHeader>
      {open && <TrocarPin />}
    </DialogContent></Dialog>
  </>;
}