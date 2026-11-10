# Study Scoping Plan

Scoping the platform per study, with the study carried as a path segment
(`/study/[siteSlug]/…`). The catalog stays at the root. This file is the
implementation plan: what changes, in which app, and why.

## Progress

| Phase | Status | Notes |
|---|---|---|
| 1. Build and cache hygiene | Done | Benefits the current setup on its own |
| 2. Data model | Done | Foundation for everything else |
| 3. Roles and permissions | Done | Owner and per-study admin/moderator roles, study-scoped policies, switcher-driven queues |
| 4. Study routes | Done | Shell, chrome per tree, setup and selection pages, study-scoped calendar and scripts |
| 5. Study-scoped API | Done | Reads open with an optional `?study=`, writes gated on membership/role, per-study cache tags, onboarding modal retired |
| 6. Achievements and notifications | Done | Study definitions measured in their study, `notifications.study_id`, badges grouped by scope, study-aware links |
| 7. Cleanup and docs | Not started | — |

Last reconciled: 2026-11-10 (Phases 1–6 complete).

## Important points

* **Org** = the platform (one org today). **Owner** is org-level, **admin** and
  **moderator** are study-level. `profiles.role` keeps `student` / `owner`;
  study roles live in their own table.
* **`study_id` is the only tenant key.** It goes in URLs (`siteSlug`), queries,
  RLS policies and storage prefixes — not `faculty_id`, not `university_id`.
* **Reads may be unscoped. Writes are study-scoped.** Any write that touches
  content requires membership in, or a role on, that study.
* **`site_slug` is a permanent handle, not a title.** Immutable once the study
  exists in the database. Renames need a redirect row, not an edit.
* **Files belong to a study**, not a university. The bucket and the key prefix
  both follow the study.
* **Profiles are global; academic profiles are per study.** One identity, one
  username across the org, one academic row per (profile, study).
* **Setup works for guests and is per study.** A signed-in viewer's setup lives
  in `profile_studies` / `profile_subjects`; a guest's lives in the browser,
  keyed by study. Dismissing setup is per study and stops the redirect for that
  study. Either way the study site stays readable without an account.
* **Restrictions and bans are org-wide.** They never carry a study id.
* **Professors are university-scoped, not study-scoped.** A professor belongs to
  one university and teaches across its studies, so a study never owns one and
  the professor page stays a catalog page. Their comments and ratings are keyed
  by the professor alone, which makes them university-wide while moderation is
  study-scoped — left as they are for now and recorded as deferred in
  [`PROGRESS.md`](PROGRESS.md).
* **Role rights.** An owner acts org-wide and gets the whole admin UI. A study
  `admin` gets the admin UI and every edit or delete of another member's content,
  inside their own studies only. A `moderator` is study-scoped like an admin but
  is meant to be narrower — flagging (which hides the item) and short temporary
  restrictions, no editing other people's content; today it still passes the
  content checks, which is recorded as deferred in
  [`PROGRESS.md`](PROGRESS.md).
* **The API cannot infer the study.** It is served from `api.scriptr.uk`, so the
  caller passes the study id. It is a filter, never an authorization grant —
  authorization stays in RLS and membership checks.
* **Static generation is for the bounded catalog only.** Universities,
  faculties, studies and professors. Anything whose page count grows with user
  activity (subjects, scripts, users) is ISR.
* **Sanity is the editorial source; Postgres is the runtime source.** `siteSlug`,
  names, buckets and `dbId` are mirrored on publish.
* Never hand-edit generated types, and regenerate after every schema change:
  `corepack pnpm gen:api-types`, `corepack pnpm sanity:typegen`.
* Every new env var needs an entry in the workspace's `ENV_REQUIREMENTS`.

---

## Phase 1 — Build and cache hygiene

Small, independent of scoping, and pays off immediately.

### Frontend (`next/`)

