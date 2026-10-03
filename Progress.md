# Scriptr: Progress & Todos

What's built, what's outstanding. See `ARCHITECTURE.md` for how the finished
pieces are designed to work. Last full reconciliation: 2026-10-03.

> **Standing rule:** any change to the Postgres or Sanity schema must be
> followed by `npm run gen:api-types` / `npm run sanity:typegen` and a clean
> `npm run check-types` before it counts as done.

## Backend API (`hono/`)

### Done

* **Schema:** `profiles`, `scripts`/`script_files`, catalog tables + junctions, `profile_faculties`/`profile_studies`/`profile_subjects`, `download_events`, `flags`, `comments` + reactions/likes, `votes`, `script_favorites`, `rating_types`/`professor_ratings`/`subject_ratings`, `achievement_definitions`/`profile_achievements`, `notifications`, `profile_restrictions`. Constraints, indexes, Portable Text size caps, score/status `CHECK`s. **[✅]**
* **Catalog API:** full read/write for universities, faculties, studies, subjects, professors and every junction table, gated by `x-internal-secret`, service-role client only. Universities have full CRUD + sync, with an app-level `faculties` dependents check on delete. **[✅]**
* **Scripts:** multi-file upload, Portable Text title/description, single-subject constraint, auto-resolved hierarchy, professor validation, author/admin edit/delete, fuzzy search, faculty-scoped listing. **[✅]**
* **Downloads:** dedupe (account → IP → device), service-role only. **[✅]**
* **Comments** (script/professor/user threads, replies, reactions, likes), **flags** (user create/view/delete own; admin list/resolve via RLS), **votes** (atomic `toggle_vote` RPC), **favorites**, **ratings** (types, professor/subject ratings, stats). **[✅]**
* **Profiles:** public list/lookup/stats, `me` read/update/delete, admin patch/delete, internal-only role changes. **[✅]**
* **Public-read caching:** script and public-profile data use tagged Next Data Cache entries; mutations revalidate affected script and profile representations. **[✅]**
* **Profile selections:** `profile-faculties`, `profile-studies`, `profile-subjects` own-resource CRUD. **[✅]**
* **Auth:** register, login, logout, session, and `/auth/callback` (email-confirmation token handoff, implicit flow) via the Supabase Auth cookie; no Bearer path. `/login` and `/callback` return the app-shaped session user, so the client doesn't refetch `/session`. **[✅]**
* **Notifications:** list (optional `is_read` filter), unread count, mark one/all read, delete. Onboarding and account-creation notifications are created. **[✅]**
* **Achievements:** award-check helper (metric vs `achievement_definitions.threshold` → `profile_achievements` + notification), wired into vote, download, and comment endpoints. **[✅]**
* **Restrictions:** admin restrict/unrestrict endpoint (`restrictions.ts`, `is_admin()` RLS). **[✅]**
* **Typed responses:** route responses are typed against types in `shared/types/` (e.g. `c.json<LoginResponse>(...)` using `auth.types.ts`), so `next/` and `sanity/` consume the same shapes. **[✅]**
* Moderator role has no access checks anywhere; every elevated check is `is_admin()`. **[✅]**
* `API_DOCUMENTATION.md` reconciled with the route set. **[✅]**

### Todo

* **Finish response typing rollout** — verify every route file uses shared response types (all routes mounted in `index.ts` must be covered; check `notifications.ts` and the rest). **[🔲]**
* **Portable Text block-type allow-list validation, server-side** — Postgres `CHECK` only validates "JSON array under size limit". Needed before user-authored rich text ships. **[🔲]**
* **Register field validation, unique usernames, spam-email blocking, rate limiting.** **[🔲]**
* **Individual script file removal** — RLS allows it, no endpoint exists. **[🔲]**
* **Achievement definitions CRUD** (admin) — only public read exists. **[🔲]**
* **`GET /file-ops/get-file/*` has no auth and no key-to-DB check;** decide: add validation, add R2 cleanup on script delete, or accept as intentional (guest preview/download). **[🔲 decision]**
* **`faculties_university_id_fkey` is `ON DELETE CASCADE`** — conflicts with the app-level dependents-check pattern; decide on `RESTRICT`. **[🔲 decision]**
* **`API_TESTING_GUIDE.md` refresh** — stale vs multi-file upload, universities mutation routes, auth callback. **[🔲]**
* **Moderator notification pipeline** (repeated flags → moderators, moderator flag → admins). **[🔲 Deferred]**

## R2 / File Storage (`hono/`)

### Done

* Multi-file `POST /file-ops/upload` (one `{ fileKey, fileType, fileSizeBytes, bucket }` per file). **[✅]**
* Keys: `{facultyId}/{studyId}/{subjectId}/{userId}/{uuid}.{ext}`, falling back to `{userId}/...`. **[✅]**
* University-scoped buckets (`universities.r2_bucket_id`, `resolveStorageScope()`, `?bucket=` on get-file) and `script_files.bucket`. **[✅]**

