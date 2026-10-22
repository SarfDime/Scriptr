# Scriptr: Progress & Todos

What's built and what's outstanding. See `ARCHITECTURE.md` for the current
system design. This is the single source of truth for planned work and ideas.

Last reconciled: 2026-10-17.

In-code `TODO` and `Deferred:` comments have been removed from the source; the
work they described is tracked below with a link to the code it belonged to.
Sections list what is done in a few lines (the code and `ARCHITECTURE.md` are
the detail) and then what is left. Tags: **[bug]**, **[decision]** (needs a
call before anyone builds it).

> **Standing rule:** any Postgres or Sanity schema change is followed by
> `corepack pnpm gen:api-types` / `corepack pnpm sanity:typegen` and a clean
> `corepack pnpm check-types` before it counts as done.

## Backend API

### Done

- Academic catalog (University → Faculty → Study → Subject, professors,
  junction tables, validation, dependency checks, internal sync). University
  `r2_bucket_id` is validated and persisted through the internal routes, which
  are the only university write path.
- Scripts: Portable Text metadata, multi-file uploads, subject/professor
  validation, hierarchy resolution, author/admin management, fuzzy search,
  faculty-scoped listing, individual file removal.
- Comments and moderation: threads, replies, pagination, reactions, likes,
  flags, author/admin moderation, rate limits, Portable Text validation,
  engagement aggregation.
- Profiles and selections, votes, favorites, ratings, notifications,
  achievement awarding, user restrictions.
- Auth: registration, login, logout, session refresh, email-confirmation
  callback, cookie sessions, register/login hardening, admin-only access.
- Tagged Data Cache entries with mutation-driven revalidation for public
  scripts and profiles.
- Typed route responses in `shared/types/`, consumed by the frontend and Studio.
- Request logging is skipped when `NODE_ENV` is `production`
  ([`hono/src/index.ts`](hono/src/index.ts)).
- Decided 2026-10-13: `faculties_university_id_fkey` stays `ON DELETE CASCADE`.
- `PATCH /scripts/:id` maps a restricted author's zero-row update (RLS
  `USING` includes `NOT is_restricted()`, so no `42501` is raised) to a `403`
  instead of a generic `500`. Update/delete/file-removal responses are typed in
  `shared/types/scripts.types.ts`.
- `authenticated` has **column-level** `UPDATE` on `scripts` (not table-wide, so
  `vote_score`, `download_count`, `is_flagged`, `author_id`, `subject_id` and
  `professor_id` stay locked): exactly `title`, `description`,
  `additional_reading` and `updated_at`, matching what `PATCH /scripts/:id`
  writes. Migrations
  `20261017211328_grant_authenticated_update_script_content_columns.sql` and
  `20261017212518_revoke_authenticated_update_script_subject_professor.sql`;
  any new column the route writes needs its own grant, otherwise it fails with
  `42501` (a `500`, deliberately not mapped to `403`).
- Removing a script file renumbers the remaining files' `position` (service-role
  client, since `script_files` has no UPDATE policy), so "File N" labels never
  skip.
- `POST /api/revalidate` expires tags with `revalidateTag(tag, { expire: 0 })`.
  The previous `'max'` profile is stale-while-revalidate, which served the old
  data (e.g. a deleted script) on the first request after a mutation.
- `script_files.file_name` (nullable, 1 to 255 chars; migration
  `20261018131652_add_script_files_file_name.sql`) keeps the uploaded name.
  `POST /file-ops/upload` returns it lowercased, accent-stripped, kebab-cased
  and without its extension (`toStoredFileName` in
  `shared/utils/file-name.utils.ts`), or `null` when nothing usable is left;
  `isScriptFileInput` rejects any other shape. Files from before this have no
  recoverable name and show the positional label.
- Downloads save to disk under the stored name: `GET /file-ops/get-file/*`
  with `?download=1` signs a URL with `Content-Disposition: attachment;
  filename="<file_name>.<ext>"` (plain `attachment` when there is no valid
  name); previews use the plain URL and stay inline. The download button
  navigates the current tab to that URL instead of opening a new one.
