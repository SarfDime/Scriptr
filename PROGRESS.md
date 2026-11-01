# Scriptr: Outstanding Work

What is left to do. The system as it stands is described in
[`ARCHITECTURE.md`](ARCHITECTURE.md); this file only tracks work, so finished
features are not repeated here.

Last reconciled: 2026-11-01. Tags: **[bug]**, **[decision]** (needs a call
before anyone builds it).

> **Standing rule:** any Postgres or Sanity schema change is followed by
> `corepack pnpm gen:api-types` / `corepack pnpm sanity:typegen` and a clean
> `corepack pnpm check-types` before it counts as done.

## Features

### Administration and moderation

- **Admin UI:** academic sync and dependency tools, `professor_studies`, user
  restrictions, flag resolution/moderation, suspicious-download review.
- **Notification settings:** preferences and the remaining user-facing
  notification kinds/UX. Moderator notifications stay deferred.

### Profile and academics

- **Achievements:** show them on profiles (definition CRUD is deferred).
- **Atomic profile save:** the profile row is written before the
  faculty/study selections, so a later failure leaves the two out of sync —
  move the pair into one RPC.
- **Registration writes `currently_taking` rows** that nothing reads for
  display any more (profiles derive it from the selected studies). Either stop
  writing them or keep them in sync.
- **Study overview metadata:** add the remaining administrator/study metadata
  to [`StudyOverviewCard.tsx`](next/components/academics/study/StudyOverviewCard.tsx)
  once it exists.

### Content and presentation

- **Script browsing [decision]:** there is no script index page; "all scripts"
  is `/?scripts=all` (homepage feed switch) and `/search`. Decide whether a
  dedicated browse route is wanted or whether those two cover it.
- **Branding:** create the logo, apply it across the app, and use it as the
  favicon; update the README.
- **Localization:** localize project strings plus script titles and
  descriptions. Comments stay as they are.

## Correctness and quality

- **Draft-mode exit [bug]:** [`next/app/layout.tsx`](next/app/layout.tsx)
  renders `VisualEditing` and `DisableDraft`, but there is no
  `/api/disable-draft` endpoint for the button to call.
- **Scrollbar layout shift (Chromium) [bug, deferred]:** locking body scroll
  removes the classic scrollbar, and the page jumps by its width when it
  returns. `scrollbar-gutter: stable` on `html` and a measured
  `padding-right` compensation in [`useBodyScroll.ts`](next/hooks/useBodyScroll.ts)
  were both tried and rejected (empty strip, and still shifted). Next: a custom
  `::-webkit-scrollbar` with a reserved width, or a ref-counted lock.
- **State coverage:** loading, empty and error states on the remaining pages.
  `/search` renders "no results" when the API fails, because
  `searchScripts` falls back to an empty list.
- **Error UX:** never surface implementation details; improve the error pages
  to use the available space (optional theme-matched illustration) and
  standardize operation failures as toasts, documenting the convention in
  `ARCHITECTURE.md`.
- **Inline strings:** move the remaining user-facing text into
  `shared/strings/<area>-strings.ts` / `UI_STRINGS`, one feature area per pass
  (JSX text, `aria-label`, `placeholder`, `title`, toast and error messages).
- **Portable Text toolbar:** fix list numbering and the weight icons, keep the
  dropdown inside the viewport
  ([`PTDropdown.tsx`](next/components/typography/portable-text/toolbar/PTDropdown.tsx)),
  and share the decorator-category logic with the Studio instead of keeping two
  copies ([`PTClearOtherDecorators.tsx`](next/components/typography/portable-text/toolbar/PTClearOtherDecorators.tsx)).
- **Root layout:** factor the font setup out of [`next/app/layout.tsx`](next/app/layout.tsx)
  and build `metadata` with `generateMetadata` from Sanity data.
- **Type cleanup:** derive `AcademicPathInput` in
  [`academic-routes.ts`](next/lib/academic-routes.ts) from Sanity types.
- **Button accessibility:** require an accessible name (type level) in
  [`Button.tsx`](next/components/common/Button.tsx), so icon-only buttons
  cannot ship without one.
- **UI polish:** take z-index values from `Z_INDEX` rather than inline classes
  (the select list uses `z-90`), modal lifecycle (don't render closed dialogs,
  confirm modal), image sizing, mobile and accessibility passes, production CSS
  obfuscation, and more mobile-friendly toasts.

## Sanity Studio