### Todo

* **Sanity `r2BucketId` field on the University schema** — drafted, not confirmed applied; verify (sync was tested without it being confirmed). **[🔲 unconfirmed]**
* **R2 cleanup for deleted scripts and failed script creation.** **[✅]**

## Sanity CMS (`sanity/`)

### Done

* Models, relationships and initialization sets for all 5 entities. **[✅]**
* "Create in Database" / "Sync with Database" actions, publish blocked until a DB id exists, dependency-checked delete (`409`), exhaustive `parentFieldFor`/`parentColumnFor`. **[✅]**
* Slug generation and reusable mini-schemas. **[✅]**
* **Academic sync/delete workflows tested end-to-end and working** (create, sync, checked delete) across entity types. **[✅]**
* Environment wiring confirmed (`INTERNAL_API_SECRET` / `SANITY_STUDIO_INTERNAL_SECRET` match; `SANITY_STUDIO_API_URL` set for deployed Studio). **[✅]**

### Todo

* Remove unused schemas, utils and constants. Encrypt the internal secret with a shared salt across environments. **[🔲]**
* Decide how to handle page data in the structure tool. **[🔲]**

## Auth & Onboarding (`hono/`, `next/`)

### Done

* Authentication end to end: backend routes above plus the frontend flows (register, login, logout, session, email-confirmation callback). **[✅]**
* First-visit onboarding (university/faculty/study/subject selection). **[✅]**
* Notifications for onboarding and account creation. **[✅]**

### Todo

* Register/sign-up field validation (client and API). **[🔲]**

## API Client & Shared Types (`shared/`, `next/`)

### Done

* **No Hono RPC client** (`hc<AppType>` hung `tsc`/`tsserver` at ~140 endpoints); routes are plain unchained statements. **[✅ decision]**
* **Generated `apiRoutes` + `apiFetch`:** `shared/config/api-routes.ts` (auto-generated from `shared/config/api.ts`; regenerated on dev or `npm run generate-api-routes`), `next/lib/api.ts` `apiFetch`, `shared/utils/api.utils.ts` (`apiUrl`, `getDatabaseAcademicEndpoints`). Sanity and Next both use it. **[✅]**
* **Typed route responses in `shared/types/`** (see Backend). **[✅]**
* Sanity TypeGen output lives in `shared/types/`; academic entity types derive from query results via `WithResolvedSanityData`; `hono/src/sanity-stub.d.ts` supports this. **[✅]**

### Todo

* Add the `generate-api-routes` command to `AGENTS.md`'s generated-files list. **[🔲]**
* Move the `UserRole`/`ProfileSubjectStatus`/`FlagStatus` types out of `api.types.ts` as its TODOs note. **[🔲]**

## Frontend (`next/`)

### Done

* Nested academic catalog routing (`/university/.../subject/[slug]`; professors flat at `/professor/[slug]`) with ancestor-scoped GROQ and full-chain links. **[✅]**
* Script listing, sorting, filtering. **[✅]**
* Homepage server rendering with cached top scripts instead of fixture data. **[✅]**
* Subject detail pages render cached scripts for their database subject instead of fixture data. **[✅]**
* Homepage subject sidebar uses subjects from the authenticated user’s enrolled studies, excluding completed subjects, with guest and onboarding-empty alternatives. **[✅]**
* Signed-in user page resolves its subject sidebar from the same incomplete-study-subject data. **[✅]**
* Homepage scripts use the selected studies’ non-completed subjects when available, otherwise cached global top scripts. **[✅]**
* Auth, onboarding, and onboarding/account-creation notifications (see above). **[✅]**

### Todo

* Portable Text **editor** component (shared config with `PortableTextContent`) and its use in script title/description fields. **[✅]**
* Script rendering for multiple files and Portable Text title/description. **[🔲]**
* Create-script flow: subject-scoped creation, Portable Text title/description, professor and exam-session selection, additional reading, and validated multi-file upload via `apiFetch`. **[✅]**
* Script search (local-first + API fallback). **[🔲]**
* Loading, empty, error states across pages and search. **[🔲]**
* Script edit/delete permissions in UI; guest download/preview with dedupe. **[🔲]**
* "You've been restricted" UI state on protected actions. **[🔲]**
* Professor/subject rating UI. **[🔲]**
* Profile page (academic data, achievements). **[🔲]**
* Notification preferences/settings and additional notification kinds. **[🔲]**
* Admin UI: academic sync + dependency checks, `professor_studies`, user restrictions, flag resolution/moderation views, suspicious-download review. **[🔲]**
* Polish: z-index variables, confirm modal, don't render closed dialogs, image sizes, mobile, accessibility, production CSS obfuscation. **[🔲]**

## Suggested Order

1. Portable Text editor + create-script flow (core content type; several other items depend on it).
2. Server-side Portable Text allow-list validation before user content goes live.
3. Finish response typing rollout; refresh `API_TESTING_GUIDE.md`.
4. Moderation/admin UI.