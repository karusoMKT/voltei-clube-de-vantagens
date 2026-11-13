import { createContext, useContext, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { clienteQuery } from "@/lib/cliente-data";
import { activeMembership, companyRows } from "@/lib/multi-store";
import { Button } from "@/components/ui/button";
import { CompanyLogo } from "@/components/CompanyLogo";

const WalletContext = createContext<{ selected: string | null; select: (id: string) => void }>({ selected: null, select: () => {} });
export function CustomerWallet({ children }: { children: ReactNode }) {
  const [selected, select] = useState<string | null>(null);
  return <WalletContext.Provider value={{ selected, select }}>{children}</WalletContext.Provider>;
}
export function useCustomerWallet() {
  const { selected, select } = useContext(WalletContext);
  const query = useQuery(clienteQuery);
  const membership = activeMembership(query.data?.memberships ?? [], selected);
  return { ...query, select, companyId: membership?.companyId ?? null,
    data: query.data ? { ...query.data, membership, rewards: companyRows(query.data.rewards, membership?.companyId ?? null) } : undefined };
}
export function WalletSelector() {
  const { data, select } = useCustomerWallet();
  if (!data?.membership) return null;
  return <div className="px-5 pt-5">
    {data.memberships.length > 1 ? <div aria-label="Escolher loja" className="flex gap-3 overflow-x-auto pb-2">
      {data.memberships.map((m) => <Button key={m.companyId} variant="ghost" aria-pressed={m.companyId === data.membership?.companyId}
        onClick={() => select(m.companyId)} className={`h-auto min-h-24 w-28 shrink-0 flex-col gap-2 whitespace-normal rounded-2xl border p-2 ${m.companyId === data.membership?.companyId ? "border-primary bg-secondary" : "border-border bg-card"}`}>
        <CompanyLogo name={m.companyName} url={m.logoUrl} /><span className="w-full break-words text-center text-xs font-bold">{m.companyName}</span>
      </Button>)}
    </div> : <div className="flex items-center gap-3"><CompanyLogo name={data.membership.companyName} url={data.membership.logoUrl} /><div className="min-w-0"><p className="break-words font-extrabold">{data.membership.companyName}</p><p className="text-sm text-muted-foreground">{data.membership.city}</p></div></div>}
  </div>;
}