* [x] Move the onboarding catalog out of the root layout
  ([`app/layout.tsx`](../next/app/layout.tsx)). It fetches every university,
  faculty, study and subject, so passing it to a client provider serialised it
  into every prerendered page. It moved to a static route fetched on demand, and
  Phase 5 deleted that route: study pages read the study they render, and the
  only other readers take the catalog as a server prop.
  *Why:* the payload was duplicated into every page's RSC output — the largest
  build-time and artifact-size cost, and one that grows with subjects.
* [x] Split the sitemap into an index with a child sitemap per study plus one
  catalog sitemap ([`lib/sitemap-entries.ts`](../next/lib/sitemap-entries.ts)).
  *Why:* a single sitemap file is capped at 50,000 URLs, and it currently
  fetches every script at build time.
* [x] Keep the catalog routes at build time (`force-static`,
  `revalidate = false`) and let the publish webhook invalidate them by tag.
  *Why:* an editorial edit should not wait for a redeploy, and it should not wait
  for a clock either — a page only regenerates when a document it renders
  actually changed.

### Sanity (`sanity/`)

* [x] Add a publish webhook that calls a Next route with `_type` and `_id`.
  Filter drafts out: `!(_id in path("drafts.**"))`.
  *Why:* editorial changes currently reach readers only on the next rebuild.

### Frontend (`next/`) + shared

* [x] Replace the single `sanity` cache tag with per-type tags
  ([`sanity/lib/utils.ts`](../next/sanity/lib/utils.ts)): `sanity:university`,
  `sanity:faculty`, `sanity:study`, `sanity:subject`, `sanity:professor`,
  `sanity:website`. Each call site passes the level it reads.
  *Why:* one subject edit should not invalidate every page on the platform.
* [x] Server route for the webhook: verify a shared secret, map `_type` to a tag,
  `revalidateTag(tag, { expire: 0 })`, rate-limited like
  [`api/revalidate`](../next/app/api/revalidate/route.ts).

---

## Phase 2 — Data model

### Hono (`hono/supabase/migrations/`)

* [x] `studies.site_slug text` — unique on `lower(site_slug)`, format
  `^[a-z0-9]([a-z0-9-]{0,59}[a-z0-9])?$`, reserved-word check. *Why:* the study
  path segment must be globally unique.
* [x] `studies.r2_bucket_id text` — backfilled from the parent university.
  *Why:* files are study-scoped, not university-scoped.
* [x] `scripts.study_id uuid not null` — backfilled from `subjects.study_id`,
  then held by a composite FK `(subject_id, study_id) → subjects(id, study_id)`
  against a new `unique (id, study_id)` on `subjects`. A before-write trigger
  derives it, and the older single-column key was dropped because two keys
  between the same tables make every `subject:subjects(...)` embed ambiguous.
  *Why:* RLS, feeds, search and indexes stop needing a three-table join, and the
  denormalised value can never disagree with the subject.
* [x] Indexes: `scripts (study_id, created_at desc)` and
  `scripts (study_id, vote_score desc) where is_flagged = false`.
* [x] `profile_studies` gains `display_name`, `headline`, `year`, `is_primary`,
  `is_public`, `updated_at`; one primary per profile, unique
  `(study_id, lower(display_name))` where public. The primary key already made
  `(profile_id, study_id)` unique.
  *Why:* the academic profile is the per-study representation of a global
  identity.
* [x] `achievement_definitions.study_id uuid null`.
  *Why:* achievements are per study, with global ones as `null`.
  `profile_achievements` needs no change: a definition id stays globally unique,
  so `(profile_id, achievement_id)` already scopes each award to its study.

### Sanity (`sanity/schemas/academic/`)

* [x] `study.siteSlug` — required, unique across all studies, reserved-word
  validation, read-only once `dbId` and a handle exist together.
* [x] `study.r2BucketId` — same field shape as
  [`university.r2BucketId`](../sanity/schemas/academic/university.ts).
* [x] Per-study site settings: a tagline and an optional navigation-menu
  reference. Name, logo and description already exist on the study document.

### Hono

* [x] Academic sync routes persist `site_slug` and `r2_bucket_id`; return `409`
  when the slug is taken or changed after it is set, mirroring the existing
  duplicate-study check in
  [`sanity-academic.ts`](../hono/src/routes/sanity-academic.ts).