- **Studio cleanup:** remove unused schemas, utilities and constants, including
  the commented-out legacy hook in
  [`useSanityFetch.ts`](sanity/sanity-hooks/useSanityFetch.ts) (verify the live
  hook against the production fetch flow) and the commented-out `renderChild`
  in [`portable-highlights.tsx`](sanity/schemas/portable-text/plugins/portable-highlights.tsx).
- **Shared field builders:** allow overrides in
  [`academicGrouping`](sanity/schemas/common/academicFields.tsx), and decide
  whether the string `bio` variant stays.
- **Link selector:** list pages and academic entities dynamically in
  [`link-selector.ts`](sanity/schemas/common/link-selector.ts) (or hardcode the
  main pages), then use it for the plain `url` website field in
  [`person.ts`](sanity/schemas/misc/person.ts).
- **Validation:** add `min` for string fields in `buildLengthRules`
  ([`validation.ts`](sanity/schemas/validation.ts)) once the validation revamp
  lands (a `min` rule currently breaks rich text validation).
- **Studio styles:** add the remaining variants and nest the styles in
  [`button-color-variants.css`](sanity/styles/components/button-color-variants.css).
- **Structure tool [decision]:** decide how page data is represented, and sort
  people by academic field in
  [`misc-structure.ts`](sanity/structure-tool/misc-structure.ts).

## SEO and performance

- **Sitemap:** add one.
- **Robots [decision]:** add a `robots` route only if needed — Cloudflare may
  already serve one; check first.
- **Cache Components:** investigate the `use cache` directive and partial
  prerendering.
- **Image loading:** eager-load the largest images.
- **Fonts:** preload where it helps, and drop the unused weights once the UI is
  final.

## Infrastructure and deployment

- **Cloudflare in front of the web host:** `scriptr.uk` is proxied, and the
  proxy drops the API's server-to-server revalidation POST, which is why
  `NEXT_REVALIDATE_URL` points at the web project's Vercel alias
  (`VERCEL_DEPLOYMENT.md`). Keep new Cloudflare rules (bot protection, WAF)
  from blocking that host pair again, and treat Bot Fight Mode as the suspect
  if avatars or `files.scriptr.uk` requests start failing while the object is
  fine.
- **Optimizer tuning:** the service is deployed; what is left is running real
  scans, text-heavy PDFs and 20 MB phone photos through it to see how often the
  3.5 MB cap is hit and whether the `/ebook` and `/screen` presets keep text
  legible, then tuning the presets and the image ladder. Also consider running
  `corepack pnpm test` in the API build so failing tests block deploys.
- **Serving cost:** review the preview/download paths for avoidable egress and
  repeated signing.
- **Finish production auth verification:** confirm the Supabase Auth Site URL
  is `https://scriptr.uk` and that `https://scriptr.uk/auth/callback` is
  allowed, then verify a signed-in hard refresh, vote/favorite state and Studio
  sync.
- **Database privileges review:** `anon` holds table-wide
  `INSERT`/`UPDATE`/`DELETE`/`TRUNCATE` on the public tables checked so far
  (Supabase's default grant; RLS blocks the row-level writes and `TRUNCATE` is
  not reachable through PostgREST). Revoke what the API never uses, and include
  `authenticated`'s table-wide `UPDATE` on `script_files`, which has no policy
  and relies on RLS alone.

## Tooling and quality

- **Biome coverage:** enable the additional rules once their signal-to-noise
  ratio has been reviewed.
- **Error hygiene:** project-wide review that stack traces and database details
  never reach users.
- **Internal secrets [decision, project-wide]:** `INTERNAL_API_SECRET` (server)
  and `SANITY_STUDIO_INTERNAL_SECRET` (Studio) travel in request headers, and
  the same question applies to every service-to-service secret across `hono/`,
  `next/`, `sanity/` and `shared/`. Pick one mechanism — encryption, or
  per-environment salts that both sides verify — and apply it to config, docs
  and deploy workflows in every workspace.

## Deferred (Do Last)

- **Achievement definitions CRUD:** admin management for
  `achievement_definitions`; public reading and awarding already exist.
- **Moderator notifications:** escalate repeated flags to moderators and route
  moderator-generated flags to admins. The moderator role stays
  notification-only and never gets moderation tools.

## Suggested order

1. Admin/moderation UI, then notification settings.
2. Correctness and quality: draft-mode endpoint, state coverage, inline
   strings, accessibility, toolbar, error UX, SEO/performance.
3. Optimizer tuning and the serving-cost review.
4. The privilege review.
5. Sanity cleanup and the open Studio decisions.
6. Tooling: Biome rules, error hygiene, internal secrets.
7. Deferred: achievement-definition CRUD and moderator notifications.

## Exploratory ideas

- **Christmas effects:** a seasonal background and effects.
