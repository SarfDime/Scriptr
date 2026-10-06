# Scriptr: Progress & Todos

What's built, what's outstanding. See `ARCHITECTURE.md` for how the finished
pieces are designed to work. Last full reconciliation: 2026-10-03. Spot-checked against the code on
2026-10-06: file-op key verification, R2 cleanup, the `apiRoutes` generator
command, and the route-registration order in `scripts.ts`.

> **Standing rule:** any change to the Postgres or Sanity schema must be
> followed by `npm run gen:api-types` / `npm run sanity:typegen` and a clean
> `npm run check-types` before it counts as done.

## Backend API (`hono/`)

### Done

* **Schema:** `profiles`, `scripts`/`script_files`, catalog tables + junctions, `profile_faculties`/`profile_studies`/`profile_subjects`, `download_events`, `flags`, `comments` + reactions/likes, `votes`, `script_favorites`, `rating_types`/`professor_ratings`/`subject_ratings`, `achievement_definitions`/`profile_achievements`, `notifications`, `profile_restrictions`. Constraints, indexes, Portable Text size caps, score/status `CHECK`s. **[✅]**
* **Catalog API:** full read/write for universities, faculties, studies, subjects, professors and every junction table, gated by `x-internal-secret`, service-role client only. Universities have full CRUD + sync, with an app-level `faculties` dependents check on delete. **[✅]**
* **Scripts:** multi-file upload, Portable Text title/description (server-side allow-list and 2 KiB/50 KiB caps), single-subject constraint, auto-resolved hierarchy, professor validation, author/admin edit/delete, fuzzy search, faculty-scoped listing. **[✅]**
* **Downloads:** dedupe (account → IP → device), service-role only. **[✅]**
* **Comments** (script/professor/user threads, nested replies, independently toggled multi-reactions, likes; inline-only Portable Text with headings, lists, and alignment excluded), **flags** (user create/view/delete own; admin list/resolve via RLS), **votes** (atomic `toggle_vote` RPC), **favorites**, **ratings** (types, professor/subject ratings, stats). **[✅]**
* **Profiles:** public list/lookup/stats, `me` read/update/delete, admin patch/delete, internal-only role changes. **[✅]**
* **Public-read caching:** script and public-profile data use tagged Next Data Cache entries; mutations revalidate affected script and profile representations. **[✅]**
* **Profile selections:** `profile-faculties`, `profile-studies`, `profile-subjects` own-resource CRUD. **[✅]**
* **Auth:** register, login, logout, session, and `/auth/callback` (email-confirmation token handoff, implicit flow) via the Supabase Auth cookie; no Bearer path. `/login` and `/callback` return the app-shaped session user, so the client doesn't refetch `/session`. **[✅]**
* **Notifications:** list (optional `is_read` filter), unread count, mark one/all read, delete. Onboarding and account-creation notifications are created. **[✅]**
* **Achievements:** award-check helper (metric vs `achievement_definitions.threshold` → `profile_achievements` + notification), wired into vote, download, and comment endpoints. **[✅]**
* **Restrictions:** admin restrict/unrestrict endpoint (`restrictions.ts`, `is_admin()` RLS). **[✅]**
* **Typed responses:** route responses are typed against types in `shared/types/` (e.g. `c.json<LoginResponse>(...)` using `auth.types.ts`), so `next/` and `sanity/` consume the same shapes. **[✅]**
* **Portable Text validation:** script and comment write routes enforce the supported block/mark allow-list; Next.js forms enforce script byte limits and the comment minimum length locally. **[✅]**
* Moderator role has no access checks anywhere; every elevated check is `is_admin()`. **[✅]**
* `API_DOCUMENTATION.md` reconciled with the route set. **[✅]**

### Todo

* **Finish response typing rollout** — verify every route file uses shared response types (all routes mounted in `index.ts` must be covered; check `notifications.ts` and the rest). **[🔲]**
* **Verify `GET /scripts/my-scripts`** — it is registered after `GET /scripts/:id` in `scripts.ts`, so Hono's first-match ordering likely routes it to `/:id` (which returns a 404 for the non-UUID). Confirm with a request; if so, move it above `/:id`. **[🔲 bug?]**
* **Register hardening:** unique usernames, spam-email blocking, rate limiting. **[🔲]**
* **Individual script file removal** — RLS allows it, no endpoint exists. **[🔲]**
* **Achievement definitions CRUD** (admin) — only public read exists. **[🔲]**
* **`faculties_university_id_fkey` is `ON DELETE CASCADE`** — conflicts with the app-level dependents-check pattern; decide on `RESTRICT`. **[🔲 decision]**
* **`API_TESTING_GUIDE.md` refresh** — stale vs multi-file upload, universities mutation routes, auth callback. **[🔲]**
* **Moderator notification pipeline** (repeated flags → moderators, moderator flag → admins). **[🔲 Deferred]**

## R2 / File Storage (`hono/`)

### Done

* Multi-file `POST /file-ops/upload` (one `{ fileKey, fileType, fileSizeBytes, bucket }` per file). **[✅]**
* Keys: `{facultyId}/{studyId}/{subjectId}/{userId}/{uuid}.{ext}`, falling back to `{userId}/...`. **[✅]**
* University-scoped buckets (`universities.r2_bucket_id`, `resolveStorageScope()`, `?bucket=` on get-file) and `script_files.bucket`. **[✅]**
* R2 cleanup for deleted scripts and failed script creation. **[✅]**

### Todo

