# Sanity (`sanity/`)

The root [Global Rules](../AGENTS.md#global-rules) still apply. Architecture: [Academic Catalog](ARCHITECTURE-ACADEMIC-CATALOG.md).

* Follow the existing entity pattern (mini-schemas, "Create in Database"/"Sync with Database"/checked-delete actions) — see [`ARCHITECTURE-ACADEMIC-CATALOG.md`](ARCHITECTURE-ACADEMIC-CATALOG.md). A new academic entity extends `getDatabaseAcademicEndpoints` (`shared/utils/api.utils.ts`) and `parentFieldFor`/`parentColumnFor` (`sanity/actions/academicEntitySync.ts`) exhaustively (switch with no silent default) — no special cases.
* Publishing stays blocked until a document has a `dbId`, and deletion stays blocked on the internal API's dependency check (`409`). Don't bypass either.
* `SANITY_STUDIO_INTERNAL_SECRET` (Studio) and `INTERNAL_API_SECRET` (server) must match, and `SANITY_STUDIO_API_URL` must point at the real API outside local — check these before debugging Studio actions as a logic bug.