- `POST /scripts/:id/files` (author or admin, restriction-checked in RLS)
  appends already-uploaded files to an existing script and removes the R2
  objects again on any failure.
- Decided 2026-10-15: only `admin` moderates (delete scripts/comments, resolve
  flags, rating types). `moderator` gets no moderation tools in
  the API, RLS or UI; any future moderator role is limited to notifications
  (see **Deferred (Do Last)**). Routes already gate on `isAdmin`.
- Profile API: `PATCH /profiles/me` and `/profiles/:id` validate the body,
  store trimmed values, return a typed response (`ProfileUpdateResponse`), map
  `23505`/`23503`/`42501` to `409`/`409`/`403` (and a missing profile to
  `404`), and check every faculty/study write (diffed, inserts before
  deletes; admin edits of another user use the service-role client, since the
  selection tables have no admin RLS path). Username uniqueness runs the same
  pre-check as register (`hono/src/lib/username.ts`, shared by both). Favorites
  are public by design (`script_favorites` SELECT is `true`) and are read on
  the session client; a failed favorites read is a `500`, not an empty list.
  `PUT /profile-subjects/:subjectId` now revalidates the public-profile tags
  (it was the `GET` list that did, by mistake).

### Todo

Nothing open that blocks the frontend. Achievement-definition CRUD and
moderator notifications are deferred to the end (see **Deferred (Do Last)**).

- **Review `anon` table privileges (found 2026-10-17).** `anon` holds
  table-wide `INSERT`/`UPDATE`/`DELETE`/`TRUNCATE` on the `public` tables
  checked so far (`scripts`, `script_files`, `comments`, `profile_subjects`).
  That is Supabase's default grant, and RLS blocks the row-level writes
  (`auth.uid()` is null for `anon`). `TRUNCATE` is not subject to RLS but is not
  reachable through PostgREST. It is still more privilege than the API ever
  needs, so review and revoke what `anon` doesn't use. The same review should
  cover `authenticated`'s table-wide `UPDATE` on `script_files`, which has no
  UPDATE policy and is blocked only by RLS (the service-role client does the
  position renumbering).

## R2 / File Storage

### Done

- Validated multi-file uploads, deterministic keys, per-university buckets,
  recorded storage metadata, signed preview/download.
- Best-effort cleanup after failed uploads, failed script creation and deleted
  scripts.
- Objects are stored with `Cache-Control: public, max-age=31536000, immutable`
  (safe: every key contains a random UUID and is never overwritten;
  [`hono/src/routes/file-ops.ts`](hono/src/routes/file-ops.ts)).

### Todo

Priority work, scheduled right after the frontend gaps:

- **File optimization:** optimize images and other supported files before R2
  storage (compression/resizing on upload in
  [`file-ops.ts`](hono/src/routes/file-ops.ts)), keeping deterministic keys and
  the immutable `Cache-Control` behavior intact.
- **User avatars:** optimize and store them in R2, reusing the same
  optimization pipeline rather than building a second one. The profile
  frontend is ready (disabled picker, `uploadMyAvatar` stub); this adds the
  route and flips `AVATAR_UPLOAD_ENABLED`.
- **Serving cost:** review preview/download paths for avoidable egress and
  repeated signing once optimization lands.

## Sanity CMS

### Done

- Academic content model (University, Faculty, Study, Subject, Professor),
  relationships, reusable schema pieces, slug handling.
- Create/Sync with Database actions, publish gating, dependency-checked
  deletion, tested end to end across entity types.
- Internal API authentication, deployed API configuration, shared endpoint and
  type mappings.
- Academic field rules: a professor's faculties must belong to one university
  ([`professor.ts`](sanity/schemas/academic/professor.ts)) and a subject's
  professors must belong to the selected study
  ([`subject.ts`](sanity/schemas/academic/subject.ts)).

### Todo

- **Professor reference filter typing:** type the `studies` reference filter
  callback in [`professor.ts`](sanity/schemas/academic/professor.ts) with a
  schema type instead of the inline inferred shape (check whether this is
  already done).
