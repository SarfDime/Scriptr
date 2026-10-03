# Scriptr: Architecture & Requirements

This describes the system as it currently stands. For built vs. outstanding,
see `PROGRESS.md`. For endpoint detail, see
[`API_DOCUMENTATION.md`](hono/src/routes/API_DOCUMENTATION.md).

## 1. System Overview

* **Hierarchy:** `University → Faculty → Study → Subject`. Single university at launch, read-only catalog for users.
* **Sanity CMS (source of truth for academic metadata):** bios, descriptions, syllabus, `year`, `semester`.
* **Supabase DB (runtime):** identities, relationships, user content (scripts, comments, votes, ratings, flags), notifications, achievements, runtime script metadata (`exam_session`, `additional_reading`, files).
* **Junction tables:** `profile_faculties`, `profile_studies`, `profile_subjects`, `professor_faculties`, `professor_studies`, `subject_professors`.
* **Data fetching:** the API merges DB identity/relationship records with Sanity metadata.
* **Type derivation:** Sanity TypeGen output generates into `shared/types/`, so `next/`, `hono/`, and `sanity/` share one copy. Academic entity types are derived from each query's result type via `WithResolvedSanityData<...>` (`shared/types/sanity-transform.types.ts`), which resolves `defined()`-guarded pictures, `NonNullable` Portable Text fields, and the `media: unknown` block field. `hono/src/sanity-stub.d.ts` lets `hono/` import these types without a real `@sanity/client` dependency.
* **Access control:** enforced primarily by Postgres RLS. See [Client Access Patterns](hono/src/routes/API_DOCUMENTATION.md#client-access-patterns) for which client (session vs. service-role) each route uses.
* **API surface:** route groups mounted under `/api`: `auth`, `universities`, `faculties`, `studies`, `professors`, `subjects`, `file-ops`, `scripts`, `votes`, `comments`, `flags`, `favorites`, `profiles`, `profile-subjects`, `profile-studies`, `profile-faculties`, `notifications`, `ratings`, `restrictions`, `internal`.

## 2. Academic Catalog

* **Entities:** University, Faculty, Study, Subject, Professor, each with a Sanity mini-schema for shared fields.
* **Routing:** nested, one segment per level:
  - `/university/[universitySlug]`
  - `.../faculty/[facultySlug]`
  - `.../study/[studySlug]`
  - `.../subject/[subjectSlug]`

  Slugs only need to be unique among siblings; the path disambiguates. **Professors stay flat at `/professor/[professorSlug]`** since they belong to many faculties, studies, and subjects. Each level's GROQ query filters on its ancestor chain.
* **Sanity ↔ DB sync (tested, working):**
  1. Author the entity in Sanity (edits allowed before a DB row exists).
  2. **"Create in Database"** creates the Supabase row and writes the DB id back to the Sanity document. **"Sync with Database"** pushes later edits.
  3. Publishing is blocked until the DB id exists. Deletion is blocked by the internal API's dependency check (`409`).
  4. `parentFieldFor`/`parentColumnFor` and the academic endpoint map (`getDatabaseAcademicEndpoints`) are exhaustive over entity types, with no silent defaults.
* **Access model:** every catalog route (reads and writes, junctions included) requires `x-internal-secret`. RLS on these tables is read-only for every role including admin; `/api/internal/*` (service-role client) is the only write path. Studio needs `SANITY_STUDIO_INTERNAL_SECRET` matching the server's `INTERNAL_API_SECRET`, and `SANITY_STUDIO_API_URL` pointing at the real API.
* **Shape note:** subjects relate to faculties only through studies (`subjects.study_id → studies.faculty_id`).

## 3. Scripts & Uploads

* **Single subject:** a script belongs to exactly one subject; faculty/study/university are derived, never stored on `scripts`.
* **Professor selection:** chosen explicitly and validated against `subject_professors`.
* **Payload:** `title` and `description` as Portable Text (`jsonb` block array; title ≤2KB, description ≤50KB), `exam_session`, `additional_reading` (`text[]`), and one or more immutable `script_files` (`file_url`, `file_type`, `file_size_bytes`, `bucket`, `position`). Body validated by a `zValidator` schema. Portable Text block-type structure is not yet validated server-side (see `PROGRESS.md`).
* **File types:** `pdf`, `jpg`, `jpeg`, `png`, `webp`, `md`, `doc`, `docx`, `xls`, `xlsx`, with per-file size and extension checks at `POST /file-ops/upload`.
* **Multi-file upload:** one multipart call with `files` and optional `subjectId` returns one `{ fileKey, fileType, fileSizeBytes, bucket }` per file, passed into `POST /scripts`.
* **Storage scoping:** each university may have its own R2 bucket (`universities.r2_bucket_id`); the upload resolves it via subject → study → faculty → university, falling back to `R2_BUCKET`. Keys use dbIds: `{facultyId}/{studyId}/{subjectId}/{userId}/{uuid}.{ext}`. `script_files.bucket` records the landing bucket; `GET /file-ops/get-file/*` takes a matching `?bucket=`. That endpoint is unauthenticated and does not check keys against the DB (open decision in `PROGRESS.md`).
* **Moderation flag:** `is_flagged` is excluded from every public response.
* **Search:** local-first on the frontend, API fallback (`GET /scripts/search`), fuzzy-matched against Portable Text as plain text. Scripts only.
* **Caching:** Next.js Data Cache, tagged per endpoint/id; public profile pages and stats are cached, and script/profile/favorite/vote/download/comment/role mutations trigger the backend webhook to revalidate affected script/profile tags. The homepage composes its signed-in curated feed from shared cached per-subject script reads. Search and "my scripts" are never cached.

## 4. Users, Auth, Roles & Access

* **Auth:** Supabase Auth via a cookie; no Bearer-token path. Routes: register, login, logout, session, and `/auth/callback`, which the frontend (`useAuthCallback`) calls with tokens extracted from the email-confirmation URL fragment (implicit flow, no PKCE). `/login`, `/callback`, and `/session` return the same app-shaped session user (id, email, username, role, subjects, selected faculty/study ids), so the client doesn't refetch the session after login. A DB trigger creates the profile on signup.
* **Onboarding:** on first visit users select university/faculty/study/subject; selections persist to the `profile_*` tables. Onboarding and account creation each generate a notification.
* **Roles:** `profiles.role` is `student`, `moderator`, or `admin`. Only `admin` carries elevated privilege (full CRUD on scripts/comments/profiles, flag resolution, rating types, restrictions). `moderator` is checked nowhere and is reserved for a future notification role.
* **Guests:** can browse, preview, and download. Upload, like, comment, save, rate, and flag require auth.
* **Restrictions:** admins restrict a user via `profile_restrictions` (row = restricted; reason and restricting admin recorded). Restricted users are blocked from creating/updating scripts, comments, flags, comment reactions, votes, and ratings, but can still delete their own content. Favorites and comment likes are exempt.
* **Profile selections:** `profile_id = auth.uid()` RLS tables. Faculty/study selection is a membership toggle; subject selection carries a status (`completed` | `currently_taking`).
* **Achievements:** `achievement_definitions` (entity type, metric, threshold; new achievements are a data insert) plus `profile_achievements` (one row per profile per achievement). An award-check helper runs on vote, download, and comment mutations and creates the matching notification.
* **Notifications:** `notifications` (`profile_id`, `type`, `title`, `body`, `data jsonb`, `is_read`). `type` is unconstrained so new kinds need no migration. Users can list (filter by read state), count unread, mark one/all read, and delete their own. Currently emitted for onboarding, account creation, and achievements.
* **Ratings:** professors and subjects are rated on extensible types via `rating_types` (public read, admin write). One rating per user per type per entity, score 1–5, a trigger rejects target mismatches; restricted users can't create/change, removal stays allowed.

## 5. Moderation

* **Flags:** one `flags` table for scripts, users, and comments (exactly one target per row). Users manage only their own flags.
* **Resolution:** admins only (`pending → reviewed → dismissed`, with `reviewed_by`/`reviewed_at`); dismissing the last pending flag clears `is_flagged`. Flagged content stays visible.
* **Download dedupe:** raw attempts go to append-only `download_events` (service-role only), aggregated account → IP → device.
* **Moderators:** no elevated access; the volume-based escalation pipeline is conceptual only.

## 6. Out of Scope (Current Version)

* Notification preferences/settings, push delivery, Sanity-authored notifications, and the moderator escalation pipeline.
* Advanced moderation UI beyond DB-backed flagging.
* Non-script search.
* IP/device-based repeat-account prevention.
* Restriction enforcement for file operations and R2 cleanup of deleted scripts.

## 7. API Client & Response Typing

* **No Hono RPC client.** `hc<AppType>` over ~140+ endpoints hung the editor's type checking; routes are plain unchained `app.route(...)` statements.
* **Generated paths.** `shared/config/api-routes.ts` is auto-generated (never hand-edit; regenerated on dev or `npm run generate-api-routes`) from `shared/config/api.ts`. It exports `apiRoutes` and the `ApiEndpoint` type, with no Hono dependency, so `sanity/` can import it safely.
* **`apiFetch`** (`next/lib/api.ts`) wraps `fetch` with JSON/FormData handling and central error parsing; callers pass `apiRoutes.x.y(...)` into it.
* **Typed responses.** Route response shapes live in `shared/types/` and are applied at the route (`c.json<LoginResponse>(...)`), so backend and consumers share one definition. Anything a `hono/` route imports must live under `shared/`, never `next/types/`. Request-side safety comes from runtime validation (`zValidator`, guards).