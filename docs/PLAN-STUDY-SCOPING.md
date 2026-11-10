# Study Scoping Plan

Scoping the platform per study, with the study carried as a path segment
(`/study/[siteSlug]/…`). The catalog stays at the root. This file is the
implementation plan: what changes, in which app, and why.

## Progress

| Phase | Status | Notes |
|---|---|---|
| 1. Build and cache hygiene | Not started | Benefits the current setup on its own |
| 2. Data model | Not started | Foundation for everything else |
| 3. Roles and permissions | Not started | Required before any write is scoped |
| 4. Study routes | Not started | Frontend shell |
| 5. Study-scoped API | Not started | Writes scoped, reads open |
| 6. Achievements and notifications | Not started | Per study, plus global |
| 7. Cleanup and docs | Not started | — |

Last reconciled: 2026-11-10.

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
* **Restrictions and bans are org-wide.** They never carry a study id.
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

* [ ] Move the onboarding catalog out of the root layout
  ([`app/layout.tsx`](../next/app/layout.tsx)). It currently fetches every
  university, faculty, study and subject and passes it to a client provider, so
  it is serialised into every prerendered page. Fetch it per study, or on first
  modal open.
  *Why:* the payload is duplicated into every page's RSC output; this is the
  single largest build-time and artifact-size cost, and it grows with subjects.
* [ ] Split the sitemap into an index with a child sitemap per study plus one
  catalog sitemap ([`app/sitemap.ts`](../next/app/sitemap.ts)).
  *Why:* a single sitemap file is capped at 50,000 URLs, and it currently
  fetches every script at build time.
* [ ] Give the catalog routes a long `revalidate` instead of `revalidate = false`.
  *Why:* an ISR catalog can be refreshed by the publish webhook; a fully static
  one still needs a redeploy for every Sanity edit.

### Sanity (`sanity/`)

* [ ] Add a publish webhook that calls a Next route with `_type` and `_id`.
  Filter drafts out: `!(_id in path("drafts.**"))`.
  *Why:* editorial changes currently reach readers only on the next rebuild.

### Frontend (`next/`) + shared

* [ ] Replace the single `sanity` cache tag with per-type tags
  ([`sanity/lib/utils.ts`](../next/sanity/lib/utils.ts)): `sanity:university`,
  `sanity:faculty`, `sanity:study`, `sanity:subject`, `sanity:professor`,
  `sanity:website`. Each call site passes the level it reads.
  *Why:* one subject edit should not invalidate every page on the platform.
* [ ] Server route for the webhook: verify a shared secret, map `_type` to a tag,
  `revalidateTag(tag, { expire: 0 })`, rate-limited like
  [`api/revalidate`](../next/app/api/revalidate/route.ts).

---

## Phase 2 — Data model

### Hono (`hono/supabase/migrations/`)

* [ ] `studies.site_slug text` — unique on `lower(site_slug)`, format
  `^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$`, reserved-word check. *Why:* the study
  path segment must be globally unique.
* [ ] `studies.r2_bucket_id text` — backfilled from the parent university.
  *Why:* files are study-scoped, not university-scoped.
* [ ] `scripts.study_id uuid not null` — backfilled from `subjects.study_id`,
  then held by a composite FK `(subject_id, study_id) → subjects(id, study_id)`
  against a new `unique (id, study_id)` on `subjects`.
  *Why:* RLS, feeds, search and indexes stop needing a three-table join, and the
  denormalised value can never disagree with the subject.
* [ ] Indexes: `scripts (study_id, created_at desc)` and
  `scripts (study_id, vote_score desc) where is_flagged = false`.
* [ ] `profile_studies` gains `display_name`, `headline`, `year`, `is_primary`,
  `is_public`, `updated_at`; unique `(profile_id, study_id)`, one primary per
  profile, unique `(study_id, lower(display_name))` where public.
  *Why:* the academic profile is the per-study representation of a global
  identity.
* [ ] `achievement_definitions.study_id uuid null`; `profile_achievements` gets
  a study-scoped uniqueness rule.
  *Why:* achievements are per study, with global ones as `null`.

### Sanity (`sanity/schemas/academic/`)

* [ ] `study.siteSlug` — required, unique across all studies, reserved-word
  validation, read-only once `dbId` is set.
* [ ] `study.r2BucketId` — same field shape as
  [`university.r2BucketId`](../sanity/schemas/academic/university.ts).
* [ ] Per-study site settings: display name, logo, description, navigation.

### Hono

* [ ] Academic sync routes persist `site_slug` and `r2_bucket_id`; return `409`
  when the slug is taken, mirroring the existing duplicate-study check in
  [`sanity-academic.ts`](../hono/src/routes/sanity-academic.ts).
