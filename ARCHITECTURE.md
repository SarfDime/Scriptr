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
* **Workspace dependencies:** pnpm 12 uses an isolated linker and a single root lockfile. Each app declares its own dependencies and the lightweight `@scriptr/shared` workspace package; existing `@shared/*` TypeScript aliases continue to resolve shared source. Vercel installs are filtered to the target app, its workspace dependencies, and root tooling, so unrelated app dependencies are not installed for that deployment.
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
* **Payload:** `title` and `description` as Portable Text (`jsonb` block array; title ≤2KB, description ≤50KB), `exam_session`, `additional_reading` (`text[]`), and one or more `script_files` (`file_url`, `file_type`, `file_size_bytes`, `bucket`, `position`, `file_name`; file contents are immutable, but the author or an admin can add files to an existing script via `POST /scripts/:id/files` (restriction-checked) and remove an individual one via `DELETE /scripts/:scriptId/files/:fileId`, which renumbers the remaining `position`s). `file_name` is the uploaded name lowercased, accent-stripped, kebab-cased and without its extension, `null` for files from before names were kept. Body validated by a `zValidator` schema, including an allow-list for supported Portable Text blocks, spans, decorators, styles, lists, and alignments. The Next.js form validates title/description caps before submission.
* **Comments:** comments and replies use allow-listed Portable Text with inline decorators only; custom blocks, annotations, headings, lists, and custom text alignment are rejected. Payloads are capped at 10 KiB and require at least three non-whitespace characters. Replies inherit and are database-enforced against their parent's target. Root comments load in pages of two and support newest or combined-like-and-reaction top ordering; up to five chronological replies are shown per comment, with further replies fetched in pages of 10 on demand at every thread depth. Each root thread has a single hide/show control; hiding resets it to the default reply preview, and loaded pages remain cached. Script summary counts and `totalCommentCount` include all comments and replies; root `totalCount` remains the root-thread pagination total. Script summary totals are retrieved through the bounded `get_script_comment_counts` security-definer RPC because public roles have no table-level `SELECT` on comments. Reaction/like totals are also aggregated server-side through the internal client so RLS does not hide other users' engagement; only aggregate counts and the current viewer's own status are returned. The frontend retains fetched pages while mounted and the Next.js Data Cache serves only non-personalized initial reads. Each user can independently toggle multiple reaction types, but cannot add a like or reaction to their own comment. Comment and reply creation are limited to 10 per 15 minutes each, and combined likes/reactions to 15 per minute per account, per API process. Comments are shared by scripts and professors: the target is exactly one of a script or a professor, and the comment components are target-agnostic. Script pages read the first page on the server with the viewer's cookie, which makes them dynamic. Professor pages stay statically generated and fetch the first page in the browser after mount (`ProfessorComments` / `useProfessorComments`; the browser sends its own session cookie and the read is `no-store`), showing a loading placeholder, the retry UI on failure, and the empty state; the section renders only when the professor has a database id.
* **File types:** `pdf`, `jpg`, `jpeg`, `png`, `webp`, `md`, `doc`, `docx`, `xls`, `xlsx`, with per-file size and extension checks at `POST /file-ops/upload`.
* **Optional script files:** one multipart call with any selected `files` and optional `subjectId` returns one `{ fileKey, fileType, fileSizeBytes, bucket }` per uploaded file, passed into `POST /scripts`; scripts may also be created with an empty file list.
* **Overlay interaction:** the main `ui-container` scroll surface is locked with a `:has()` CSS rule while the mobile navigation drawer or a native dialog is open; dialogs also restore focus to their trigger and trap keyboard focus.
* **Storage scoping:** each university may have its own R2 bucket (`universities.r2_bucket_id`); the upload resolves it via subject → study → faculty → university, falling back to `R2_BUCKET`. Keys use dbIds: `{facultyId}/{studyId}/{subjectId}/{userId}/{uuid}.{ext}`. `script_files.bucket` records the landing bucket; `GET /file-ops/get-file/*` is public for guest preview/download, but verifies the key against `script_files` and resolves its bucket server-side (`?download=1` makes the signed URL save under the stored `file_name` rather than render inline). Deleting a script, or a failed upload, script create or file attach, deletes the affected R2 objects on a best-effort basis (failures are logged, not returned to the client).
* **Object caching:** uploads use UUID-suffixed keys that are unique per upload and never overwritten, so they are served with `public, max-age=31536000, immutable`.
* **Moderation flag:** `is_flagged` is excluded from every public response.
* **Search:** local-first on the frontend, API fallback (`GET /scripts/search`), fuzzy-matched against Portable Text as plain text. Scripts only. The local filter in `ScriptsSection` only covers the scripts already loaded; with `showGlobalSearch` it links to `/search?q=`, a thin Server Component page (`loadSearchPage` in `next/lib/search-page.ts`) that calls the API with the request cookie and is never cached. The header search icon links to the same page.
* **Caching:** Next.js Data Cache, tagged per endpoint/id; public profile pages and stats are cached, and script/profile/favorite/vote/download/comment/role mutations trigger the backend webhook to revalidate affected script/profile tags. The homepage composes its signed-in curated feed from shared cached per-subject script reads. Search and "my scripts" are never cached.

