# Scriptr: Progress & Todos

What's built and what's outstanding. See `ARCHITECTURE.md` for the current
system design and `TODO.md` for ideas that are not yet concrete work.

Last reconciled: 2026-10-09.

In-code `TODO` and `Deferred:` comments have been removed from the source. The
work they described is tracked below, with a link to the code it belonged to.
File links are to the file; the surrounding text names the function or field.

> **Standing rule:** any Postgres or Sanity schema change is followed by
> `npm run gen:api-types` / `npm run sanity:typegen` and a clean
> `npm run check-types` before it counts as done.

## Backend API

### Done

- **Academic catalog:** the University → Faculty → Study → Subject hierarchy, **[✅]**
  Professors, junction tables, validation, dependency checks, and internal
  catalog synchronization are implemented.
- **University storage configuration:** `r2_bucket_id` is validated and **[✅]**
  persisted through the internal university create/update/sync routes, which
  are now the only university write path (the legacy mutation routes were
  removed from `universities.ts`).
- **Script API:** scripts support Portable Text metadata, multi-file uploads, **[✅]**
  subject/professor validation, hierarchy resolution, author/admin management,
  fuzzy search, faculty-scoped listing, and individual file removal.
- **Comments and moderation:** threaded comments and replies, pagination, **[✅]**
  reactions, likes, flags, author/admin moderation, rate limits, Portable Text
  validation, engagement aggregation, and cached comment pages are implemented.
- **Profiles and user selections:** public profiles, the authenticated **[✅]**
  `me` resource, admin management, and faculty/study/subject selections are
  implemented.
- **Votes, favorites, and ratings:** atomic script voting, favorites, rating **[✅]**
  types, professor/subject ratings, and rating statistics are implemented.
- **Authentication and authorization:** registration, login, logout, session **[✅]**
  refresh, email-confirmation callback, cookie-based sessions, protected
  mutations, registration/login hardening, and admin-only access controls are
  implemented.
- **Notifications and achievements:** notification delivery and management, **[✅]**
  onboarding/account notifications, and metric-based achievement awarding are
  implemented.
- **User restrictions:** admin restriction management and database-enforced **[✅]**
  restrictions on protected mutations are implemented.
- **Caching and revalidation:** tagged Next.js Data Cache entries and backend **[✅]**
  mutation-driven revalidation for public scripts and profiles are implemented.
- **Typed API contract:** route response types live in `shared/types/` and **[✅]**
  are consumed consistently by the frontend and Studio.
- **Production request logging:** development request logging is skipped when **[✅]**
  `NODE_ENV` is `production` ([`hono/src/index.ts`](hono/src/index.ts)).

### Todo

- **Achievement definitions CRUD:** add admin management for **[🔲]**
  `achievement_definitions`; public reading already exists.
- **Catalog delete policy:** decide whether **[🔲]**
  `faculties_university_id_fkey` should use `RESTRICT` instead of
  `CASCADE` to match the application-level dependency checks.
- **Moderator notifications:** add escalation for repeated flags and route **[🔲]**
  moderator-generated flags to admins.

## R2 / File Storage

### Done

- **Multi-file R2 uploads:** validated uploads, deterministic project/user keys, **[✅]**
  per-university bucket resolution, recorded storage metadata, and public
  preview/download signing are implemented.
- **Storage cleanup:** failed script creation, failed uploads, and deleted **[✅]**
  scripts clean up their associated R2 objects on a best-effort basis.
- **Object caching:** uploads are stored with **[✅]**
  `Cache-Control: public, max-age=31536000, immutable`, which is safe because
  every object key contains a random UUID and is never overwritten
  ([`hono/src/routes/file-ops.ts`](hono/src/routes/file-ops.ts)).

### Todo

- **User avatars:** optimize and store avatar files in R2. **[🔲]**
- **File optimization:** optimize images and other supported files before R2 **[🔲]**
  storage.

## Sanity CMS

### Done

- **Academic content model:** University, Faculty, Study, Subject, and Professor **[✅]**
  schemas, relationships, reusable schema pieces, and slug handling are
  implemented.
- **Database synchronization:** Create in Database, Sync with Database, **[✅]**
  publish gating, and dependency-checked deletion are implemented and tested
  across academic entity types.
- **Studio/API integration:** internal API authentication, deployed API **[✅]**
  configuration, and shared academic endpoint/type mappings are wired up.

### Todo

- **Studio cleanup:** remove unused schemas, utilities, and constants. This **[🔲]**
  includes the commented-out legacy hook in
  [`sanity/sanity-hooks/useSanityFetch.ts`](sanity/sanity-hooks/useSanityFetch.ts)
  (verify the live hook against the production Studio fetch flow) and the
  commented-out `renderChild` in
  [`sanity/schemas/portable-text/plugins/portable-highlights.tsx`](sanity/schemas/portable-text/plugins/portable-highlights.tsx)
  (use the improved Portable Text input API when it becomes available).
