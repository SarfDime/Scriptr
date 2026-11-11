# Database & Supabase

The root [Global Rules](../AGENTS.md#global-rules) still apply. Architecture: [System Overview](ARCHITECTURE-SYSTEM-OVERVIEW.md) (access control) and [Academic Catalog](ARCHITECTURE-ACADEMIC-CATALOG.md) (internal-secret write path).

* RLS is the real authorization boundary, not the route handler — before writing or reviewing a query, check what RLS actually grants (`pg_policies`) rather than assuming from the table's category. Two tables that look alike (e.g. `professor_ratings` vs. `professors`) can have opposite access models.
* Client choice per query, not per file: `createSupabaseClient` when RLS alone grants the caller (own resource, or `is_owner()`-gated); `createInternalSupabaseClient` only where no RLS path exists for the caller at all (catalog tables, `download_events`, notification/achievement inserts, role changes). Backwards = a silent 403 or a bypassed check — see [`API_DOCUMENTATION.md#client-access-patterns`](../hono/src/routes/API_DOCUMENTATION.md#client-access-patterns).
* Check the live schema (policies, constraints, triggers) or `hono/supabase/migrations` before writing a route against a table you haven't verified this session; don't trust a doc or a memory of the schema.
* Never leak raw Postgres errors; map at the route: `23505` → `409`, `23503` (FK) → `409` naming the dependent, `42501` (RLS) → `403`, `P0001` → `400` with the message as-is.
* **`profiles.role` has no `authenticated` grant on purpose.** The table-wide UPDATE
  privilege was revoked and only `(username, full_name)` granted back
  (`20261029120000_revoke_profile_avatar_url_write.sql`). Re-granting table UPDATE
  would let any signed-in user promote themselves — directly through PostgREST,
  since the profiles UPDATE policy allows `id = auth.uid()`. Role changes therefore
  run on the service-role client (`PATCH /api/admin/profiles/:id/role`), and adding
  another writable profile column means granting that column, not the table.