## 4. Users, Auth, Roles & Access

* **Auth:** Supabase Auth via a cookie; no Bearer-token path. The web app (`scriptr.uk`) and API (`api.scriptr.uk`) are same-site: the API sets `sb-auth-token` with `Domain=${COOKIE_DOMAIN}` (`.scriptr.uk`), `SameSite=Lax`, `Secure`, `httpOnly`, so the browser and Server Components (which forward it explicitly, `getRequestCookieHeader`) both receive it. `COOKIE_DOMAIN` is unset locally (`localhost` ports share cookies). `*.vercel.app` preview deployments are cross-site and won't receive the cookie. Access tokens are configured for the maximum one-week lifetime to reduce refreshes (`hono/supabase/config.toml`; hosted Supabase projects must use the same Auth setting). Routes: register, login, logout, session, and `/auth/callback`, which the frontend (`useAuthCallback`) calls with tokens extracted from the email-confirmation URL fragment (implicit flow, no PKCE). `/login`, `/callback`, and `/session` return the same app-shaped session user (id, email, username, role, subjects, selected faculty/study ids), so the client doesn't refetch the session after login. `/session` refreshes tokens only when they expire within 60 seconds; protected client actions that receive a 401 refresh the session and retry once, then sign out and notify the user if authentication still fails. A DB trigger creates the profile on signup.
* **Onboarding:** on first visit users select university/faculty/study/subject; selections persist to the `profile_*` tables. Onboarding and account creation each generate a notification. The selection cascade and year/subject completion logic (`useAcademicSelections`) is shared by the onboarding wizard (guest localStorage) and the profile's "Edit academics" dialog (local state seeded from the account); copy lives in `UI_STRINGS.onboarding`.
* **Roles:** `profiles.role` is `student`, `moderator`, or `admin`. Only `admin` carries elevated privilege (full CRUD on scripts/comments/profiles, flag resolution, rating types, restrictions). `moderator` is checked nowhere and is reserved for a future notification role.
* **Guests:** can browse, preview, and download. Upload, like, comment, save, rate, and flag require auth.
* **Restrictions:** admins restrict a user via `profile_restrictions` (row = restricted; reason and restricting admin recorded). Restricted users are blocked from creating/updating scripts, comments, flags, comment reactions/likes, votes, and ratings, but can still delete their own content. Favorites are exempt.
* **Profile selections:** `profile_id = auth.uid()` RLS tables. `PATCH /profiles/me` replaces faculty/study selections (diffed, errors checked; admins editing another user use the service-role client since the tables have no admin RLS path); subject selection carries a status (`completed` | `currently_taking`) and is written per subject. Stored `currently_taking` rows are not relied on for display (registration writes them, the onboarding sync and academics editor don't): profile pages derive "currently taking" as the non-completed subjects of the selected studies.
* **Profile pages:** `ProfilePage` is the one layout for `/user` (client `MyProfilePage` over the shared profile state, editable) and `/user/[username]` (server-fetched; redirects to `/user` for the viewer's own username). Favorites and subjects are public: `script_favorites` is publicly readable and the public profile endpoint returns subjects. Academic links are built from Sanity slugs via the onboarding catalog (`buildProfileAcademics`), not Postgres ids. Avatar upload is not implemented yet (picker disabled behind `AVATAR_UPLOAD_ENABLED`, waiting on the R2 optimization pipeline).
* **Achievements:** `achievement_definitions` (entity type, metric, threshold; new achievements are a data insert) plus `profile_achievements` (one row per profile per achievement). An award-check helper runs on vote, download, and comment mutations and creates the matching notification.
* **Notifications:** `notifications` (`profile_id`, `type`, `title`, `body`, `data jsonb`, `is_read`). `type` is unconstrained so new kinds need no migration. Users can list (filter by read state), count unread, mark one/all read, and delete their own. Currently emitted for onboarding, account creation, and achievements.
* **Ratings:** professors and subjects are rated on extensible types via `rating_types` (public read, admin write). One rating per user per type per entity, score 1–5, a trigger rejects target mismatches; restricted users can't create/change, removal stays allowed.

## 5. Moderation

* **Flags:** one `flags` table for scripts, users, and comments (exactly one target per row). Users manage only their own flags and cannot report their own scripts or comments.
* **Resolution:** admins only (`pending → reviewed → dismissed`, with `reviewed_by`/`reviewed_at`); dismissing the last pending flag clears `is_flagged`. Flagged content stays visible.
* **Download dedupe:** raw attempts go to append-only `download_events` (service-role only), aggregated account → IP → device.
* **Moderators:** no elevated access; the volume-based escalation pipeline is conceptual only.

## 6. Out of Scope (Current Version)

* Notification preferences/settings, push delivery, Sanity-authored notifications, and the moderator escalation pipeline.
* Advanced moderation UI beyond DB-backed flagging.
* Non-script search.
* IP/device-based repeat-account prevention.
* Restriction enforcement for file operations.

## 7. API Client & Response Typing

* **No Hono RPC client.** `hc<AppType>` over ~140+ endpoints hung the editor's type checking; routes are plain unchained `app.route(...)` statements.
* **Generated paths.** `shared/config/api-routes.ts` is auto-generated (never hand-edit; regenerate with `corepack pnpm gen:api-endpoints` after any route change) from `shared/config/api.ts`. It exports `apiRoutes` and the `ApiEndpoint` type, with no Hono dependency, so `sanity/` can import it safely.
* **`apiFetch`** (`next/lib/api/next-api.ts`) wraps `fetch` with JSON/FormData handling, `credentials: 'include'` for the session cookie, and central error parsing (it throws an `ApiError` carrying the HTTP status); callers pass `apiRoutes.x.y(...)` into it. Per-domain wrappers live in `next/lib/api/*-api.ts`. Server-side reads that can be personalized forward the request cookie (`getRequestCookieHeader`) and go through `cachedUnlessPersonalized`: tagged Data Cache when anonymous, `no-store` when a cookie is forwarded.
* **Typed responses.** Route response shapes live in `shared/types/` and are applied at the route (`c.json<LoginResponse>(...)`), so backend and consumers share one definition. Anything a `hono/` route imports must live under `shared/`, never `next/types/`. Request-side safety comes from runtime validation (`zValidator`, guards).

## 8. Frontend Structure & UI Conventions

* **Thin pages.** A route's `page.tsx` awaits its params, calls a loader, and composes components. Fetching, cookies and 404 handling live in `next/lib/<feature>-page.ts` (e.g. `loadScriptDetailPage`), which returns a view model typed in `next/types/components/` (e.g. `ScriptDetailViewModel`). Components receive plain props and never fetch. Pure helpers (sorting, link labels, author display) live in `next/lib/<feature>.ts`.
* **Script detail page** (`/scripts/[slug]`): `ScriptDetailOverview` places two frosted surfaces in a wrapping flex row: the info group (`ScriptInfoPanel` + `ScriptAdditionalReading`, always shown, with an empty state) and `ScriptFilesSection`. The files take almost all free space (grow 100 vs 1), so when the row is too narrow the *first* wrap is the files dropping below the info group; only then does the reading panel wrap under the info. Files render in an `auto-fit` grid; each `ScriptFileCard` is its own container-query container, stacked while narrow and thumbnail-beside-details once about 28rem wide. A lone file is capped to its content width. `ScriptFileCard` composes `ScriptFileThumbnail` and `ScriptFileActions` and owns the preview modal.
* **Strings.** User-facing copy lives in `shared/strings/<area>-strings.ts` (`comments-strings.ts`, `scripts-strings.ts`) or `UI_STRINGS` (`shared/config/strings.ts`), never inline in components.
* **Surfaces and dialogs.** Content sits on a frosted outer surface (`ui-above`) with a lighter inner fill (`ui-above-inside`) where text is shown; dialogs (file preview, sign-in) follow the same pattern. Details in `next/STYLING_GUIDE.md`.
