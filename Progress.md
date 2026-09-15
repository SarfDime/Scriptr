# Scriptr: Progress & Todos

What's built, what's outstanding. See `ARCHITECTURE.md` for how the finished
pieces are designed to work.

> **Standing rule, not a todo:** any change to the Postgres schema or the
> Sanity schema must be followed by `npm run gen:api-types` /
> `npm run sanity:typegen` and a full `npm run check-types` before the change
> is considered done — every time, not just when something below calls it
> out. Treat a schema change as incomplete until types are regenerated and
> the workspace typechecks clean.

## Backend API (`hono/`)

### Done

* Full schema: `profiles`, `scripts`/`script_files`, catalog tables + junctions, `profile_faculties`/`profile_studies`/`profile_subjects`, `download_events`, `flags`, `comments` + reactions/likes, `votes`, `script_favorites`, `rating_types`/`professor_ratings`/`subject_ratings`, `achievement_definitions`/`profile_achievements`, `notifications` (schema only — see Todo). **[✅]**
* DB constraints, indexes, and validation (Portable Text size caps, score/status `CHECK`s, unique constraints). **[✅]**
* Full catalog read/write API, gated by `x-internal-secret`, always on the service-role client — universities, faculties, studies, subjects, professors, and every junction table. **[✅]**
* Scripts: multi-file upload with per-file type/size validation, Portable Text title/description, single-subject constraint, auto-resolved hierarchy, professor validation, author/admin edit/delete, fuzzy search, faculty-scoped listing when a session is present. **[✅]**
* Download deduplication (account → IP → device), service-role only. **[✅]**
* Comments: script/professor/user threads, replies, reactions, likes (like is exempt from restriction), author/admin edit/delete, admin flagged-list view. **[✅]**
* Flags: create/view-own/delete-own for any user, admin list/resolve via direct `SELECT`/`UPDATE` RLS (no service-role needed), `is_flagged` sync on the target when the last pending flag is dismissed. **[✅]**
* Votes: atomic toggle via a `security definer` RPC, restriction-checked on cast, clamped at zero. **[✅]**
* Favorites: idempotent add/remove, exempt from restriction, scripts returned through the public column allowlist (no `is_flagged` leak). **[✅]**
* Profile selections: `profile-faculties`, `profile-studies`, `profile-subjects` — structurally identical own-resource CRUD, session-client, `profile_id = auth.uid()` RLS. **[✅]**
* Profiles: public list/lookup/stats, `me` read/update/delete, admin `PATCH`/`DELETE /profiles/:id` (session-client, `is_admin()` RLS), internal-only role changes. Stale `profiles.achievements` jsonb references removed in favor of `profile_achievements`/`achievement_definitions`. **[✅]**
* Ratings: full CRUD — public rating-type catalog with admin-only mutation, professor/subject rating create/update (upsert) with restriction checks, stats aggregation, removal (not restriction-checked), trigger-driven target-type validation mapped to a clean `400`. **[✅]**
* Auth: register/login/logout/session/refresh via Supabase Auth cookie, no Bearer-token path. **[✅]**
* Moderator role fully removed from access checks — every elevated-access check in the API is `is_admin()`, nowhere does backend code branch on `role === 'moderator'`. **[✅]**
* Admin "view all flags" resolved — admins have direct `SELECT`/`UPDATE` RLS on `flags`; no service-role workaround needed. **[✅]**
* `API_DOCUMENTATION.md` and `API_TESTING_GUIDE.md` fully reconciled with the live schema and route set (end-to-end curl walkthrough covering every route, including teardown). **[✅]**
* **Universities: full CRUD + sync** — `universities.ts` previously only had `GET /` and `GET /:id`; `POST`/`PATCH`/`DELETE`/`POST .../sync` under `/api/internal/universities` added, matching the pattern of professors/studies/subjects. Delete is blocked at the application level by an explicit `faculties` dependents check, independent of the underlying FK (see below). This also means the Sanity "Create in Database"/"Sync"/"Delete" actions for universities, which were calling endpoints that 404'd, now actually work. **[✅]**
* **`ratings.ts` mounted in `index.ts`** — the full ratings route file (rating types, professor/subject ratings, all documented in `API_DOCUMENTATION.md` from the start) existed but was never `.route()`d into the app. Every `/ratings/*` endpoint was dead/unreachable in production until this was caught and fixed. **[✅]**

