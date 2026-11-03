# Scriptr: Outstanding Work

What is left to do. The system as it stands is described in
[`ARCHITECTURE.md`](ARCHITECTURE.md); this file only tracks work, so finished
features are not repeated here.

Last reconciled: 2026-11-02. Tags: **[bug]**, **[decision]** (needs a call
before anyone builds it).

> **Standing rule:** any Postgres or Sanity schema change is followed by
> `corepack pnpm gen:api-types` / `corepack pnpm sanity:typegen` and a clean
> `corepack pnpm check-types` before it counts as done.

## Features

### Administration and moderation

- **Remaining admin tools:** academic sync and dependency tools,
  `professor_studies`, suspicious-download review.

### Profile and academics

- **Achievement badge overflow:** once the profile badge strip ships it shows
  every earned achievement and wraps. When enough definitions exist to crowd
  the avatar, cap the visible badges and add a "+N" / full-list control.
- **Atomic profile save:** the profile row is written before the
  faculty/study selections, so a later failure leaves the two out of sync —
  move the pair into one RPC.
- **Registration writes `currently_taking` rows** that nothing reads for
  display any more (profiles derive it from the selected studies). Either stop
  writing them or keep them in sync.
- **Study overview metadata:** add the remaining administrator/study metadata
  to [`StudyOverviewCard.tsx`](../next/components/academics/study/StudyOverviewCard.tsx)
  once it exists.

### Content and presentation

- **Script browsing [decision]:** there is no script index page; "all scripts"
  is `/?scripts=all` (homepage feed switch) and `/search`. Decide whether a
  dedicated browse route is wanted or whether those two cover it.
- **Branding:** create the logo, apply it across the app, and use it as the
  favicon; update the README.
- **Localization:** localize project strings plus script titles and
  descriptions. Comments stay as they are. Until it lands, titles are
  Macedonian, which is why a script's URL transliterates its title
  (`docs/ARCHITECTURE-SCRIPTS-UPLOADS.md`).

## Correctness and quality

- **Scrollbar layout shift (Chromium) [bug, deferred]:** locking body scroll
  removes the classic scrollbar, and the page jumps by its width when it
  returns. `scrollbar-gutter: stable` on `html` and a measured
  `padding-right` compensation in [`useBodyScroll.ts`](../next/hooks/useBodyScroll.ts)
  were both tried and rejected (empty strip, and still shifted). Next: a custom
  `::-webkit-scrollbar` with a reserved width, or a ref-counted lock.
- **Accessibility audit [deferred]:** the type-level name rule and the a11y
  lint rules cover what a compiler and a parser can see; these need a design
  pass each, so they are listed rather than done.
  - **Icon-only content is still invisible to both.** `<Button><CloseIcon /></Button>`
    has children, so it satisfies `AccessibleNameProps`, and lint sees an
    element with content. One such button shipped unnamed (`LogoutButton`, since
    fixed); the honest limit is that a scan for `<Button>`/`<NextLink>` whose
    only child is an element has to be a review pass, not a rule.
  - **Field errors are announced but not associated.** `FieldContent` renders
    the label as a `<label>` with no `htmlFor` and the error as a
    `role='alert'` paragraph with no id, so the message is read but cannot be
    linked to its control, and clicking the label does not focus the field.
    Fixing it means generating ids in `Field` and threading `aria-describedby`
    into every consumer — an API change, not a patch.
  - **No skip link** past the navbar to `main`.
  - **The nav toggle has no `aria-expanded`**, so the off-canvas state is only
    visual; one call site sets `aria-controls`, the others do not.
  - **Toast severity:** the stack is one polite live region, so a failed save
    and a successful one are announced with the same urgency. Deciding which
    toasts are assertive means deciding which failures interrupt.
- **UI polish:** take z-index values from `Z_INDEX` rather than inline classes
  (the select list uses `z-90`), modal lifecycle (don't render closed dialogs,
  confirm modal), image sizing, a mobile layout pass, production CSS
  obfuscation, and more mobile-friendly toasts.
- **`danger` buttons lose their label in dark mode [bug]:** the variant sets
  `--button-fg: var(--color-background)`, and that token is near-black in the
  dark theme, so a destructive button draws dark ink on
  `--color-error-red`. In the editor toolbar the clear-formatting button reads
  as a plain red square with no glyph at all. Derive the ink from the fill the
  way `success` and `warning` already do, rather than from the background
  token — that changes how every delete action looks, so it needs its own pass.

## Sanity Studio

