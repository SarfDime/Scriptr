# Scriptr: Outstanding Work

What is left to do. The system as it stands is described in
[`ARCHITECTURE.md`](ARCHITECTURE.md); this file only tracks work, so finished
features are not repeated here.

Last reconciled: 2026-11-07. Tags: **[bug]**, **[decision]** (needs a call
before anyone builds it), **[deferred]** (recorded so it is not rediscovered,
not queued).

> **Standing rule:** any Postgres or Sanity schema change is followed by
> `corepack pnpm gen:api-types` / `corepack pnpm sanity:typegen` and a clean
> `corepack pnpm check-types` before it counts as done.

## Next

1. **Gate deploys on the API tests.** [`hono/vercel.json`](../hono/vercel.json)
   builds with `corepack pnpm --filter @scriptr/api check-types` only, so a
   failing test never blocks a deploy. Add
   `corepack pnpm --filter @scriptr/api test` to that `buildCommand`.
2. **Suspicious-download review.** The last admin page that needs building, and
   what the download-achievement thresholds in [Deferred](#deferred) are
   waiting on.

Then, in roughly this order: the accessibility items (each independent), the
weekly note sync, the comment and doc cleanup, and the remaining work below by
area.

## Features

### Administration and moderation

- **Suspicious-download review:** counted downloads are recorded in
  `download_events` (append-only, service-role only, account → IP → device) and
  nothing surfaces them. Needs an admin page over a script's or an account's
  download pattern — a list of the accounts and scripts worth looking at, with
  the events behind each, following the `/admin/restrictions` shape (thin Server
  Component, `admin-*-page` loader, gated by the page's `requireAdminUnlock`
  plus `requireAdminAccess` on the route).

### Profile and academics

- **Atomic profile save:** the profile row is written before the
  faculty/study selections, so a later failure leaves the two out of sync —
  move the pair into one RPC.
- **Study overview metadata:** add the remaining administrator/study metadata
  to [`StudyOverviewCard.tsx`](../next/components/academics/study/StudyOverviewCard.tsx)
  once it exists — today the card has only the assistant, website, student
  count, location and email.

### Content and presentation

- **Weekly note sync:** calendar notes live in `localStorage` (namespaced per
  profile) and reach the database only through the explicit sync in
  Preferences, so a reader who never syncs loses them with the browser's site
  data. They should also be pushed automatically, at most **once a week per
  profile** and **only when the local copy actually changed**
  (`notesChangedSince` already computes that, and the manual sync's
  "latest edit wins" merge is the rule to reuse). That needs a per-profile
  record of the last automatic sync — a real limit, unlike the explicit-sync
  allowance, which is per warmed serverless instance — and a strictly rate
  limited route on top of the existing 3-per-half-hour / 12-per-day allowance.
- **Localization:** localize project strings plus script titles and
  descriptions. Comments stay as they are. Until it lands, titles are
  Macedonian, which is why a script's URL transliterates its title
  (`docs/ARCHITECTURE-SCRIPTS-UPLOADS.md`).

## Correctness and quality

- **Scrollbar layout shift (Chromium) [bug, deferred]:** locking body scroll
  removes the classic scrollbar, and the page jumps by its width when it
  returns. `scrollbar-gutter: stable` on `html` and a measured
  `padding-right` compensation in [`useBodyScroll.ts`](../next/hooks/useBodyScroll.ts)
  were both tried and rejected (empty strip, and still shifted); the only
  scrollbar CSS today is the `scrollbar-hidden` utility. Next: a custom
  `::-webkit-scrollbar` with a reserved width, or a ref-counted lock.
- **Accessibility, one item at a time [low priority]:** the type-level
  name rule and the a11y lint rules cover what a compiler and a parser can see.
  These need a design pass each, so they are listed instead of done — split so
  each ships on its own:
  - **No skip link** past the navbar to `main`.
  - **Field errors are announced but not associated.** `FieldContent` renders
    the label as a `<label>` with no `htmlFor` and the error as a
    `role='alert'` paragraph with no id, so the message is read but cannot be
    linked to its control, and clicking the label does not focus the field.
    Fixing it means generating ids in `Field` and threading `aria-describedby`
    into every consumer — an API change, not a patch.
  - **The nav toggle has no `aria-expanded`**, so the off-canvas state is only
    visual. `aria-controls` is set on the header's open button (and the
    collapse trigger), but the toggle itself never reports whether the nav is
    open.
  - **Icon-only content is still invisible to both.** `<Button><CloseIcon /></Button>`
    has children, so it satisfies `AccessibleNameProps`, and lint sees an
    element with content. One such button shipped unnamed (`LogoutButton`, since
    fixed); the honest limit is that a scan for `<Button>`/`<NextLink>` whose
    only child is an element has to be a review pass, not a rule.
  - **Toast severity:** the stack is one polite live region, so a failed save
    and a successful one are announced with the same urgency. Deciding which
    toasts are assertive means deciding which failures interrupt.