### Todo

* **Notifications CRUD** — list/mark-read/delete a user's own notifications. Schema exists; no endpoint yet. **[🔲]**
* **Achievement award-check helper** — compare a metric against `achievement_definitions.threshold`, insert into `profile_achievements` + a matching notification, wired into the relevant mutation endpoints (vote, download, comment). Not started. **[🔲]**
* **User restriction management endpoint** — `profile_restrictions` insert/delete for an admin to restrict/unrestrict a user. RLS is `is_admin()`-gated and ready; no route exists. **[🔲]**
* **Portable Text block-type allow-list validation, server-side** — the Postgres `CHECK` only confirms "valid JSON array under the size limit," not the recursive block/mark structure. Currently unenforced at the API layer. **[🔲]**
* **Individual script file removal** — RLS already supports author/admin `DELETE` on `script_files`; no endpoint removes a single file without deleting the whole script. **[🔲]**
* **Achievement definitions CRUD** — admin create/update/delete for `achievement_definitions` (`is_admin()` RLS-ready, same pattern as rating types); currently only the public read exists (joined into `profiles.ts` responses). **[🔲]**
* **Moderator notification pipeline** — repeated flags notifying moderators, a moderator's own flag escalating to admins. Fully deferred, no schema or backend work started; explicitly out of scope for now (see `ARCHITECTURE.md` §6). **[🔲 Deferred]**
* **`faculties_university_id_fkey` is `ON DELETE CASCADE`** — inconsistent with the app-level dependents-check pattern used for universities/studies/subjects/professors. A raw SQL delete of a university would still cascade through faculties → studies → subjects → scripts regardless of the new app-level check. Not changed this round; needs a decision on whether to convert to `RESTRICT` for defense in depth. **[🔲]**
* **`API_TESTING_GUIDE.md` refresh** — stale against the multi-file upload contract change and the new universities mutation routes; needs a pass once someone can supply its current content. **[🔲]**

## R2 / File Storage (`hono/`)

### Done

* **Multi-file upload support in `file-ops.ts`** — `POST /file-ops/upload` now accepts one or more files per request via a `zValidator` form schema (`files`, normalized to an array; a single file still works). Response returns one `{ fileKey, fileType, fileSizeBytes, bucket }` entry per file. **[✅]**
* **R2 object keys restructured around the academic hierarchy, using dbIds** — key shape is `{facultyId}/{studyId}/{subjectId}/{userId}/{uuid}.{ext}`, resolved server-side from an optional `subjectId` passed to the upload call. Falls back to a plain `{userId}/...` key if `subjectId` is omitted or doesn't resolve. **[✅]**
* **University-scoped R2 buckets** — `universities.r2_bucket_id` column added (nullable, unique, `CHECK`-constrained to S3/R2 bucket naming rules). `resolveStorageScope()` in `file-ops.ts` resolves the bucket from the upload's subject → study → faculty → university chain, falling back to the default `R2_BUCKET` env var when unset or unresolvable. `GET /file-ops/get-file/*` takes an optional `?bucket=` query param to match. **[✅]**
* **`script_files.bucket` column** — added (`text not null`) so a stored file's bucket is known at download time, since a bare key no longer implies one global bucket. Persisted on `POST /scripts` insert, exposed in every public script response's `files` array. **[✅]**

### Todo