- **Unsynced professors have no page, but subject pages link them:** a professor
  page exists only for a synced document —
  [`professorStaticParamsQuery`](../next/sanity/queries/academics/professor.queries.ts)
  filters `dbId != null` and the route sets `dynamicParams = false` — while the
  subject pages link every professor they reference, falling back to the `_id`
  when the document has no slug. In the production dataset that gap is the norm:
  50 professor documents, 6 synced, and the 44 unsynced ones also have no
  `slug.current` (it only became required in `24f7ded`, so the existing
  documents predate the rule). A link to any of those answers `404` at
  `/professor/<id>`. Syncing is in progress, so finish it — the Studio's "Sync
  with Database" action is what mints the `dbId` publish is already blocked on
  — and fill in the slugs as each one is edited. Then decide whether a
  professor without a `dbId` should render as a link at all, so an unsynced
  document cannot produce a dead end. Not observable on production yet: the
  deployed build predates the professor route, and its 404 is Next's default
  rather than the app's `not-found.tsx`, so check this after the branch deploys.
- **Studio cleanup:** remove unused schemas, utilities and constants, including
  the commented-out legacy hook in
  [`useSanityFetch.ts`](../sanity/sanity-hooks/useSanityFetch.ts) (verify the live
  hook against the production fetch flow) and the commented-out `renderChild`
  in [`portable-highlights.tsx`](../sanity/schemas/portable-text/plugins/portable-highlights.tsx).
- **Shared field builders:** allow overrides in
  [`academicGrouping`](../sanity/schemas/common/academicFields.tsx), and decide
  whether the string `bio` variant stays.
- **Link selector:** list pages and academic entities dynamically in
  [`link-selector.ts`](../sanity/schemas/common/link-selector.ts) (or hardcode the
  main pages), then use it for the plain `url` website field in
  [`person.ts`](../sanity/schemas/misc/person.ts).
- **Validation:** add `min` for string fields in `buildLengthRules`
  ([`validation.ts`](../sanity/schemas/validation.ts)) once the validation revamp
  lands (a `min` rule currently breaks rich text validation).
- **Studio styles:** add the remaining variants and nest the styles in
  [`button-color-variants.css`](../sanity/styles/components/button-color-variants.css).
- **Structure tool [decision]:** decide how page data is represented, and sort
  people by academic field in
  [`misc-structure.ts`](../sanity/structure-tool/misc-structure.ts).

## Visual fidelity

