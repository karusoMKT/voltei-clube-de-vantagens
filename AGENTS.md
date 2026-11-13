<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

- Store authorization roles and company assignments only in protected `public.user_roles`; read them for navigation and enforce access inside database functions and RLS, never in editable profiles.
- Keep repeatable access-control tests alongside existing tests; opt-in live checks use environment-injected test tokens and never store credentials in source.
- Photo files go through authenticated server validation before privileged storage upload; database RPCs enforce review limits atomically, and reads use user-scoped private storage access.
- Photo approval days use America/Sao_Paulo so daily limits follow the Brazilian store calendar.
- Company reward and rate mutations use staff-authorized RPCs; monthly summaries aggregate in Postgres with RLS to avoid row-limit truncation.
- Monthly summaries use America/Sao_Paulo; member count is all current members, positive point transactions and redemption creations count in the month, and never-purchasers become inactive after their membership is older than the inactivity window.
- Role areas: admin→/admin, dono→/empresa (owner-only management), funcionario and dono→/caixa (checkout + reward delivery only); reward/rate/summary RPCs check is_owner_of or is_admin, so cashiers stay out even via API.
- Satisfaction rewards use a dedicated atomic RPC and unique customer/company response; all scores earn the same configured points, and Google invitations are independent of scores to avoid review gating.
