# Scriptr: Outstanding Work

What is left to do. The system as it stands is described in
[`ARCHITECTURE.md`](ARCHITECTURE.md); this file only tracks work, so finished
features are not repeated here.

Last reconciled: 2026-11-07. Tags: **[bug]**, **[decision]** (needs a call
before anyone builds it).

> **Standing rule:** any Postgres or Sanity schema change is followed by
> `corepack pnpm gen:api-types` / `corepack pnpm sanity:typegen` and a clean
> `corepack pnpm check-types` before it counts as done.

## Features

### Administration and moderation

- **Academic sync and dependency tools:** the Studio syncs one document at a
  time ([`academicEntitySync.tsx`](../sanity/actions/academicEntitySync.tsx) →
  `/api/sanity/*/sync`), and that action is what writes the junction rows —
  professors' faculties and studies, a subject's professors. What is missing is
  working at the graph rather than one document: syncing a batch, and seeing or
  repairing the dependencies around an entity (a subject's professors, a
  professor's studies, rows pointing at a document that no longer has a `dbId`).
- **Suspicious-download review:** counted downloads are recorded in
  `download_events` (append-only, service-role only, account → IP → device) and
  nothing surfaces them. Needs an admin view over a script's or an account's
  download pattern, which is also what the download-achievement thresholds in
  [Deferred](#deferred-do-last) are waiting on.

### Profile and academics

- **Atomic profile save:** the profile row is written before the
  faculty/study selections, so a later failure leaves the two out of sync —
  move the pair into one RPC.
- **Registration writes `currently_taking` rows** that nothing reads for
  display any more (profiles derive it from the selected studies, but
  `POST /auth/register` still seeds `profile_subjects` with both statuses).
  Either stop writing them or keep them in sync.
- **Study overview metadata:** add the remaining administrator/study metadata
  to [`StudyOverviewCard.tsx`](../next/components/academics/study/StudyOverviewCard.tsx)
  once it exists — today the card has only the assistant, website, student
  count, location and email.

### Content and presentation

- **Notes are per browser until synced:** calendar notes live in
  `localStorage` (namespaced per profile) and reach the database only through
  an explicit sync. A reader who never syncs loses them with the browser's site
  data, and the sync allowance is per warmed serverless instance, so it is
  abuse friction rather than an exact quota. Decide whether a periodic
  background sync is wanted once there is a per-user preference store.
- **Calendar alerts are dismissed per browser:** the header alert's dismissal
  map lives in `localStorage` (`scriptr:calendar-dismissed`), so it does not
  follow a reader to another device and clearing site data brings the preview
  back. That is deliberate — no DB table and no Hono route — but decide whether
  dismissals should sync once there is a per-user preference store.
- **Branding:** create the logo, apply it across the app, and use it as the
  favicon; update the README. Today the wordmark in
  [`NavLogo.tsx`](../next/components/navigation/NavLogo.tsx) is set text and
  `next/public/` holds only Next's default SVGs.
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
    visual. `aria-controls` is set on the header's open button (and the
    collapse trigger), but the toggle itself never reports whether the nav is
    open.
  - **Toast severity:** the stack is one polite live region, so a failed save
    and a successful one are announced with the same urgency. Deciding which
    toasts are assertive means deciding which failures interrupt.
- **UI polish:** take z-index values from `Z_INDEX` rather than inline classes
  (the select list uses `z-90`), modal lifecycle (don't render closed dialogs),
  image sizing, a mobile layout pass, production CSS obfuscation, and more
  mobile-friendly toasts.

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
  legible, then tuning the presets and the image ladder. The API deploy
  ([`hono/vercel.json`](../hono/vercel.json)) builds with `check-types` only, so
  also wire `corepack pnpm test` into it and make failing tests block deploys.
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
- **Sanity content freshness:** `fetchSanityData`
  ([`next/sanity/lib/utils.ts`](../next/sanity/lib/utils.ts)) reads through the
  client with `next: { revalidate: false }` and a single `sanity` tag, so a
  document read is cached until the next build. What is left: a Sanity
  **publish webhook** to `POST https://scriptr.uk/api/revalidate` with
  `{ "tags": ["sanity"] }`, which expires the tag without waiting for a deploy
  — nothing invalidates that tag today, so CMS edits appear on the next
  rebuild. That webhook now gates the calendar as well: `/calendar` and the
  header alert read the `calendar` document (and, through it, its events) once
  per build. The same read no longer decides drafts-vs-published from
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
- **Download achievement thresholds:** `total_script_downloads` is seeded now,
  but anonymous self-downloads cannot be detected and IP/device rotation can
  inflate the count, so its thresholds are softer evidence than the other
  metrics. The suspicious-download review above is the longer-term answer, and
  thresholds may need raising once it exists.

## Suggested order

1. The two remaining admin tools: suspicious-download review, then the academic
   sync and dependency tools.
2. Correctness and quality: the deferred accessibility list, the font-weight
   sweep, then the visual-fidelity pass (glass, grain, simple-mode contrast).
3. Optimizer tuning and the serving-cost review.
4. The privilege review.
5. Sanity cleanup and the open Studio decisions.
6. Tooling: the remaining Biome rules, error hygiene, secret rotation.
7. Deferred: visual editing, then the download achievement thresholds.

## Exploratory ideas

- **Christmas effects:** a seasonal background and effects.
- **Computed rarity:** derive an achievement's rarity from the share of
  profiles that hold it instead of the admin-set tier. Only meaningful with a
  much larger user base.