- **UI polish:** take z-index values from `Z_INDEX` rather than inline classes
  (the select list uses `z-90`), modal lifecycle (don't render closed dialogs),
  image sizing, a mobile layout pass, production CSS obfuscation, and more
  mobile-friendly toasts.
- **Style-file split:** `components.module.css` is 662 lines holding unrelated
  concerns — layout (`ui-container`, `ui-stack`, `ui-cluster`, the grid
  utilities), typography (`ui-title` … `ui-caption`), surfaces (`ui-card`,
  `ui-badge`, `ui-sheen`, `ui-above*`) and the divider/groove helpers — and
  `base/colors.module.css` (292) and `components/color-palettes.module.css`
  (270) are next by size. Split them by concern **without changing the
  effective order**: equal-specificity utilities resolve by source order, and
  this project leans on that (`no-gradient` and the `ui-sheen-*` family must
  come after the `*-above*` utilities, `--ui-lit-edge` stays first in every
  `box-shadow` stack — see
  [`STYLING_GUIDE.md`](../next/STYLING_GUIDE.md#glass-detail)). Move blocks
  verbatim, make `styles/main.css`'s import sequence reproduce the old
  concatenation, and never alphabetise. Verify with before/after screenshots of
  the glass, dialog, nav/header and simple-mode surfaces plus `build:next`, and
  move the file list in the styling guide with it.

## Code and comments

- **Comment and docs cleanup:** much of the commentary explains the moment a
  change was made rather than the code that is left, and the worst offenders
  restate what the code already says — the type-declaration comments where the
  type name is the whole explanation, and function docs that only repeat the
  signature. Delete those, and the paragraphs that narrate a bug that is now
  fixed in one sentence elsewhere. Keep what a future reader cannot infer: the
  database grant and RLS model, cache tags and what invalidates them, and the
  security decisions behind a route. The workspace guides
  (`docs/AGENTS-*.md`, `next/STYLING_GUIDE.md`) are the place for conventions
  the code should not repeat.

## Sanity Studio

- **Studio cleanup:** remove the exports nothing imports — `AccessCodeRequiredError`
  and `clearAccessToken` ([`api-access.ts`](../sanity/lib/api-access.ts)),
  `filterExcludeSchemas` and `createExcludeSchemaFilter`
  ([`schemaFilters.ts`](../sanity/schemas/util-functions/schemaFilters.ts)),
  `flattenFirstRichTextBlock`, `formatMinutesSeconds`,
  `convertTimeToMinutesSeconds` and `sectionPreview`
  ([`utilFunctions.ts`](../sanity/schemas/util-functions/utilFunctions.ts)),
  and `structureToolIconColors`
  ([`icon-helpers.tsx`](../sanity/structure-tool/icon-helpers.tsx)) — and
  verify the live hook in
  [`useSanityFetch.ts`](../sanity/sanity-hooks/useSanityFetch.ts) against the
  production fetch flow. Every schema type is registered; the unused surface is
  helpers, not documents.
- **Shared field builders:** decide whether the string `bio` variant stays in
  [`academicFields.tsx`](../sanity/schemas/common/academicFields.tsx)
  (`AcademicBioOptions`). `academicGrouping` already takes the grouping keys as
  an argument, so the override path exists.
- **Link selector:** list pages and academic entities dynamically in
  [`link-selector.ts`](../sanity/schemas/common/link-selector.ts) (it maps page
  sections today), then use it for the plain `url` website field in
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
- **Sitemap freshness:** `/sitemap.xml` is prerendered at build time and has no
  revalidation window (confirmed in `next/.next/prerender-manifest.json`:
  `compute: "static"`, `initialRevalidateSeconds: false`), so it lists the
  scripts and Sanity entities that existed when the deployment was built; a new
  or deleted script reaches it only on the next rebuild. `app/sitemap.ts` pins
  `dynamic = 'force-static'` and `revalidate = false` so a later change cannot
  quietly turn it into a per-request route. That also means a full rewrite of
  the file per deploy, relevant if the script count ever makes the cost
  noticeable.
- **Cache Components:** investigate the `use cache` directive and partial
  prerendering.
- **Font weights:** the declarations and the preload links are settled — the
  local families preload nothing, and the unused Bricolage family is gone, so a
  page fetches the five faces it renders instead of 22 files. What is left is
  trimming the *declared* weights: the fonts file declares 21 faces across
  `Matter` and `Antique Olive`, and no page uses more than three of each. That
  needs a sweep of the UI's computed font-weights once the design is final,
  because removing a declared weight changes any element that falls back to it.
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

- **Optimizer tuning:** the service is deployed; what is left is running real
  scans, text-heavy PDFs and 20 MB phone photos through it to see how often the
  3.5 MB cap is hit and whether the `/ebook` and `/screen` presets keep text
  legible, then tuning the presets and the image ladder.
- **Serving cost:** review the preview/download paths for avoidable egress and
  repeated signing.

## Tooling and quality

- **Biome coverage:** the project-specific rules are on; review and enable the
  remaining recommended ones that were left off.
- **Error hygiene:** project-wide review that stack traces and database details
  never reach users.
- **Service-to-service secrets:** the Studio's shared secret is gone (a TOTP
  code is exchanged for a twenty-minute HMAC token) and both remaining
  service-to-service calls are signed rather than secret-bearing — the API
  signs `${timestamp}.${body}` for `/api/revalidate` and `/optimize`. What is
  left: `SITEMAP_SECRET` is still a header secret, scoped to one route and held
  only by the Next build; the two HMAC keys (`REVALIDATE_SECRET`,
  `OPTIMIZER_SECRET`) are long-lived and have no rotation; and the code-replay
  guard, the 5-attempts/15-min code throttle and the sitemap limiters live in
  memory per instance, so a second warm serverless instance has its own copy —
  abuse friction, not an exact quota, and it should move to a table if it ever
  needs to be exact.
- **Sanity publishing:** a rebuild is the propagation mechanism, by design.
  Every Sanity read is cached with `revalidate: false` and a single `sanity`
  tag, so a CMS edit — a calendar event included — reaches readers on the next
  rebuild. What is left is the trigger: a Studio plugin or document action that
  calls a Vercel deploy hook when something is published, so a rebuild does not
  wait for the next push. Expiring the tag from the publish webhook is
  deliberately not the plan; see [Deferred](#deferred).

## Deferred

- **Database privileges review:** `anon` holds table-wide
  `INSERT`/`UPDATE`/`DELETE`/`TRUNCATE` on the public tables checked so far
  (Supabase's default grant; RLS blocks the row-level writes and `TRUNCATE` is
  not reachable through PostgREST), and `authenticated` holds a table-wide
  `UPDATE` on `script_files` that no policy depends on. Revoke what the API
  never uses — carefully, route by route: a wrong revoke fails closed at
  runtime, which is how `PATCH /api/admin/profiles/:id/role` broke when the
  profile grants were narrowed.
- **Branding:** create the logo, apply it across the app, and use it
  as the favicon; update the README. Today the tab still carries Next's
  scaffold favicon and the wordmark in
  [`NavLogo.tsx`](../next/components/navigation/NavLogo.tsx) is set text.
- **`currently_taking` rows [decision]:** `POST /auth/register` still
  seeds `profile_subjects` with both statuses, and nothing reads the
  `currently_taking` ones for display (profiles derive it from the selected
  studies). Decide first whether those rows will ever be needed by something
  else, then either stop writing them or keep them in sync.
- **Academic sync and dependency tools:** the Studio syncs one
  document at a time ([`academicEntitySync.tsx`](../sanity/actions/academicEntitySync.tsx) →
  `/api/sanity/*/sync`), which is enough at the current scale. A batch sync and
  a dependency view (a subject's professors, a professor's studies, rows
  pointing at a document with no `dbId`) are not needed yet.
- **Per-query Sanity revalidation:** expiring cached Sanity reads
  without a rebuild would need a tag per query and a way to map a published
  document to the queries it affects — a large feature with no current need.
  `fetchSanityData` keeps one `sanity` tag as the eventual hook.
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
- **Download achievement thresholds:** `total_script_downloads` is seeded now,
  but anonymous self-downloads cannot be detected and IP/device rotation can
  inflate the count, so its thresholds are softer evidence than the other
  metrics. The suspicious-download review above is the longer-term answer, and
  thresholds may need raising once it exists.

## Exploratory ideas

- **Christmas effects:** a seasonal background and effects.
- **Computed rarity:** derive an achievement's rarity from the share of
  profiles that hold it instead of the admin-set tier. Only meaningful with a
  much larger user base.