* **Sanity `r2BucketId` field on the University schema** — drafted, not confirmed applied; verify (sync was tested without it being confirmed). **[🔲 unconfirmed]**
* **User avatars** — optimize and store them in R2. **[🔲]**
* **Optimize images and files before they are written to R2.** **[🔲]**
* **Cache headers on R2 objects** — set proper caching headers. **[🔲]**

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
* **Semesters as numbers** — change the Sanity field and the DB/API consumers. **[🔲]**
* **Elective subjects** — they have no semester or year, so they need a different data shape and different UI handling. **[🔲]**

## Auth & Onboarding (`hono/`, `next/`)

### Done

* Authentication end to end: backend routes above plus the frontend flows (register, login, logout, session, email-confirmation callback). **[✅]**
* First-visit onboarding (university/faculty/study/subject selection). **[✅]**
* Notifications for onboarding and account creation. **[✅]**
* Sign-in/sign-up modal: `ui-above` frosted dialog with the forms on an inner panel. **[✅]**

### Todo

* Register/sign-up field validation (client and API). **[🔲]**

## API Client & Shared Types (`shared/`, `next/`)

### Done

* **No Hono RPC client** (`hc<AppType>` hung `tsc`/`tsserver` at ~140 endpoints); routes are plain unchained statements. **[✅ decision]**
* **Generated `apiRoutes` + `apiFetch`:** `shared/config/api-routes.ts` (auto-generated from `shared/config/api.ts`; regenerate with `npm run gen:api-endpoints`), `next/lib/api.ts` `apiFetch`, `shared/utils/api.utils.ts` (`apiUrl`, `getDatabaseAcademicEndpoints`). Sanity and Next both use it. **[✅]**
* **Typed route responses in `shared/types/`** (see Backend). **[✅]**
* Sanity TypeGen output lives in `shared/types/`; academic entity types derive from query results via `WithResolvedSanityData`; `hono/src/sanity-stub.d.ts` supports this. **[✅]**
* `npm run gen:api-endpoints` (regenerates `apiRoutes`; it does not run on dev) is documented in `AGENTS.md`, `README.md` and `hono/README.md`. **[✅]**

### Todo

* Move the `UserRole`/`ProfileSubjectStatus`/`FlagStatus` types out of `api.types.ts` as its TODOs note. **[🔲]**

## Frontend (`next/`)

### Done

* Nested academic catalog routing (`/university/.../subject/[slug]`; professors flat at `/professor/[slug]`) with ancestor-scoped GROQ and full-chain links. **[✅]**
* Script listing, sorting, filtering. **[✅]**
* Homepage server rendering with cached top scripts instead of fixture data; with selected studies' non-completed subjects when available, otherwise the cached global top scripts. **[✅]**
* Subject detail pages render cached scripts for their database subject instead of fixture data. **[✅]**
* Homepage and signed-in user page subject sidebars use the authenticated user's enrolled, non-completed subjects, with guest and onboarding-empty alternatives. **[✅]**
* Portable Text **editor** component (shared config with `PortableTextContent`) and its use in script title/description fields. **[✅]**
* Create-script flow: subject-scoped creation, Portable Text title/description, professor and exam-session selection, additional reading, and validated multi-file upload via `apiFetch`. **[✅]**
* **Script detail page (`/scripts/[slug]`):** multiple files, Portable Text title/description, comments, downloads, previews. Thin page + loader (`next/lib/script-detail-page.ts`) + small components in `next/components/academics/scripts/detail/`; frosted info/reading and files surfaces that wrap by available space; container-query file cards (image thumbnails, matching Preview/Download buttons with icons); framed preview modal; empty states for files and additional reading. Strings in `shared/strings/scripts-strings.ts`. **[✅]**

### Todo

* Script search (local-first + API fallback). **[🔲]**
* Loading, empty, error states across pages and search. **[🔲]**
* Script edit/delete permissions in UI; guest download/preview with dedupe. **[🔲]**
* "You've been restricted" UI state on protected actions. **[🔲]**
* Professor/subject rating UI. **[🔲]**
* Profile page (academic data, achievements). **[🔲]**
* Notification preferences/settings and additional notification kinds. **[🔲]**
* Admin UI: academic sync + dependency checks, `professor_studies`, user restrictions, flag resolution/moderation views, suspicious-download review. **[🔲]**
* **Strings:** finish moving inline user-facing text into `shared/strings/<area>-strings.ts` / `UI_STRINGS` (script detail and comments are done; the rest are not). **[🔲]**
* **Localization.** **[🔲]**
* **`NextImage`:** require the `sizes` prop whenever `fillProp` is true. **[🔲]**
* **Accessibility:** require aria attributes on buttons and links (type-level). **[🔲]**
* **Subject overview card links** are wrong — fix. **[🔲 bug]**
* **Portable Text toolbar:** fix list numbering increments, add an accent for the selected item, fix the weight icons. **[🔲]**
* Polish: z-index variables, confirm modal, don't render closed dialogs, image sizes, mobile, accessibility, production CSS obfuscation. **[🔲]**

## Tooling & Quality

### Todo

* **Biome:** enable more rules not covered today, mostly nursery rules. **[🔲]**
* **Error hygiene:** verify user-facing errors don't leak sensitive information or internal implementation details. **[🔲]**
* **In-code `TODO` comments:** audit and resolve them across the project. **[🔲]**

Loose ideas and open questions that aren't concrete yet live in `TODO.md`.

## Suggested Order

1. Finish response typing rollout; refresh `API_TESTING_GUIDE.md`.
2. Register validation and hardening (client, API, rate limiting).
3. Moderation/admin UI.
