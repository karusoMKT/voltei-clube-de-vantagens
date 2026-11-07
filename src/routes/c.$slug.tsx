import { createFileRoute, notFound } from "@tanstack/react-router";
import { EntrarForm } from "@/components/EntrarForm";
import { getCompanyBySlug } from "@/lib/company.functions";

export const Route = createFileRoute("/c/$slug")({
  loader: async ({ params }) => {
    const company = await getCompanyBySlug({ data: { slug: params.slug } });
    if (!company) throw notFound();
    return company;
  },
  head: ({ loaderData }) => {
    const title = loaderData ? `${loaderData.name} no Voltei` : "Loja não encontrada · Voltei";
    return {
      meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
        { title },
        { name: "description", content: "Entre no clube e ganhe a cada volta." },
        { property: "og:title", content: title },
        { property: "og:description", content: "Pontos por compra, foto e indicação. Prêmios do seu jeito." },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="text-2xl font-extrabold text-foreground">Não achamos essa loja.</h1>
      <p className="mt-2 text-muted-foreground">Peça o link certo no balcão.</p>
    </div>
  ),
  component: Page,
});

function Page() {
  const c = Route.useLoaderData();
  return <EntrarForm slug={c.slug} companyName={c.name} />;
}