- **Studio cleanup:** remove unused schemas, utilities and constants,
  including the commented-out legacy hook in
  [`sanity/sanity-hooks/useSanityFetch.ts`](sanity/sanity-hooks/useSanityFetch.ts)
  (verify the live hook against the production Studio fetch flow) and the
  commented-out `renderChild` in
  [`portable-highlights.tsx`](sanity/schemas/portable-text/plugins/portable-highlights.tsx)
  (use the improved Portable Text input API when it becomes available).
- **Shared field builders:** in
  [`academicGrouping`](sanity/schemas/common/academicFields.tsx) allow
  customization and overrides, and decide whether the string `bio` variant
  should be removed.
- **Link selector:** list pages and academic entities dynamically in
  [`link-selector.ts`](sanity/schemas/common/link-selector.ts) (or hardcode the
  main pages and fetch the rest), then replace the plain `url` website field in
  [`person.ts`](sanity/schemas/misc/person.ts) with it.
- **Validation:** add `min` for string fields in `buildLengthRules`
  ([`validation.ts`](sanity/schemas/validation.ts)) once the validation revamp
  lands (a `min` rule currently breaks rich text validation).
- **Studio styles:** add the remaining variants and nest the styles in
  [`button-color-variants.css`](sanity/styles/components/button-color-variants.css).
- **Structure tool [decision]:** decide how page data is represented, and sort
  people by academic field in
  [`misc-structure.ts`](sanity/structure-tool/misc-structure.ts).
- **Semester model:** change semesters to numbers and update Sanity, the
  database, the API and consumers.
- **Elective subjects:** define a data shape and UI behavior for electives,
  which have no semester or year.

## Auth & Onboarding

### Done

- End-to-end auth (register, login, logout, session, email confirmation,
  protected actions) on both backend and frontend.
- First-visit onboarding (university, faculty, study, subjects), persisted, with
  onboarding and account-creation notifications.
- Realtime field validation on login and register (shared validators in
  `shared/utils/api.utils.ts`), including the Supabase password policy and
  taken username/email shown as field errors from the `409` response.
- Custom domain: the API sets the session cookie with `Domain=.scriptr.uk`
  (`COOKIE_DOMAIN`) and `SameSite=Lax`, so Server Components receive it (see
  `ARCHITECTURE.md` §4).
- Session-seeded server reads no longer hide failures: on the script detail
  page the vote, favorite and session lookups treat only a missing cookie or a
  `401` as signed out; any other failure keeps the page, disables vote/save and
  shows a toast (`viewerDataFailed`). `/user` uses `getSessionRequired` so an
  API outage shows an error instead of redirecting to `/auth`.

### Todo

- **Finish production auth verification:** the Vercel production variables are
  set for `.scriptr.uk`, custom-domain CORS/revalidation, and the web API/site
  origins. The API is deployed with the shared cookie domain, and its DNS record
  is DNS-only so Cloudflare Bot Fight Mode can remain enabled for the web host
  without challenging Vercel server requests. Vercel Managed Bot Protection is
  set to log on the API project, while automatic DDoS mitigation remains on.
  The web deployment is live again; `/`, `/auth`, a script detail, and the API
  return successfully, while signed-out `/user` redirects as expected. Confirm
  the Supabase Auth Site URL is `https://scriptr.uk` and that
  `https://scriptr.uk/auth/callback` is allowed, then verify a signed-in hard
  refresh, vote/favorite state, and Studio sync.
  The production Sanity workflows set `SANITY_STUDIO_API_URL` to
  `https://api.scriptr.uk`. Users sign in once because existing cookies were
  scoped to the Vercel API host.
- **Post-login refresh:** after signing in through the auth modal, refresh the
  current page; after signing in from the `/auth` page, go to the homepage.

## API Client & Shared Types

### Done

- `apiRoutes` generated from the route configuration, `apiFetch` as the shared
  request layer with per-domain wrappers (`corepack pnpm gen:api-endpoints`).
- Shared contracts in `shared/`: API response types, Sanity TypeGen output,
  academic entity transforms, config. `UserRole`, `ProfileSubjectStatus` and
  `FlagStatus` live in `shared/types/`.
