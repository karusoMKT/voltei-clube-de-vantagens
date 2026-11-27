import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listCities } from "@/lib/referral.functions";
import { cityOptions } from "@/lib/cities";

/** Campo de cidade com sugestões (padrão + cidades das lojas); aceita outra cidade digitada. */
export function CityPicker({ value, onChange, id = "city", className, invalid }: { value: string; onChange: (v: string) => void; id?: string; className?: string; invalid?: boolean }) {
  const fetchCities = useServerFn(listCities);
  const { data } = useQuery({ queryKey: ["cidades"], queryFn: () => fetchCities(), staleTime: 300_000 });
  const options = cityOptions(data ?? []);
  return (
    <>
      <select id={id} aria-label="Sua cidade" aria-invalid={invalid} className={className} value={options.includes(value) ? value : value ? "__outra" : ""}
        onChange={(e) => onChange(e.target.value === "__outra" ? " " : e.target.value)}>
        <option value="">Escolha sua cidade</option>
        {options.map((c) => <option key={c} value={c}>{c}</option>)}
        <option value="__outra">Outra cidade</option>
      </select>
      {value && !options.includes(value) && (
        <input aria-label="Nome da cidade" className={`${className} mt-2`} placeholder="Digite sua cidade" value={value.trimStart()} onChange={(e) => onChange(e.target.value || " ")} />
      )}
    </>
  );
}
