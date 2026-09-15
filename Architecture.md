# Scriptr: Architecture & Requirements

This describes the system as it currently stands. For what's built vs. still
outstanding, see `PROGRESS.md`. For endpoint-level detail, see
[`API_DOCUMENTATION.md`](hono/src/routes/API_DOCUMENTATION.md).

## 1. System Overview

* **Hierarchy:** `University → Faculty → Study → Subject`.
* **Scope:** Single university at launch, read-only catalog for users. Small volume expected.
* **Sanity CMS (source of truth for academic metadata):** Owns rich descriptive content — bios, descriptions, syllabus, `year`, `semester`.
* **Supabase DB (runtime):** Owns identities, relationships (enrollments/affiliations), user content (scripts, comments, votes, ratings, flags), notifications, achievements, and runtime script metadata (`exam_session`, `additional_reading`, multiple files).
* **Junction tables:** Many-to-many enrollments/affiliations for students and professors — `profile_faculties`, `profile_studies`, `professor_faculties`, `professor_studies`, plus `subject_professors` for subject-level assignment.
+ * **Data fetching:** The API merges DB identity/relationship records with Sanity metadata.
+ * **Type derivation:** Sanity TypeGen output generates into `shared/types/` (not `next/`), so `next/`, `hono/`, and `sanity/` all import the same generated Sanity types instead of each keeping its own copy. Academic entity types (`MinimalStudy`, `StudyDetail`, etc.) are derived directly from each query's generated result type via `WithResolvedSanityData<...>` (`shared/types/sanity-transform.types.ts`), which recursively resolves three structural mismatches TypeGen can't express on its own: `picture` fields guarded by `defined()` in GROQ are narrowed to non-nullable, Portable Text fields are forced `NonNullable`, and the `media: unknown` field TypeGen emits for Portable Text image blocks is widened to a usable `Record<string, unknown>`. This replaces hand-written academic types, so they can't drift out of sync with the query producing them. `hono/src/sanity-stub.d.ts` provides a minimal `@sanity/client` module stub so `hono/` can import these generated types without installing the package as a real dependency.
* **Access control:** Enforced primarily at the database layer via Postgres RLS, not just application code. See [Client Access Patterns](hono/src/routes/API_DOCUMENTATION.md#client-access-patterns) for which client type (session vs. service-role) each route uses and why.

## 2. Academic Catalog (University / Faculty / Study / Subject / Professor)

* **Entities:** University, Faculty, Study, Subject, Professor — each with a Sanity "mini-schema" for shared fields.
* **Routing:** Catalog pages are nested to mirror the hierarchy, one URL segment per level:
  - `/university/[universitySlug]`
  - `/university/[universitySlug]/faculty/[facultySlug]`
  - `/university/[universitySlug]/faculty/[facultySlug]/study/[studySlug]`
  - `/university/[universitySlug]/faculty/[facultySlug]/study/[studySlug]/subject/[subjectSlug]`

  Each slug only needs to be unique among its siblings (scoped to its immediate parent), not globally — the URL path itself disambiguates, so `ukim/pharmacy/...` and `some-other-uni/pharmacy/...` can both use the slug `pharmacy` without conflict. Slugs are a plain name-derived field per document (Sanity's standard slugify on `name`) — nesting is what makes uniqueness safe, not the slug generation itself, so no compound or cross-entity-aware slug logic is needed.

  **Professor pages are the one exception — they stay flat at `/professor/[professorSlug]`, never nested under a faculty/study/subject.** A professor can belong to many faculties, studies, and subjects at once (`professor_faculties`, `professor_studies`, `subject_professors` are all many-to-many), so there's no single parent to nest under.

  This supersedes the earlier flat, globally-unique compound slug scheme (`ukim-pharmacy-pharmacology`) — routing/fetching logic changes on the frontend, but the Sanity slug field itself doesn't (see `PROGRESS.md`).
* **Sanity ↔ DB sync:**
  1. Author the entity in Sanity — the document allows edits before a DB row exists.
  2. The **"Create in Database"** Studio action creates the Supabase row and writes the DB id back onto the Sanity document.
  3. Publishing is blocked until that DB id exists. Deletion is blocked until dependency checks against the DB pass (via the internal API).
* **Access model:** Every catalog route (`/api/universities`, `/api/faculties`, `/api/studies`, `/api/professors`, `/api/subjects` — reads and writes, including their junction tables `subject_professors`, `professor_faculties`, `professor_studies`) requires the `x-internal-secret` header. This is independent of Supabase Auth roles: RLS on these tables is read-only for **every** role, including admin. There is no client-facing write path to catalog data — `/api/internal/*` (service-role client) is the only way in.
* **Shape note:** Subjects relate to faculties only *through* studies (`subjects.study_id → studies.faculty_id`); there's no direct `subjects.faculty_id` column.

## 3. Scripts & Uploads

* **Single-subject constraint:** A script belongs to exactly one subject. Faculty/study/university are derived from that subject, never stored redundantly on `scripts`.
* **Professor selection:** Explicitly chosen and validated against `subject_professors`.
* **Payload:** `title` and `description` as Portable Text (`jsonb`, validated as a block array; size-capped — title ≤2KB, description ≤50KB, same pattern as `comments.content`), `exam_session`, `additional_reading` (`text[]` URLs), and one or more immutable files via `script_files` (`file_url`, `file_type`, `file_size_bytes`, `bucket`, `position`). `POST /scripts`'s body is validated via a `zValidator` JSON schema.
* **Supported file types:** `pdf`, `jpg`, `jpeg`, `png`, `webp`, `md`, `doc`, `docx`, `xls`, `xlsx`. Per-file size limit (~1MB, adjustable) and type/extension checks are enforced at `POST /file-ops/upload` via a `zValidator` form schema — Postgres never sees the raw bytes.
* **Multi-file upload, one call:** `POST /file-ops/upload` accepts one or more `files` in a single multipart request (a single file is still accepted, normalized to an array server-side) plus an optional `subjectId`, and returns one `{ fileKey, fileType, fileSizeBytes, bucket }` per file — passed straight into `POST /scripts`'s `files` array.
* **Storage scoping, per university:** each university can have its own R2 bucket (`universities.r2_bucket_id`, nullable, unique, R2/S3-naming-constrained). `POST /file-ops/upload` resolves the bucket from the given `subjectId`'s subject → study → faculty → university chain, falling back to the shared `R2_BUCKET` env var if unset or unresolvable. Object keys are scoped under the academic hierarchy using Postgres dbIds (not slugs): `{facultyId}/{studyId}/{subjectId}/{userId}/{uuid}.{ext}`. `script_files.bucket` records which bucket a file actually landed in, since a bare key no longer implies a single global bucket — `GET /file-ops/get-file/*` takes a matching optional `?bucket=` query param.
* **Moderation flag:** `is_flagged` is internal state, excluded from every public-facing script/comment response.
* **Search:** Local-first on the frontend, API fallback (`GET /scripts/search`) — fuzzy-matched against Portable Text converted to plain text. Scripts only; no other entity is searchable.
* **Caching:** Next.js Data Cache, tagged per endpoint/id. Mutating a script (including file changes) triggers a backend webhook that revalidates only the affected tags. Search and "my scripts" are never cached.

## 4. Users, Roles & Access

* **Roles:** `profiles.role` is `student`, `moderator`, or `admin`. **Only `admin` currently carries elevated database privilege** — admins have full create/update/delete RLS on any `scripts`, `comments`, or `profiles` row, and are the only role that can resolve flags or manage rating types. `moderator` exists in the schema but is checked by zero current RLS policy or backend code; it's reserved for a future notification-trigger role (see `PROGRESS.md`).
* **Guest access:** Can browse, preview, and download. Protected actions (upload, like, comment, save, rate, flag) require auth.
* **Restriction system:** Admins can restrict a user via `profile_restrictions` (row presence = restricted; requires a reason; records the restricting admin). A restricted user is blocked from **creating or updating** scripts, comments, flags, comment reactions, votes, and ratings — but can still remove their own existing content/interactions. Favoriting and comment likes are exempt from restriction entirely.
* **Profile selections:** A user's own faculty/study/subject data (`profile_faculties`, `profile_studies`, `profile_subjects`) are plain `profile_id = auth.uid()` RLS tables, distinct from the admin-only catalog tables they reference. Faculty/study selection is a membership toggle; subject selection carries a `status` (`completed` | `currently_taking`).
* **Achievements:** `achievement_definitions` (lookup: `entity_type`, `metric`, `threshold`, title/description — new achievements are a data insert, not a schema change) plus `profile_achievements` (earned records, `ON DELETE CASCADE` on the profile, one row per profile per achievement).
* **Notifications:** `notifications` (`profile_id`, `type`, `title`, `body`, `data jsonb`, `is_read`) is schema-only right now — see `PROGRESS.md`. `type` is intentionally unconstrained so new notification kinds don't require a migration; type-specific payload lives in `data`.
* **Ratings:** Professors and subjects can each be rated on multiple, independently extensible types via a shared `rating_types` lookup (`target_type: 'professor'|'subject'`; reads public, writes admin-only via `is_admin()` RLS). `professor_ratings`/`subject_ratings` enforce one rating per user per type per entity (`UNIQUE(professor_id/subject_id, user_id, rating_type_id)`, score 1–5), with a DB trigger rejecting a rating-type/target mismatch. Restricted users can't create or change a rating; removal stays available.

## 5. Moderation

* **Unified flagging:** A single `flags` table covers scripts, users, and comments (`target_script_id` / `target_user_id` / `target_comment_id`, exactly one set per row). A user can create, view, and delete only their own flags.
* **Resolution:** Only admins resolve/dismiss a flag (`is_admin()`-gated RLS, including direct `SELECT` for listing). Lifecycle is `pending → reviewed → dismissed`, with an audit trail (`reviewed_by`, `reviewed_at`). Dismissing the last pending flag on a target clears its `is_flagged`.
* **Flagged content stays visible:** Flagging surfaces content for review — it never hides it from other users.
* **Download deduplication:** Raw attempts are logged to `download_events` (append-only), aggregated by identity priority — account → IP → device. `download_events` has no client-facing `INSERT` policy for any role; recording a download always goes through the service-role backend.
* **Moderators today:** No elevated access anywhere in the API. The role is reserved for a future volume-based signal (repeated flags against a user notifying moderators, a moderator's own flag escalating to admins) — purely conceptual, not built.

## 6. Explicitly Out of Scope (Current Version)

* Comprehensive/push notification systems beyond the `notifications` table schema and a hardcoded onboarding reminder — no preferences, settings, or Sanity-authored notifications.
* Advanced/global moderation UI suites beyond base DB-backed flagging.
* Non-script search.
* The moderator-volume → admin-escalation notification pipeline (§5).
* IP/device-based repeat-account-creation prevention — a rate-limiting/fingerprinting concern, not modeled in the database.

## 7. API Client Pattern (`next/`, `sanity/`)

* **No Hono RPC client.** A `hc<AppType>` client (full compile-time request/response type-checking against the live route tree) was built and evaluated, but abandoned: this API has ~140+ endpoints across 19 route files, and referencing the composed type anywhere — even a single property access — forced enough TypeScript type instantiation to hang the editor. Splitting into one small typed client per route file reduced but didn't eliminate the cost. Every route file and `index.ts` reverted to plain, unchained `app.get(...)`/`app.route(...)` statements, since nothing depends on Hono's type composition anymore.
* **Generated path strings instead.** `shared/config/api-routes.ts` is auto-generated (never hand-edited) from `shared/config/api.ts`'s manual config, and exports `apiRoutes` — a plain object of path-builder functions/constants covering every route — plus an `ApiEndpoint` template-literal type. This has zero dependency on Hono's types, so it's safe to import from `sanity/` (a separate browser bundle that has no reason to pull in server-only code like the AWS SDK or the Supabase server client) without any risk of the same slowdown.
* **`next/lib/api.ts`'s `apiFetch`** wraps `fetch` with JSON/FormData body handling and centralized error parsing; call sites pass `apiRoutes.x.y(...)` straight into it. Type safety at the boundary now comes from each route's own runtime validation (`zValidator` schemas, hand-rolled guards), not a shared client type.