- The Hono RPC client was replaced on purpose by generated paths, because the
  full route graph was too expensive for TypeScript tooling.

## Frontend

### Done

- Academic navigation (nested university/faculty/study/subject routes, flat
  professor pages, ancestor-scoped queries), script listing/sorting/filtering,
  cached homepage and subject feeds. Public feeds and search render empty
  states when the API is down.
- Script creation (Portable Text editing, professor/exam-session selection,
  additional reading, validated multi-file upload) and the script detail page
  (files, previews, downloads, comments, empty states).
- Comments and engagement UI (threads, replies, reactions, likes, moderation,
  votes, favorites).
- Auth and onboarding UI, protected actions, responsive navbar with mobile
  drawer and remembered desktop collapse.
- Mobile-first layout: centered `Dialog` fills the screen below `md` with
  shared default styling (side trays keep their own); the `/auth` card fills the
  screen under the header; script lists use `grid-auto-fit`; `EntityCard` text
  (and so `SubjectCard`) wraps below `md`; `ui-container` follows
  `--breakpoint-lg`.
- Portable Text editor and toolbar (dropdown triggers take the accent while
  something inside is selected).
- Animated canvas background with configurable mobile behavior and Studio
  controls.
- Professor page styling and layout.
- Subject overview card links: each person/entity links to its own page
  (professor, study, faculty, university); previously every link went to a
  professor page.
- `NextImage` requires `sizes` whenever `fillProp` is set.
- Script search: `/search?q=` (Server Component, `noindex`, cookie forwarded so
  results are faculty-scoped) backed by `GET /scripts/search`; header search
  icon links to it, and the homepage `ScriptsSection` links to it from the
  local filter (`showGlobalSearch`).
- Script management: the script detail page shows Edit and Delete (title,
  description and additional reading; delete confirms and returns to the
  subject) plus a per-file Remove action to the author or an admin
  (`canManage` in the detail view model; the API stays the real boundary).
  Edit goes through `useProtectedAction` (restriction-checked, `403` is
  toasted); delete and file removal are never restriction-checked, so they are
  not wrapped. Guests already preview and download through the public
  `get-file` route. Components live in
  `next/components/academics/scripts/manage/`.
- Editing a script can also add files (upload, then attach; if the text save
  succeeds but the upload fails, a retry only re-sends the files). The create
  and edit forms share `ScriptFilesInput` / `useScriptFilePicker` and
  `ReadingLinksField` / `useReadingLinkTouched`.
- File cards and the preview modal show the stored file name (the type is
  already its own badge) and fall back to "File N" for older files.
- The script detail page shows a "Your script" badge to its author.
- Profile editing: the "Edit profile" dialog (`EditProfileDialog`,
  `useEditProfileForm`) edits username and full name through
  `PATCH /profiles/me` with the register form's validators; a taken username
  (`409`, `field: 'username'`) is shown on the field. Not restriction-checked,
  so it doesn't use `useProtectedAction`. The profile page updates in place
  (`reload()` on `ProfileProvider`, no loading flash) and the session is
  re-read. The signed-in avatar sits at the end of the header and links to
  `/user` while the navbar is collapsed (`HeaderProfileLink`).
- Academics editor: a separate "Edit academics" dialog on the profile
  (`EditAcademicsDialog`, `useEditAcademicsForm`) edits university → faculty →
  study and completed subjects. It reuses the onboarding wizard's selection
  cascade and subject logic (extracted to `useAcademicSelections`, now shared
  by both) and its select/subjects blocks, over local state seeded from the
  account (`lib/profile-academics.ts`). Saving diffs against the profile:
  faculty/study replacement through `PATCH /profiles/me`, then per-subject
  `PUT`/`DELETE`. Only `completed` subjects are edited; `currently_taking`
  and subjects of other studies are left alone.
- Profile subjects section (`ProfileSubjectsSidebar`): a toggle between
  Completed and Currently taking (in the section header, replacing the old
  no-op "Manage" button), plus separate study and year filters over the
  showing list (options come from that list; switching resets them; a filter
  with a single option is preselected and disabled). Both lists are limited
  to the subjects of the selected studies: completed ones, and everything
  else, which counts as currently taking. That is derived from the study, not
  read from stored `currently_taking` rows, which registration writes but the
  onboarding sync and academics editor don't. `SubjectsSidebar` gained an
  optional `toolbar` slot.