- **Academic field rules:** **[✅]**
  - [`sanity/schemas/academic/professor.ts`](sanity/schemas/academic/professor.ts):
    constrain a professor's faculties to a single university, and type the
    `studies` reference filter callback with a schema type instead of the
    inline inferred shape.
  - [`sanity/schemas/academic/subject.ts`](sanity/schemas/academic/subject.ts):
    validate that assigned professors belong to the selected study.
- **Shared field builders:** in **[🔲]**
  [`sanity/schemas/common/academicFields.tsx`](sanity/schemas/common/academicFields.tsx),
  allow customization and overrides in `academicGrouping`, and decide whether
  the string `bio` variant should be removed.
- **Link selector:** list pages and academic entities dynamically in **[🔲]**
  [`sanity/schemas/common/link-selector.ts`](sanity/schemas/common/link-selector.ts)
  (or hardcode the main pages and fetch the rest individually), then replace
  the plain `url` website field in
  [`sanity/schemas/misc/person.ts`](sanity/schemas/misc/person.ts) with it.
- **Validation:** add `min` for string fields in `buildLengthRules` in **[🔲]**
  [`sanity/schemas/validation.ts`](sanity/schemas/validation.ts) once the
  validation revamp lands (a `min` rule currently breaks rich text
  validation).
- **Studio styles:** add the remaining variants and nest the styles in **[🔲]**
  [`sanity/styles/components/button-color-variants.css`](sanity/styles/components/button-color-variants.css).
- **Secret handling:** decide whether the internal secret should be encrypted **[🔲]**
  or otherwise protected with a shared environment-specific mechanism.
- **Structure tool:** decide how page data should be represented and improve **[🔲]**
  the structure tool around that model, including sorting people by academic
  field in
  [`sanity/structure-tool/misc-structure.ts`](sanity/structure-tool/misc-structure.ts).
- **Semester model:** change semesters from the current representation to **[🔲]**
  numeric values and update Sanity, database, API, and consumers.
- **Elective subjects:** define a data shape and UI behavior for electives that **[🔲]**
  do not have the normal semester/year fields.

## Auth & Onboarding

### Done

- **End-to-end authentication:** backend and frontend registration, login, **[✅]**
  logout, session handling, email confirmation, and protected actions work
  together.
- **Onboarding:** first-visit university, faculty, study, and subject **[✅]**
  selection is implemented and persisted.
- **Account notifications:** onboarding and account-creation notifications are **[✅]**
  integrated.

## API Client & Shared Types

### Done

- **Generated API client surface:** `apiRoutes` is generated from the route **[✅]**
  configuration and `apiFetch` provides the shared frontend request layer,
  with domain-specific wrappers.
- **Shared contracts:** API response types, Sanity TypeGen output, academic **[✅]**
  entity transformations, and shared configuration are centralized in
  `shared/`.
- **Scalable route typing:** the Hono RPC client was intentionally replaced by **[✅]**
  generated route paths after the full route graph became too expensive for
  TypeScript tooling.
- **API endpoint generation:** `npm run gen:api-endpoints` is documented and **[✅]**
  used to keep generated route paths synchronized with the Hono route tree.
- **Shared type cleanup:** `UserRole` and `ProfileSubjectStatus` live in **[✅]**
  `shared/types/profile.types.ts` and `FlagStatus` in
  `shared/types/flags.types.ts`.

## Frontend

### Done

- **Public API fallback:** public script feeds and search render empty states
  when the API is unavailable; authenticated reads and mutations still surface
  errors. **[✅]**
- **Academic navigation:** nested university/faculty/study/subject routing and **[✅]**
  flat professor pages use ancestor-scoped Sanity queries and complete links.
- **Script discovery:** script listing, sorting, filtering, cached homepage and **[✅]**
  subject feeds, and the backend fuzzy-search capability are implemented.
- **Script creation:** subject-scoped creation, Portable Text editing, **[✅]**
  professor/exam-session selection, additional reading, validated multi-file
  uploads, protected-action handling, and success/error flows are implemented.
- **Script detail experience:** script metadata, Portable Text content, files, **[✅]**
  previews, downloads, comments, additional reading, and empty states are
  implemented.
- **Comments and engagement UI:** threaded comments, replies, reactions, **[✅]**
  likes, moderation actions, votes, favorites, and related API integration are
  implemented.
- **Authentication and onboarding UI:** auth flows, onboarding, protected **[✅]**
  actions, account state, and responsive auth dialogs are implemented.
- **Responsive navigation and dialogs:** the responsive navbar, mobile drawer, **[✅]**
  persistent desktop collapse state, shared dialog behavior, and responsive
  layout primitives are implemented.
- **Homepage visual system:** the animated canvas background, configurable **[✅]**
  mobile behavior, and Studio controls for its major visual elements are
  implemented.
- **Portable Text UI:** shared editor/content behavior and toolbar styling are **[✅]**
  implemented.
- **Shared UI architecture:** reusable components, shared strings for completed **[✅]**
  feature areas, thin page loaders, and the shared API client are in place.
- **Image contract:** `NextImage` requires `sizes` whenever `fillProp` is set. **[✅]**

### Todo

- **Script search UI:** connect the existing local/API search capability to the **[🔲]**
  frontend search experience.