* [ ] `resolveStorageScope` reads the study bucket and prefixes keys with
  `<study>/<subject>/<user>` ([`lib/storage-scope.ts`](../hono/src/lib/storage-scope.ts)).

---

## Phase 3 — Roles and permissions

### Hono (`hono/supabase/migrations/`)

* [ ] `profiles.role` becomes `student | owner`; add `study_roles(profile_id,
  study_id, role)` with `role in ('admin','moderator')`.
* [ ] `has_study_role(uid, study_id, need)` — `security definer`, used by RLS.
* [ ] Rewrite content policies to `is_owner(uid) or has_study_role(uid, row.study_id, …)`:
  `scripts`, `comments`, `flags`, `ratings`, `subject_professors`, and the
  moderation routes. *Why:* admin and moderator must not act outside their study.
* [ ] Leave `profile_restrictions` and `is_restricted()` org-wide, unchanged.

### Hono (routes)

* [ ] `requireAdmin` becomes `requireOwner` for org endpoints (admin, restriction
  management, achievement definitions); add `requireStudyRole` for study
  endpoints ([`lib/require-admin.ts`](../hono/src/lib/require-admin.ts)).
* [ ] `GET /session` returns org role plus the caller's `study_roles`.

### Frontend

* [ ] Gate admin UI by org role, moderation UI by study role.

---

## Phase 4 — Study routes

### Frontend

* [ ] Move the existing pages into a `(site)` route group; URLs do not change.
* [ ] Add `app/study/[siteSlug]/` with `layout.tsx` (study chrome, theme,
  `StudyProvider`), `page.tsx` (home), `subject/[subjectSlug]`,
  `professor/[professorSlug]`, `scripts/[scriptSlug]`, `user/[username]`,
  `search`.
* [ ] Study layout resolves the study from `siteSlug` through one cached read,
  and 404s an unknown slug.
* [ ] `getAcademicPath` emits `/study/[siteSlug]/…` for study and subject paths
  ([`lib/academic-routes.ts`](../next/lib/academic-routes.ts)); add
  `getStudyPath`.
* [ ] `next.config.ts` 308s the nested `/university/…/study/[slug]/…` routes into
  the new tree. One canonical URL per entity.
* [ ] Catalog pages keep `dynamicParams = false`; study content pages drop
  `generateStaticParams` and use `revalidate`.
* [ ] Metadata and canonical URLs built from the study path; study home
  breadcrumbs link back to the catalog faculty page.

### Sanity

* [ ] Study `siteSlug` available in the catalog queries used for static params.

---

## Phase 5 — Study-scoped API

### Hono

* [ ] List endpoints accept an optional `study` filter: `/scripts`, `/scripts/top`,
  `/scripts/popular`, `/scripts/search`, `/professors`.
* [ ] Writes verify membership or a study role on the target study before
  writing — scripts, comments, votes, ratings, favorites.
* [ ] Reads stay unscoped by default so the catalog and cross-study pages work.
* [ ] Rate limits keyed by study where the endpoint is study-scoped.

### Frontend

* [ ] Every study-scoped server and client call passes the resolved `studyId`.
* [ ] Onboarding runs inside the study: no university/faculty picker, subjects
  limited to that study, academic profile written to `profile_studies`.
* [ ] Profile page: study-scoped view shows the study's academic profile and
  404s when the user is not a member; name falls back to the global profile.
* [ ] Cache tags gain a study dimension (`script:study:<id>`) so a publish in one
  study does not flush the others.

### Shared

* [ ] Types for the study context, scoped profile and study roles.

---

## Phase 6 — Achievements and notifications

### Hono

* [ ] Achievement triggers evaluate against the script's study; global
  definitions (`study_id is null`) still apply everywhere.
* [ ] `notifications.study_id` (nullable), set on every content notification.

### Frontend

* [ ] Achievement UI separates study achievements from global ones.
* [ ] Notification links resolve to `/study/[siteSlug]/…`.

---

## Phase 7 — Cleanup and docs

* [ ] Delete unused nested study/subject routes and their static-param queries.
* [ ] Update [`ARCHITECTURE-ACADEMIC-CATALOG.md`](ARCHITECTURE-ACADEMIC-CATALOG.md),
  [`ARCHITECTURE-USERS-AUTH.md`](ARCHITECTURE-USERS-AUTH.md),
  [`ARCHITECTURE-SYSTEM-OVERVIEW.md`](ARCHITECTURE-SYSTEM-OVERVIEW.md) and
  [`PROGRESS.md`](PROGRESS.md).
* [ ] Update [`API_DOCUMENTATION.md`](../hono/src/routes/API_DOCUMENTATION.md) with
  the study parameter and the new role model.
* [ ] `corepack pnpm gen:api-types`, `corepack pnpm sanity:typegen`,
  `corepack pnpm gen:api-endpoints`, `corepack pnpm check-types`, `corepack pnpm test`.