- One profile layout: `ProfilePage` (presentational) serves both `/user`
  (through the client `MyProfilePage`, which reads the shared profile state)
  and `/user/[username]` (server-fetched), replacing the duplicated page
  code. The public view now also shows subjects (the public profile endpoint
  already returned them). Visiting `/user/[username]` for your own username
  redirects to `/user`.
- Profile academic links use Sanity slugs: the onboarding catalog query now
  returns `slug` for universities, faculties and studies, and
  `buildProfileAcademics` maps profile rows to catalog entries by `dbId` to
  build `/university/...` paths (plain text when a slug is missing).
  `ProfileCard` takes that view model instead of raw rows. Resolves the old
  "use slugs, not ids" TODO.
- Onboarding copy lives in `UI_STRINGS.onboarding` (the modal and its select,
  subjects and account steps have no inline strings); the academics editor
  reuses the same strings.

### Todo

Product features:

- **Professor comments:** add the comment section to professor pages, using the
  comment support already available in the backend (the comment UI is
  target-agnostic). Open decision: professor pages are statically generated,
  and comment reads are personalized, so either load the comments on the
  client or let the page go dynamic.
- **Header search bar:** the header icon currently links to `/search`; expand
  it into an inline search bar that appears on press which on enter would take you to the search page with your search query.
- **Search bar validations**: Require input to be non-empty and properly formatted before triggering a search.
- **Study tips:** for guests and users without onboarding data, sourced from
  Sanity.
- **Footer:** add a simple footer to the page layout.
- **Ratings UI:** professor and subject rating interfaces.
- **Notification settings:** preferences and the remaining user-facing
  notification kinds/UX (moderator notifications are deferred).
- **Admin UI:** academic sync and dependency tools, `professor_studies`, user
  restrictions, flag resolution/moderation, suspicious-download review.
- **Profile experience (leftovers):** achievements (defer to the achievements
  todo) and the avatar upload itself. The avatar picker, `uploadMyAvatar` stub
  and `AVATAR_UPLOAD_ENABLED` flag exist but the picker is disabled
  (`TODO(r2-optimization)` in `lib/profile-avatar.ts`,
  `lib/api/profile-api.ts`, `AvatarField.tsx`); it lands with the R2
  optimization pipeline. Optional later: make the faculty/study + profile row
  save atomic with an RPC (the profile row is written first, so a selection
  failure leaves the profile fields saved). Registration still writes
  `currently_taking` rows that nothing reads for display now (profiles derive
  it from the selected studies); either stop writing them or keep them in sync.
- **Study overview metadata:** more administrator/study metadata on the card in
  [`StudyOverviewCard.tsx`](next/components/academics/study/StudyOverviewCard.tsx)
  when it becomes available.
- **Branding:** create the app logo and apply the branding across the app;
  update the README and use the logo as the favicon.
- **Localization:** allow project strings, script titles and descriptions to be
  localized; comments remain unchanged.

Correctness and quality:

- **State coverage:** loading, empty and error states on the remaining pages
  and flows. Includes `/search`: `searchScripts` goes through
  `apiFetchPublicRead`, so an API failure currently renders as "no results".
- **Button accessibility:** require ARIA attributes on
  [`Button.tsx`](next/components/common/Button.tsx) (type level).
- **Error UX:** never show raw implementation details to users; present
  formatted, user-facing errors and improve error pages to use the available
  space, with an optional theme-matched illustration. Standardize operation
  failures as toasts where appropriate and document the convention in
  `ARCHITECTURE.md`.
- **Draft mode / live editing [decision]:** draft mode is currently unused. If
  it returns, add the `/api/disable-draft` endpoint linked by
  [`DisableDraft.tsx`](next/components/ui/DisableDraft.tsx) and ensure the
  component is not rendered while draft mode is unused.
