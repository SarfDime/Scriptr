# Sanity (`sanity/`)

The root [Global Rules](../AGENTS.md#global-rules) still apply. Architecture: [Academic Catalog](ARCHITECTURE-ACADEMIC-CATALOG.md).

* Follow the existing entity pattern (mini-schemas, "Create in Database"/"Sync with Database"/checked-delete actions) — see [`ARCHITECTURE-ACADEMIC-CATALOG.md`](ARCHITECTURE-ACADEMIC-CATALOG.md). A new academic entity extends `getDatabaseAcademicEndpoints` (`shared/utils/api.utils.ts`) and `parentFieldFor`/`parentColumnFor` (`sanity/actions/academicEntitySync.tsx`) exhaustively (switch with no silent default) — no special cases.
* Publishing stays blocked until a document has a `dbId`, and deletion stays blocked on the admin API's dependency check (`409`). Don't bypass either.
* **New env var → startup checklist:** add it to `ENV_REQUIREMENTS` in `sanity/lib/startup-report.ts`; `scripts/check-env.ts` prints it before `sanity dev`/`sanity build`. Anything named `SANITY_STUDIO_*SECRET*` is already flagged there as a bundle leak.
* The Studio holds **no secret**. Every `SANITY_STUDIO_*` value is inlined into the deployed bundle, which anyone can download, so API access comes from a TOTP code exchanged for a twenty-minute token (`sanity/lib/api-access.ts`). Never add a `SANITY_STUDIO_*API_SECRET`-style variable back, and route every admin call through `adminFetch` rather than `fetch`.
* `SANITY_STUDIO_API_URL` must point at the real API outside local — check that before debugging Studio actions as a logic bug.
