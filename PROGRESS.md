# Scriptr: Progress & Todos

What's built and what's outstanding. See `ARCHITECTURE.md` for the current
system design and `TODO.md` for ideas that are not yet concrete work.

Last reconciled: 2026-10-08.

> **Standing rule:** any Postgres or Sanity schema change is followed by
> `npm run gen:api-types` / `npm run sanity:typegen` and a clean
> `npm run check-types` before it counts as done.

## Backend API

### Done

- **Academic catalog:** the University → Faculty → Study → Subject hierarchy, **[✅]**
  Professors, junction tables, validation, dependency checks, and internal
  catalog synchronization are implemented.
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

### Todo

- **Achievement definitions CRUD:** add admin management for **[🔲]**
  `achievement_definitions`; public reading already exists.
- **Catalog delete policy:** decide whether **[🔲]**
  `faculties_university_id_fkey` should use `RESTRICT` instead of
  `CASCADE` to match the application-level dependency checks.
- **University storage configuration:** persist `r2_bucket_id` through the **[✅]**
  internal university create/update/sync routes.
- **Duplicate university mutations:** consolidate the legacy **[✅]**
  `/api/universities` mutation routes with the canonical
  `/api/internal/universities` write path.
- **File-optional scripts:** allow a script to be created without an initial **[🔲]**
  file, then update the create UI and documentation around empty-file states.
- **Production request logging:** disable the development-oriented **[✅]**
  `honoLogRequest` output in production.
- **Moderator notifications:** add escalation for repeated flags and route **[🔲]**
  moderator-generated flags to admins.
- **Deferred TODO audit:** validation, Studio navigation, accessibility,
  metadata, and viewport refinements remain explicitly marked `Deferred` in
  their source files; the existing Button aria TODO remains intentionally
  unchanged.

## R2 / File Storage

### Done

- **Multi-file R2 uploads:** validated uploads, deterministic project/user keys, **[✅]**
  per-university bucket resolution, recorded storage metadata, and public
  preview/download signing are implemented.
- **Storage cleanup:** failed script creation, failed uploads, and deleted **[✅]**
  scripts clean up their associated R2 objects on a best-effort basis.

### Todo

- **User avatars:** optimize and store avatar files in R2. **[🔲]**
- **File optimization:** optimize images and other supported files before R2 **[🔲]**
  storage.
- **Object caching:** add appropriate cache headers to R2 objects. **[🔲]**

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

- **Studio cleanup:** remove unused schemas, utilities, and constants. **[🔲]**
- **Secret handling:** decide whether the internal secret should be encrypted **[🔲]**
  or otherwise protected with a shared environment-specific mechanism.
- **Structure tool:** decide how page data should be represented and improve **[🔲]**
  the structure tool around that model.
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
- **Shared contracts:** API response types, Sanity TypeGen output, academic **[✅]** **[✅]**
  entity transformations, and shared configuration are centralized in
  `shared/`.
- **Scalable route typing:** the Hono RPC client was intentionally replaced by **[✅]** **[✅]**
  generated route paths after the full route graph became too expensive for
  TypeScript tooling.
- **API endpoint generation:** `npm run gen:api-endpoints` is documented and **[✅]** **[✅]**
  used to keep generated route paths synchronized with the Hono route tree.

### Todo

- **Shared type cleanup:** move `UserRole`, **[✅]**
  `ProfileSubjectStatus`, and `FlagStatus` out of `api.types.ts` into
  their appropriate shared type modules.

## Frontend

### Done

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
- **Strings and localization:** finish moving remaining inline user-facing **[🔲]**
  strings into the shared string system, then add localization.
- **Accessibility and image contracts:** require appropriate ARIA attributes **[🔲]**
  and require `sizes` when `NextImage` uses `fillProp`.
- **Subject navigation:** fix incorrect subject overview card links. **[🔲]**
- **Portable Text toolbar:** fix list-numbering behavior and weight icons. **[🔲]**
- **Operation-error UX:** standardize operation failures as toasts where **[🔲]**
  appropriate and document the convention in `ARCHITECTURE.md`.
- **Study tips:** provide study tips for guests and users without onboarding **[🔲]**
  data, sourced from Sanity.
- **UI polish:** finish remaining z-index, modal lifecycle, image sizing, **[🔲]**
  mobile, accessibility, and production CSS polish.

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

### Todo

- **Biome coverage:** enable additional useful rules after reviewing their **[🔲]**
  signal-to-noise ratio.
- **Error hygiene:** complete the project-wide review of user-facing errors, **[🔲]**
  ensuring stack traces, database details, and other internal information are
  never exposed.
- **TODO audit:** review remaining in-code `TODO` comments and either resolve **[🔲]**
  them or convert them into tracked work.

## Suggested Order

1. Resolve the catalog/storage decisions: `r2_bucket_id` persistence,
   duplicate university mutations, and the faculty-delete policy.
2. Decide and implement the script-without-file model.
3. Add achievement-definition CRUD and the remaining backend moderation
   capabilities.
4. Complete moderator notifications and the admin/moderation UI.
5. Finish the main frontend product gaps: search UI, script management,
   restriction UX, ratings, profile, and notification settings.
6. Close frontend quality work: state coverage, strings/localization,
   accessibility, image contracts, navigation fixes, toolbar behavior, and
   remaining UI polish.
7. Complete R2 improvements: avatars, file optimization, and object cache
   headers.
8. Finish Sanity cleanup and structure/schema decisions.
9. Complete the tooling quality pass: Biome rules, error hygiene, and
   in-code TODO cleanup.

Loose ideas and open questions that are not concrete enough for this list live
in `TODO.md`.