- **Inline strings:** many components still hold user-facing text inline.
  Move it into `shared/strings/<area>-strings.ts` / `UI_STRINGS` (script
  detail and comments are already done), one feature area per pass. Cover JSX
  text, `aria-label`, `placeholder`, `title`, and toast/error messages.
- **Portable Text toolbar:** fix list numbering and the weight icons; keep the
  dropdown menu inside the viewport in
  [`PTDropdown.tsx`](next/components/typography/portable-text/toolbar/PTDropdown.tsx);
  share the decorator-category logic in
  [`PTClearOtherDecorators.tsx`](next/components/typography/portable-text/toolbar/PTClearOtherDecorators.tsx)
  with the Studio instead of keeping two copies.
- **Root layout:** in [`next/app/layout.tsx`](next/app/layout.tsx), factor the
  font setup out and build `metadata` with `generateMetadata` from Sanity data.
- **Type cleanup:** derive the `AcademicPathInput` types in
  [`academic-routes.ts`](next/lib/academic-routes.ts) from Sanity types.
- **UI polish:** z-index variables need to come from STYLE and not be written inline so they can be properly tracked, modal lifecycle (don't render closed
  dialogs, confirm modal), image sizing, mobile and accessibility passes,
  production CSS obfuscation, toasts should be more mobile friendly.

SEO and performance:

- **Cache Components:** investigate the `use cache` directive and partial
  prerendering.
- **Sitemap:** add one.
- **Robots [decision]:** add `robots` only if needed (Cloudflare may already
  serve one; check first).
- **Other SEO routes:** add any other useful ones if needed.
- **Image loading:** use eager loading on the largest images.
- **Font preloading:** add preload where it helps and remove it from fonts
  that don't need it.

## Tooling & Quality

### Done

- Shared strict TypeScript config across workspaces; Next.js 16 with Turbopack
  and the React Compiler; root scripts for builds and type-checks.
- Security hardening: database-backed authorization, vote RPC hardening,
  restricted trigger execution, generic API database-error responses.
- API reference and testing guide reconciled with the route set; every in-code
  `TODO` / `Deferred:` moved into this file.

### Todo

- **Biome coverage:** enable additional rules after reviewing their
  signal-to-noise ratio.
- **Error hygiene:** project-wide review that stack traces, database details
  and other internals are never shown to users.
- **Internal secrets [decision, project-wide]:** `INTERNAL_API_SECRET`
  (server) and `SANITY_STUDIO_INTERNAL_SECRET` (Studio) are sent in request
  headers unencrypted, and the same question applies to any other
  service-to-service secret across `hono/`, `next/`, `sanity/` and `shared/`.
  Decide one mechanism for all of them: encryption, or salts set per
  environment via env vars that match across projects so each side can verify
  the other's requests. Covers config, docs and deploy workflows in every
  workspace, not just Studio.
- **Production registration incident (watch):** investigate the original
  academic-profile registration failure if it recurs with valid production
  catalog selections. The deployed path was verified with a fresh test account
  on 2026-10-09.

## Deferred (Do Last)

Deliberately postponed until everything else is done:

- **Achievement definitions CRUD:** admin management for
  `achievement_definitions`; public reading and awarding already exist.
- **Moderator notifications:** escalate repeated flags to moderators and route
  moderator-generated flags to admins. The moderator role stays
  notification-only; it never gets moderation tools.

## Suggested Order

1. Finish the main frontend gaps: professor comments, header search, study
   tips, footer, ratings, notification settings, then the admin/moderation UI
   (admin-only). Profile editing is done; its leftovers are listed under the
   frontend todo.
2. Close frontend quality work: state coverage, inline strings, accessibility,
   toolbar behavior, root layout, toasts, polish, SEO/performance.
3. R2 improvements: file optimization, then avatars on the same pipeline.
4. Sanity cleanup, the structure/semester/elective decisions.
5. Tooling pass: Biome rules, error hygiene, and the project-wide internal
   secrets decision.
6. Deferred: achievement-definition CRUD and moderator notifications.

## Exploratory Ideas

- **Christmas effects:** add a seasonal Christmas background and effects.