* **Sanity: `r2BucketId` field on the University schema** — proposed and drafted this round (field on `university.ts`, wired into `academicEntitySync.ts`'s `buildDatabasePayload` for the university branch) but not confirmed applied/tested against the live Studio. Verify before treating as done. **[🔲 unconfirmed]**
* **Restriction enforcement and R2 cleanup**: still explicitly deferred to future scope, unchanged from before this round. **[🔲 Deferred]**

## Sanity CMS (`sanity/`)

### Done

* Finalized models, relationships, and initialization sets for all 5 entities. **[✅]**
* "Create in Database" action, publish-blocking until a DB id exists, and sync-with-database action, for all entity types. **[✅]**
* Programmatic slug generation and reusable mini-schemas. **[✅]**
* Dependency-checked delete action (blocks deletion via the internal API's `409` responses). **[✅]**
* `parentFieldFor`/`parentColumnFor` made exhaustive (previously silently defaulted to `faculty`/`faculty_id` for unhandled entity types). **[✅]**
* **Confirm environment wiring**: `INTERNAL_API_SECRET` (server) and `SANITY_STUDIO_INTERNAL_SECRET` (Studio) are set and matching; `SANITY_STUDIO_API_URL` points at the real API for the deployed Studio (defaults to `localhost:8787` otherwise, which silently breaks every Studio action in production). **[✅]**

### Todo

* **Verify deletion/sync workflows end-to-end** — previously logged as broken, but untested recently; status unconfirmed. Check before assuming it's fixed or still failing. Now doubly relevant since universities gained real mutation routes to sync/delete against for the first time. **[🔲]**
* Test all sync workflows (create/update/delete) across all entity types. **[🔲]**

## API Client Architecture (`shared/`, `next/`)

### Done

* **Hono RPC client (`hc<AppType>`) evaluated and abandoned.** Chaining every route file's own Hono instance into one continuous expression (required for RPC types to work at all — a `let x = ...; x = x.get(...)` reassignment pattern was tried first and does *not* work, since a `let` binding's static type is fixed at declaration and doesn't update on reassignment) surfaced a harder, unresolved problem: with ~140+ endpoints across 19 route files composed into one `AppType`, referencing that type anywhere (even a single property access) forced full type instantiation, degrading `tsc`/`tsserver` to the point of hanging the editor. Splitting into per-route-file typed clients helped but didn't fully resolve it. Decision: dropped the Hono RPC client approach entirely; all route files and `index.ts` reverted back to standalone (non-chained) route statements, since nothing depends on `AppType` anymore. **[✅ decision made]**
* **Generated `apiRoutes` + `apiFetch` replaces it.** `shared/config/api-routes.ts` (auto-generated, do not hand-edit — see below) exports an `ApiEndpoint` template-literal type covering every route path and an `apiRoutes` object of path-builder functions/constants, generated from `shared/config/api.ts`'s manual config (`ACADEMIC_TYPES`, `QUERY_CONFIG` for endpoints needing query-string params). `next/lib/api.ts`'s `apiFetch` wraps `fetch` with JSON/FormData body handling and centralized error parsing; callers pass `apiRoutes.x.y(...)` straight into it (e.g. `apiFetch(apiRoutes.scripts.popular(limit), { next: { tags: [...] } })`). `shared/utils/api.utils.ts` adds `apiUrl()` (combines a base URL with an `ApiEndpoint`) and `getDatabaseAcademicEndpoints()` (maps an `AcademicEntityType` to its `apiRoutes.internal.*` create/sync/byId functions, replacing the old flat `ENDPOINTS` record). **[✅]**
* `academicEntitySync.ts` (Sanity) and `scripts-api.ts` (Next) both migrated off hardcoded path strings onto the generated `apiRoutes`. **[✅]**
* **Created `apiRoutes` and `apiFetch` as the centralized API client mechanism.** All existing and future API calls should go through this system to ensure consistency and leverage the generated route types. **[✅]**
* `apiRoutes` is auto generated on dev or with `npm run generate-api-routes`. **[✅]**

### Todo

* **Regeneration command for `shared/config/api-routes.ts` undocumented.** It's marked auto-generated with a script that introspects the route tree, but the exact `npm run ...` invocation wasn't captured this round — add it to `AGENTS.md`'s generated-files list once known, alongside the existing `NEVER hand-edit` entries. **[🔲]**
## Shared Types (`shared/`)

### Done

* **Sanity TypeGen output relocated to `shared/types/`** — previously generated into `next/sanity.types.ts`; every workspace (`next/`, `hono/`, `sanity/`) now imports the same generated Sanity types from `shared/types/` instead of each maintaining its own copy. **[✅]**
* **Academic entity types derived from Sanity query-result types, not hand-written** — `MinimalStudy`, `StudyDetail`, and the equivalent types for every other academic entity are now defined as `NonNullable<WithResolvedSanityData<XTypedQueryResult>>` instead of a manually maintained shape. This closes off the class of bug where a hand-written type quietly drifts from what its GROQ query actually returns. **[✅]**
* **`WithResolvedSanityData` generalized beyond pictures** (`shared/types/sanity-transform.types.ts`) — recursively resolves three structural mismatches TypeGen can't express on its own: `picture` fields guarded by `defined(picture)=>{...}` in GROQ are narrowed from nullable to `SanityImageType`; Portable Text fields (`description`/`bio` by default, configurable via a type param) are forced `NonNullable`; and the `media: unknown` field TypeGen emits for Portable Text image blocks is widened to `Record<string, unknown>` so it's actually usable. Same caveat as before: this only changes the type, so it's only safe at call sites where the underlying query actually guarantees what the type now claims (`defined()` guards for pictures, reliably-populated rich text). **[✅]**
* **`hono/src/sanity-stub.d.ts`** — a minimal module-augmentation stub for `@sanity/client`'s `SanityQueries` interface, so `hono/` can import Sanity-generated types without installing `@sanity/client` as a real dependency. TypeGen's output augments that module; TypeScript needs the module to exist to resolve the augmentation even though `hono/` never instantiates a Sanity client. **[✅]**
* All type imports across the project re-sorted/organized to match the new `shared/types/` layout; `npm run check-types` clean across every workspace. **[✅]**

## Frontend (`next/`)

### Done

+ Dynamic slug-based pages for university/faculty/study/subject/professor, replacing ID-based routing; superseded by the nested URL structure below. **[✅]**
* Script listing, sorting, and filtering. **[✅]**
* Nested academic catalog routing live: `/university/[slug]/faculty/[slug]/study/[slug]/subject/[slug]`, professor pages flat at `/professor/[slug]`. Covers route folders, ancestor-scoped GROQ queries (Sanity slugs are only unique per-parent, so each level's query filters on its parent chain, not just its own slug), `getAcademicPath`/`AcademicDetailPageProps` generalized to a discriminated union / generic params shape, and every card/breadcrumb link updated to build full ancestor-chain URLs. **[✅]**

### Todo

* Update subject pages to display parent study. **[🔲]**
* Update script rendering for multiple files and Portable Text title/description (shared, allow-listed serializer). **[🔲]**
* Script search (local-first + API fallback). **[🔲]**
* Loading, empty, and error states across pages and search. **[🔲]**
* Create-script modal/upload flow: Portable Text editor, exam session, additional reading links, multi-file upload with per-file validation and reordering. **[🔲]**
* Script edit/delete permission handling in the UI. **[🔲]**
* Guest download/preview access with dedupe protection. **[🔲]**
* Clear "you've been restricted" UI state, distinct from a generic error. **[🔲]**
* Professor/subject rating UI (multi-type, 1–5 scale). **[🔲]**
* First-visit onboarding (university/faculty/study/subject selection), with one-click year completion. **[🔲]**
* Persist guest academic data in local storage; sync to DB profiles on account creation. **[🔲]**
* Dismissible, persistent account-creation reminder. **[🔲]**
* Profile page grouping academic/enrollment data and earned achievements. **[🔲]**
* Admin UI: academic entity sync + dependency checks, `professor_studies` management, user restriction management, flag resolution (all session-client-eligible once the corresponding backend endpoints above are done). **[🔲]**
* Frontend moderation views (flags for scripts/users/comments) — backend is unblocked (admin flag listing works), so this can proceed now. **[🔲]**
* Suspicious-download review flow. **[🔲]**
* Notification delivery UI, preferences/settings, once the backend notification CRUD exists. **[🔲]**
* General polish: UX consistency, mobile behavior, accessibility, CSS obfuscation for production builds. **[🔲]**

## Suggested Order

1. Notifications CRUD + achievement award-check helper (they're linked — awarding an achievement is expected to also write a notification).
2. User restriction management endpoint (small, `is_admin()`-gated, unblocks the restriction UI).
3. Sanity: verify the deletion/sync workflow and environment wiring before building anything new on top of it — now doubly relevant with universities' new mutation routes.
4. Frontend: script upload flow and rendering (title/description/files), since scripts are the core content type and several other frontend todos depend on it.