The frosted surfaces now carry their material detail — a sheen band, a 1px inner
top highlight, groove dividers and darker chrome on the nav/header/footer — as
described in
[`next/STYLING_GUIDE.md`](../next/STYLING_GUIDE.md#glass-detail). Outstanding:

- **Contrast audit coverage:** the simple-mode pass sampled five pages and fixed
  muted captions through `--color-fg-muted` and `--shadow-strength` on
  `:root[data-simple]`. Re-run it over the account, admin and dialog surfaces,
  which were not sampled.
- **Font weights:** deferred until the design is final — see the entry under
  [SEO and performance](#seo-and-performance).

## SEO and performance

- **Robots [decision]:** `https://scriptr.uk/robots.txt` answers `200` with a
  content-signals preamble and nothing else — no `User-agent`, `Disallow` or
  `Sitemap:` line. It is not ours: the repo has never contained a `robots.txt`
  or `robots.ts`, and the response carries `x-vercel-cache`/`x-vercel-id`, so
  Vercel serves it. Adding `next/app/robots.ts` would therefore either be
  shadowed or conflict, so decide at the platform level: submit `/sitemap.xml`
  in Search Console and Bing first, then only build a route if a crawler
  directive is genuinely needed (that would mean turning the platform's
  injection off first).
- **Sitemap freshness:** `/sitemap.xml` is prerendered and revalidated on Next's
  default 60-second window. A route-segment `revalidate` export is ignored on a
  metadata route in this version (verified against the build manifest), so the
  freshness knob is the platform, not the file — relevant if the script count
  ever makes a full rewrite per regeneration expensive.
- **Cache Components:** investigate the `use cache` directive and partial
  prerendering.
- **Font weights:** the declarations and the preload links are settled — the
  local families preload nothing, and the unused Bricolage family is gone, so a
  page fetches the five faces it renders instead of 22 files. What is left is
  trimming the *declared* weights: `Matter` declares twelve files and
  `Antique Olive` eight, and no page uses more than three of each. That needs a
  sweep of the UI's computed font-weights once the design is final, because
  removing a declared weight changes any element that falls back to it.
- **Backdrop blur cost:** the frosted surfaces are the most expensive thing the
  page paints. Cost scales with radius × area × number of stacked surfaces, and
  all of it recomputes every frame because the star canvas behind animates
  continuously in `requestAnimationFrame`. Handled: `ui-above` dropped from
  `24px` to `16px` (`lg`) from `md` up and `ui-above-light` from `40px` to
  `24px`, so every panel is 33-40% cheaper per frame while the screenshot
  comparison stayed equivalent (10.6% / 12% of pixels moved by more than 5/255,
  4.2% / 2% by more than 20/255 — the halo edge, not the surface); simple mode
  sets `backdrop-filter: none`; `prefers-reduced-motion` draws one static frame;
  the canvas is capped at `devicePixelRatio` 2. What is left: `content-visibility:
  auto` on long card grids (off-screen panels would stop compositing) and pausing
  the canvas while the page is scrolled far from it.

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

- **Sanity content freshness:** `fetchSanityData`
  ([`next/sanity/lib/utils.ts`](../next/sanity/lib/utils.ts)) now reads through
  the client with `next: { revalidate: 60 }` and a single `sanity` tag. It used
  `sanityFetch`, which caches with `revalidate: false` and expects
  `<SanityLive />` to expire entries from the sync tags its queries return —
  with that component unmounted, every entry stayed frozen for a year and a
  rebuild on Vercel read the same entry out of the persisted Data Cache, so a
  Studio edit only appeared on some later deploy. What is left: a Sanity
  **publish webhook** to `POST https://scriptr.uk/api/revalidate` with
  `{ "tags": ["sanity"] }`, which makes a publish land immediately instead of
  within a minute. The same read no longer decides drafts-vs-published from
  `NEXT_PUBLIC_ENVIRONMENT_TYPE` alone: a Vercel production deployment is
  production even when that variable is missing, and `useCdn` is a property of
  the read (origin for drafts, CDN for published) rather than of the build.
  Restoring visual editing should bring `<SanityLive />` back at the same time,
  since `sanityFetch` is only correct together with it.

## Deferred (Do Last)

- **Visual editing and draft preview:** switched off for now.
  [`next/app/layout.tsx`](../next/app/layout.tsx) no longer renders
  `SanityLive`, `VisualEditing` or `DisableDraft`, and the Studio's iframe
  "Preview" view is gone (`iframeBuilder`/`getDocumentSlug` targeted
  `/api/draft?secret=…`, which was never implemented); `defaultDocumentNode`
  now shows the form plus references only. The components and
  `next/sanity/lib/live.ts` stay in place (unused until this returns — see the
  cache note above), and `sanity-plugin-iframe-pane` is still installed.
  Restoring it needs `/api/draft-mode/enable` (`defineEnableDraftMode` from
  `next-sanity` validates the studio's preview-URL secret, so no extra env var),
  `/api/disable-draft` for the exit link, and the layout block back behind
  `isStaging` — `getDraftMode` returns false in production builds, so the
  flow only ever worked on staging and locally. The Presentation tool's
  `previewUrl.origin` is untouched.
- **Profiles management [decision]:** an admin page at `/admin/profiles` over
  the admin-only `GET /api/profiles`, paginated, exposing read, update and
  delete on any user profile. The API is closer than it looks:
  `PATCH /api/profiles/:id` and `DELETE /api/profiles/:id` are already
  admin-gated, and the admin PATCH syncs someone else's faculty/study
  selections through the internal client (those tables' RLS has no admin
  override). What is missing is the listing — it is unpaginated and returns
  only `id, username, full_name, role, avatar_url, created_at` plus `subjects`
  and `achievements`, so paginate it (`limit`/`offset`, the shape the comment
  routes validate) and widen the select for a management table (`updated_at`,
  the faculty and study selections, script counts). Settle two things before
  building: role changes have no session-scoped route — only
  `PATCH /api/internal/profiles/:id/role`, which needs `x-internal-secret`
  the web app must not hold — so either add an admin-gated
  `PATCH /api/profiles/:id/role` or keep roles out of the tool; and
  `DELETE /api/profiles/:id` removes the `profiles` row and its avatar only,
  leaving the Supabase Auth user able to sign in with no profile, so decide
  whether the tool also deletes the login through Supabase's admin API. Build
  the page the way `/admin/restrictions` is built (a thin Server Component
  plus a `next/lib/admin-*-page.ts` loader) and register it in
  `ADMIN_SECTIONS`.
- **Download achievement thresholds:** `total_script_downloads` is seeded now,
  but anonymous self-downloads cannot be detected and IP/device rotation can
  inflate the count, so its thresholds are softer evidence than the other
  metrics. The suspicious-download review under Administration is the
  longer-term answer, and thresholds may need raising once it exists.

## Suggested order

1. Remaining admin and academic-sync tools.
2. Correctness and quality: the deferred accessibility list, the font-weight
   sweep, then the visual-fidelity pass (glass, grain, simple-mode contrast).
3. Optimizer tuning and the serving-cost review.
4. The privilege review.
5. Sanity cleanup and the open Studio decisions.
6. Tooling: Biome rules, error hygiene, internal secrets.
7. Deferred: the download achievement thresholds above.

## Exploratory ideas

- **Christmas effects:** a seasonal background and effects.
- **Computed rarity:** derive an achievement's rarity from the share of
  profiles that hold it instead of the admin-set tier. Only meaningful with a
  much larger user base.