- **State coverage:** finish loading, empty, and error states across remaining **[🔲]**
  pages and flows.
- **Script management UI:** finish edit/delete permissions and the remaining **[🔲]**
  guest preview/download behavior.
- **Restriction UX:** add the dedicated restricted-user state for protected **[🔲]**
  actions.
- **Ratings UI:** add professor and subject rating interfaces. **[🔲]**
- **Profile experience:** finish the profile page with academic data, **[🔲]**
  achievements, activity, and the revised subject layout.
- **Notification settings:** add notification preferences and remaining **[🔲]**
  notification kinds/UX.
- **Admin UI:** add academic synchronization/dependency tools, **[🔲]**
  `professor_studies`, user restrictions, flag resolution/moderation, and
  suspicious-download review.
- **Button accessibility:** require appropriate ARIA attributes on **[🔲]**
  [`next/components/common/Button.tsx`](next/components/common/Button.tsx).
- **Subject navigation:** fix incorrect subject overview card links. **[🔲]**
- **Portable Text toolbar:** fix list-numbering behavior and weight icons; **[🔲]**
  keep the dropdown menu within the viewport in
  [`next/components/typography/portable-text/toolbar/PTDropdown.tsx`](next/components/typography/portable-text/toolbar/PTDropdown.tsx);
  share the decorator-category logic in
  [`PTClearOtherDecorators.tsx`](next/components/typography/portable-text/toolbar/PTClearOtherDecorators.tsx)
  with the Studio instead of keeping two copies.
- **Operation-error UX:** standardize operation failures as toasts where **[🔲]**
  appropriate and document the convention in `ARCHITECTURE.md`.
- **Study tips:** provide study tips for guests and users without onboarding **[🔲]**
  data, sourced from Sanity.
- **Root layout:** in [`next/app/layout.tsx`](next/app/layout.tsx), factor the
  font setup out of the file and build `metadata` with `generateMetadata` from
  Sanity data.
- **Study overview metadata:** add more administrator/study metadata to the **[🔲]**
  card in
  [`next/components/academics/study/StudyOverviewCard.tsx`](next/components/academics/study/StudyOverviewCard.tsx)
  when it becomes available.
- **Draft mode:** restore the `/api/disable-draft` endpoint that **[🔲]**
  [`next/components/ui/DisableDraft.tsx`](next/components/ui/DisableDraft.tsx)
  links to.
- **Type cleanups:** derive the `AcademicPathInput` types in
  [`next/lib/academic-routes.ts`](next/lib/academic-routes.ts) from Sanity.
- **UI polish:** finish remaining z-index, modal lifecycle, image sizing, **[🔲]**
  mobile, accessibility, and production CSS polish.
- **Professor page styling and layout:** improve the visual presentation and arrangement of professor-related information. **[✅]**

## Tooling & Quality

### Done

- **Monorepo TypeScript setup:** shared strict compiler configuration is used **[✅]**
  across the workspaces, with workspace-specific includes and aliases.
- **Next.js modernization:** Next.js 16, Turbopack, React Compiler, and a **[✅]**
  minimal supported `next.config.ts` are in place; stale package-import
  optimization and development cache flags were removed.
- **Build and type-check pipeline:** workspace builds and type-checks are **[✅]**
  wired through the root npm scripts, with generated API and schema types kept
  separate from source.
- **Security hardening:** database-backed authorization, vote RPC **[✅]**
  hardening, restricted trigger execution, and generic API database-error
  responses are implemented.
- **Documentation alignment:** the API reference and testing guide have been **[✅]**
  reconciled with the current route set.
- **TODO audit:** every in-code `TODO` and `Deferred:` comment was moved into **[✅]**
  this file (see the links in the sections above) and removed from the source.

### Todo

- **Biome coverage:** enable additional useful rules after reviewing their **[🔲]**
  signal-to-noise ratio.
- **Error hygiene:** complete the project-wide review of user-facing errors, **[🔲]**
  ensuring stack traces, database details, and other internal information are
  never exposed.
- **Production registration incident:** investigate the original academic-profile
  registration failure if it recurs with valid production catalog selections.
  The current deployed path was verified successfully with a fresh test account
  on 2026-10-09.

## Suggested Order

1. Decide the faculty-delete policy (`faculties_university_id_fkey`).
2. Add achievement-definition CRUD and the remaining backend moderation
   capabilities.
3. Complete moderator notifications and the admin/moderation UI.
4. Finish the main frontend product gaps: search UI, script management,
   restriction UX, ratings, profile, and notification settings.
5. Close frontend quality work: missing and empty states, state coverage,
   DB-id removal, strings/localization, accessibility, image sizes,
   navigation fixes, toolbar behavior, the root layout and dialog items, and
   remaining UI polish.
6. Complete R2 improvements: avatars and file optimization.
7. Finish Sanity cleanup, the academic field rules, and the structure/schema
   decisions.
8. Complete the tooling quality pass: Biome rules and error hygiene.

Loose ideas and open questions that are not concrete enough for this list live
in `TODO.md`.