* [x] `resolveStorageScope` reads the study bucket, falling back to the
  university's, and prefixes keys with `<study>/<subject>/<user>`
  ([`lib/storage-scope.ts`](../hono/src/lib/storage-scope.ts)).

---

## Phase 3 — Roles and permissions

### Hono (`hono/supabase/migrations/`)

* [x] `profiles.role` becomes `student | owner`; add `study_roles(profile_id,
  study_id, role)` with `role in ('admin','moderator')`. One role per person per
  study, so an admin can hold any number of studies.
* [x] `has_study_role(uid, study_id, need)` plus `is_owner`, and `is_admin`
  kept as its alias so the policies that still call it moved meaning in one
  place.
* [x] Rewrite content policies to `is_owner(uid) or has_study_role(uid, row.study_id, …)`:
  `scripts`, `comments`, `flags`, `script_files` and `professor_studies`.
  *Why:* admin and moderator must not act outside their study. Ratings and
  achievement definitions stay owner-only: they are not per-study content.
* [x] Leave `profile_restrictions` and `is_restricted()` org-wide, unchanged.

### Hono (routes)

* [x] `requireAdmin` becomes `requireOwner` for org endpoints (admin, restriction
  management, achievement definitions); add `requireStudyRole`,
  `requireAnyStudyRole` for the moderation queues
  ([`lib/require-admin.ts`](../hono/src/lib/require-admin.ts)).
* [x] `GET /session` returns org role plus the caller's `study_roles`.
* [x] `GET /api/admin/studies` lists the studies the caller may act on; study
  roles are granted and revoked by owners at
  `PUT`/`DELETE /api/admin/profiles/:id/study-roles`.

### Frontend

* [x] Gate admin UI by org role, moderation UI by study role.
* [x] Master study switcher in the admin frame, persisted as the
  `scriptr-admin-study` cookie, listing only the caller's studies.
* [x] Consume the switcher's selection in the admin loaders and queues: the flag
  queue and the download review narrow to the selected study. Users,
  restrictions, rating types and announcements are org-wide by nature.
* [x] Show and edit a user's study roles in the admin user detail.
* [x] Convert the route-level moderation checks to the study-aware predicate.
  Scripts read `study_id` from the row they already load, comments resolve it
  from their script, and flags from their target; only the queues keep the
  coarse "any study role" check, because RLS decides which rows they return.
  `is_admin()` remains as the legacy alias of `is_owner` for the org-level
  policies that still spell it that way.

---

## Phase 4 — Study routes

### Frontend

* [x] Study layout resolves the study from `siteSlug` through one cached read
  (`getStudySite`), and 404s an unknown slug.
* [x] `getAcademicPath` emits `/study/[siteSlug]/…` for study and subject paths
  ([`lib/academic-routes.ts`](../next/lib/academic-routes.ts)), with
  `getStudyPath` for the site root.
