# Scriptr: Progress & Todos

What's built and what's outstanding. See `ARCHITECTURE.md` for the current
system design. This is the single source of truth for planned work and ideas.

Last reconciled: 2026-10-16.

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
- Decided 2026-10-15: only `admin` moderates (delete scripts/comments, resolve
  flags, rating types). `moderator` gets no moderation tools in
  the API, RLS or UI; any future moderator role is limited to notifications
  (see **Deferred (Do Last)**). Routes already gate on `isAdmin`.

### Todo

Nothing open that blocks the frontend. Achievement-definition CRUD and
moderator notifications are deferred to the end (see **Deferred (Do Last)**).

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
  optimization pipeline rather than building a second one.
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

### Todo

Product features:

- **Header search bar:** the header icon currently links to `/search`; expand
  it into an inline search bar that appears on press.
- **Script management UI:** edit/delete permissions and the remaining guest
  preview/download behavior.
- **Ratings UI:** professor and subject rating interfaces.
- **Profile experience:** academic data, achievements, activity, and the
  revised subject layout.
- **Notification settings:** preferences and the remaining user-facing
  notification kinds/UX (moderator notifications are deferred).
- **Admin UI:** academic sync and dependency tools, `professor_studies`, user
  restrictions, flag resolution/moderation, suspicious-download review.
- **Study tips:** for guests and users without onboarding data, sourced from
  Sanity.
- **Study overview metadata:** more administrator/study metadata on the card in
  [`StudyOverviewCard.tsx`](next/components/academics/study/StudyOverviewCard.tsx)
  when it becomes available.
- **Professor comments:** add the comment section to professor pages, using the
  comment support already available in the backend.
- **Branding:** create the app logo and apply the branding across the app;
  update the README and use the logo as the favicon.
- **Footer:** add a simple footer to the page layout.
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

1. Finish the main frontend gaps: script
   management, ratings, profile, notification settings, then the
   admin/moderation UI (admin-only).
2. Close frontend quality work: state coverage, inline strings, accessibility,
   toolbar behavior, root layout, toasts, polish, SEO/performance.
3. R2 improvements: file optimization, then avatars on the same pipeline.
4. Sanity cleanup, the structure/semester/elective decisions.
5. Tooling pass: Biome rules, error hygiene, and the project-wide internal
   secrets decision.
6. Deferred: achievement-definition CRUD and moderator notifications.

## Exploratory Ideas

- **Background-mode easter egg:** clicking the black hole repeatedly switches
  the view background.
- **Christmas effects:** add a seasonal Christmas background and effects.
