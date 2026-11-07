import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { Loading } from "@/components/Empty";
import { clienteQuery, shortCode } from "@/lib/cliente-data";

export const Route = createFileRoute("/cliente/qr")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Meu QR · Voltei" },
      { name: "description", content: "Mostre no caixa antes de pagar." },
      { property: "og:title", content: "Meu QR · Voltei" },
      { property: "og:description", content: "Mostre no caixa antes de pagar." },
    ],
  }),
  component: MeuQr,
});

function MeuQr() {
  const { data, isPending } = useQuery(clienteQuery);
  if (isPending || !data) return <Loading />;
  const token = data.profile.qr_token;
  return (
    <div className="flex flex-col items-center px-5 pt-8 text-center">
      <h1 className="text-3xl font-extrabold text-foreground">{data.profile.full_name}</h1>
      <p className="mt-1 text-muted-foreground">Mostre no caixa antes de pagar.</p>
      <div className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-lg shadow-primary/10">
        <QRCodeSVG value={token} size={240} level="M" fgColor="var(--foreground)" bgColor="var(--card)" />
      </div>
      <p className="mt-8 text-sm font-bold text-muted-foreground">Ou diga seu código</p>
      <p className="mt-1 rounded-2xl bg-secondary px-6 py-3 text-3xl font-extrabold tracking-[0.25em] text-primary">
        {shortCode(token)}
      </p>
    </div>
  );
}
