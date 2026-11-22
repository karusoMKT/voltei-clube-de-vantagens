import { createFileRoute } from "@tanstack/react-router";
import { timingSafeEqual } from "crypto";

function authorized(request: Request) {
  const secret = process.env["ALERTS_CRON_SECRET"];
  const got = request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
  if (!secret || got.length !== secret.length) return false;
  return timingSafeEqual(Buffer.from(got), Buffer.from(secret));
}

export const Route = createFileRoute("/api/public/alerts/$job")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        if (!authorized(request)) return new Response("Unauthorized", { status: 401 });
        const { runAbsentClients, runMonthlySummary } = await import("@/lib/alerts.server");
        try {
          if (params.job === "absent-clients") return Response.json({ ok: true, results: await runAbsentClients() });
          if (params.job === "monthly-summary") return Response.json({ ok: true, results: await runMonthlySummary() });
          return new Response("Not found", { status: 404 });
        } catch (e) {
          console.error("alerts job failed", e);
          return Response.json({ ok: false, error: e instanceof Error ? e.message : "erro" }, { status: 500 });
        }
      },
    },
  },
});