* [x] 308 the nested `/university/…/study/[slug]/…` routes into the new tree,
  from the route itself rather than `next.config.ts` (the target needs the
  study's handle, which is data). A study without a handle keeps rendering at
  its nested URL, so nothing breaks mid-transition. One canonical URL per
  entity.
* [x] Catalog pages keep `dynamicParams = false`; study content pages drop
  `generateStaticParams` and `revalidate = false` — rendered once, then only the
  publish webhook.
* [x] `academic-setup` is a study page, not a modal: it reads only that study's
  subjects by year on the server and writes the academic profile directly. No
  provider, no client catalog.
* [x] The study-selection page lives in the main layout (`/start`): university →
  faculty → study, names and slugs only, no subjects. Guests and signed-in
  readers see the same page, and choosing a study hands off to its
  `academic-setup`.
* [x] A viewer with no academic profile for the study — and who has not
  dismissed setup for it — is sent to `academic-setup` (`StudySetupGate`, on the
  study home). Client-side on purpose: a guest's profile is in this browser, and
  reading the session on the server would make every study page dynamic.
* [x] `academic-setup` writes to `profile_studies` / `profile_subjects` when
  signed in and to a per-study browser record otherwise. "Skip for now" records
  a per-study dismissal and returns to the study home, which then offers the
  resume link.
* [x] Metadata and canonical URLs built from the study path; the study home's
  breadcrumbs link back to the catalog faculty page.
* [x] Move the existing pages into a `(site)` route group; URLs do not change.
  `admin`, `auth`, `api` and the sitemaps stay outside it, so site chrome can
  later be added without touching them.
* [x] `app/study/[siteSlug]/scripts/[scriptSlug]` — a script's canonical page.
  The root `/scripts/[slug]` 308s there once the study has a handle, and the
  page 404s a script that does not belong to its study. The handle comes from
  `studies.site_slug`, so the redirect starts working when the study is synced
  to the database.
* [x] `app/study/[siteSlug]/user/[username]` — the person's academic profile in
  that study, and a `404` when they are not a member. Identity stays global.
* [x] `app/study/[siteSlug]/calendar` — a calendar belongs to a study, so the
  `calendars` reference array moved from the website document onto the study
  document and the page moved into the site. The header alert is read in the
  study's layout and handed to the header from there, so it needs no
  request-time read on the page and no client fetch.
* [x] Chrome is per tree, not global-conditional: `app/(site)/layout.tsx` (the
  catalog), `app/(app)/layout.tsx` (account and admin) and
  `app/(study)/study/[siteSlug]/layout.tsx` (one study, with its calendar alert)
  each render `MainLayout`. The root layout keeps only what is genuinely global:
  providers, background, navigation drawer and notification tray.
* [x] Scripts have no page of their own: `/scripts/[slug]` is an HTTP route
  handler outside the catalog tree that only 308s to the owning study's site
  (and 404s when that study has no handle), so the catalog contains no script
  page at all — only forwarders for links minted before the move.
* [x] The catalog profile page shows identity, affiliations and activity — not
  the subject list, which belongs to the study site's view of the person.
* [x] Global search is catalog-only: universities, faculties, studies and
  professors. Scripts and subjects are searched inside a study.
* [ ] No professor route: professors are university-scoped.
* [x] The study home is the study's content surface: its subjects, its
  professors and its scripts with the search, subject filter and sort inline
  (`GET /scripts/study/:studyId`). No separate `/study/[siteSlug]/scripts`
  listing or `/study/[siteSlug]/search` page — one page a reader already lands
  on beats two more routes.
* [x] The "resume setup" notification is a link to the chosen study's
  `academic-setup` (or `/start` when nothing is chosen); the `open-onboarding`
  action kind is gone.
* [x] Retire the onboarding modal and `OnboardingProvider` — done in Phase 5:
  the study's setup page and `/start` own the flow, and the header alert takes
  its subjects from the study layout instead of the catalog.

### Sanity

* [ ] Study `siteSlug` available in the catalog queries used for static params.

---

## Phase 5 — Study-scoped API

### Hono

* [x] List endpoints accept an optional `study` filter: `/scripts`,
  `/scripts/top`, `/scripts/popular`, `/scripts/search`. `/scripts/study/:id`
  and `/scripts/subject/:id` already were scoped. No `/professors` filter:
  professors are university-scoped, so a study never narrows them.
* [x] Writes verify membership or a study role on the target study before
  writing — scripts, comments (and replies), votes, subject ratings, favorites
  (`hono/src/lib/study-access.ts`). Professor ratings and comments carry no
  study and keep their older rule.
* [x] Reads stay unscoped by default so the catalog and cross-study pages work.
* [x] Rate limits keyed by study where the endpoint is study-scoped: comments
  keep the per-caller bucket and gain a per-study one.

### Frontend

* [x] Every study-scoped server and client call passes the resolved `studyId`.
  The study home reads `GET /scripts/study/:studyId`; the catalog's own feeds
  stay unscoped on purpose.
* [x] Onboarding becomes `AcademicSetup` and runs inside the study: no
  university/faculty picker, subjects limited to that study, academic profile
  written to `profile_studies`.
* [x] Retire the onboarding modal and `OnboardingProvider`. The wizard state
  moved into the two pages; the deleted notification reminder's job is done by
  the study's own setup gate.
* [x] Guest academic storage is one record per study
  (`lib/study-setup-storage.ts`) instead of the single global
  `scriptr:guest-academic-data`, so completion and dismissal are per study, and
  it holds database ids.
* [x] Keep the guest's setup through registration: `lib/study-setup-sync.ts`
  applies each stored study through the study-scoped endpoints right after
  register or sign-in, so `academicProfile` dropped off the register payload and
  `getRegistrationAcademicProfile` is gone (it also dropped from the API).
* [x] Delete `/api/onboarding-catalog` and the demand-based client catalog fetch.
  `/start` reads the catalog in its own server query, and `/user` gets it as a
  server prop for the affiliations' links.
* [x] Profile page: study-scoped view shows the study's academic profile and
  404s when the user is not a member; name falls back to the global profile.
* [x] Cache tags gain a study dimension (`scripts:study:<id>`) so a publish in
  one study does not flush the others; the study home is tagged with it instead
  of `scripts:list`.

### Shared

* [x] Types for the study context, scoped profile and study roles: `StudyRole` /
  `StudyRoleAssignment`, `SessionUserSubject`, `ScriptSummary.study_id` and the
  role helpers in `shared/utils/api.utils.ts` already cover it, and the catalog
  types were trimmed to what the setup pages use.

---

## Phase 6 — Achievements and notifications

### Hono

* [x] Achievement triggers evaluate against the script's study; global
  definitions (`study_id is null`) still apply everywhere. The value is computed
  per scope, so a global threshold means "anywhere" and a study threshold means
  "here"; a mutation outside any study (a professor comment) evaluates only the
  global group.
* [x] `notifications.study_id` (nullable), set on every content notification:
  achievements (the definition's study), removed scripts and comments, and flag
  alerts (backfilled for stored rows).
* [x] Script hrefs in admin and notification payloads come from a shared builder
  (`shared/utils/site-paths.ts`), so a link points at the study site. The direct
  `scripts.study_id → studies` FK was added: without it PostgREST cannot join a
  script to its study.
* [x] Definitions are created and edited with a scope: platform-wide or one
  study, chosen in the admin editor (whose study list is the operator's own) and
  shown on every definition. Every definition that existed before the scope was
  moved onto LBE, the one study with content; platform-wide ones come later.
* [x] Announcements pick their audience: everyone, or one study. A study
  announcement is delivered to that study's students, its admins and moderators,
  and owners, carries `study_id`, and only that study's site shows it. An owner
  may address everyone or any study; a study admin only a study they administer,
  enforced by the insert policy as well as the route.

### Frontend

* [x] Achievement UI separates study achievements from global ones: platform
  badges first, then one group per study headed by its name, and the popover
  says which study a badge came from.
* [x] Notification links resolve to `/study/[siteSlug]/…`.
* [x] The tray reads the site it is on: a study site shows that study's
  notifications plus the platform-wide ones, and any other page shows everything,
  so a notification is never unreachable.

---

## Phase 7 — Cleanup and docs

* [ ] Delete unused nested study/subject routes and their static-param queries,
  along with the redirect and compatibility shims listed under "Study-routing
  shims" in [`PROGRESS.md`](PROGRESS.md).
* [ ] Update [`ARCHITECTURE-ACADEMIC-CATALOG.md`](ARCHITECTURE-ACADEMIC-CATALOG.md),
  [`ARCHITECTURE-USERS-AUTH.md`](ARCHITECTURE-USERS-AUTH.md),
  [`ARCHITECTURE-SYSTEM-OVERVIEW.md`](ARCHITECTURE-SYSTEM-OVERVIEW.md) and
  [`PROGRESS.md`](PROGRESS.md).
* [ ] Update [`API_DOCUMENTATION.md`](../hono/src/routes/API_DOCUMENTATION.md) with
  the study parameter and the new role model.
* [ ] `corepack pnpm gen:api-types`, `corepack pnpm sanity:typegen`,
  `corepack pnpm gen:api-endpoints`, `corepack pnpm check-types`, `corepack pnpm test`.
