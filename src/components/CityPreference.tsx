import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CityPicker } from "./CityPicker";
import { Button } from "./ui/button";

const cls = "h-12 w-full rounded-2xl border border-border bg-card px-4 text-base text-foreground";

/** Troca a cidade do cliente (usada para filtrar a vitrine de lojas). */
export function CityPreference({ userId, city, compact }: { userId: string; city: string | null; compact?: boolean }) {
  const [value, setValue] = useState(city ?? "");
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();
  async function save() {
    const v = value.trim();
    if (v.length < 2 || v.length > 100) { toast.error("Escolha sua cidade."); return; }
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ city: v }).eq("id", userId);
    setSaving(false);
    if (error) { toast.error("Não conseguimos salvar sua cidade."); return; }
    toast.success("Cidade atualizada!");
    qc.invalidateQueries({ queryKey: ["cliente"] });
  }
  return (
    <div className={compact ? "space-y-2" : "space-y-3 rounded-3xl border border-border bg-card p-5"}>
      {!compact && <h2 className="text-lg font-extrabold">Minha cidade</h2>}
      <CityPicker id={compact ? "city-quick" : "city-profile"} value={value} onChange={setValue} className={cls} />
      <Button type="button" variant={compact ? "secondary" : "hero"} size="xl" className="w-full rounded-2xl" disabled={saving || value.trim() === (city ?? "")} onClick={save}>
        {saving ? "Salvando…" : "Salvar cidade"}
      </Button>
    </div>
  );
}
