# Scriptr: Outstanding Work

What is left to do. The system as it stands is described in
[`ARCHITECTURE.md`](ARCHITECTURE.md); this file only tracks work, so finished
features are not repeated here.

Last reconciled: 2026-11-12. Tags: **[bug]**, **[decision]** (needs a call
before anyone builds it), **[deferred]** (recorded so it is not rediscovered,
not queued).

> **Standing rule:** any Postgres or Sanity schema change is followed by
> `corepack pnpm gen:api-types` / `corepack pnpm sanity:typegen` and a clean
> `corepack pnpm check-types` before it counts as done.

## Next

In roughly this order: the weekly note sync, the comment and doc cleanup, and
the remaining work below by area.

**Study hostnames are in use but attached by hand.** `lbe.scriptr.uk` serves
the `lbe` study from the same build and deployment as the catalog; how that works
is [`ARCHITECTURE-STUDY-DOMAINS.md`](ARCHITECTURE-STUDY-DOMAINS.md). Two things
are still open:

- **Attach a host per study is three manual steps** (`vercel domains add`, a
  proxied `CNAME` at Cloudflare, then the certificate). Automate attaching on
  handle assignment and detaching on delete, so a new study does not depend on
  someone remembering.
- **Each host's sitemap is submitted separately in Search Console.** One-time per
  host, and currently only `lbe` exists.

## Features

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
- **UI polish:** take z-index values from `Z_INDEX` rather than inline classes
  (the select list uses `z-90`), modal lifecycle (don't render closed dialogs),
  image sizing, a mobile layout pass, production CSS obfuscation, and more
  mobile-friendly toasts.
- **Palette file split:** `components/color-palettes.module.css` (270) is the
  last large stylesheet. Its palette definitions and shared derivation rules
  change together today, so split it by concern only if it grows past that —
  and if it does, keep `styles/main.css` importing the pieces in the same
  sequence.

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
  `flattenFirstRichTextBlock`, `formatMinutesSeconds`,
  `convertTimeToMinutesSeconds`
  ([`utilFunctions.ts`](../sanity/schemas/util-functions/utilFunctions.ts)),
  and `structureToolIconColors`
  ([`icon-helpers.tsx`](../sanity/structure-tool/icon-helpers.tsx)) — and
  verify the live hook in
  [`useSanityFetch.ts`](../sanity/sanity-hooks/useSanityFetch.ts) against the
  production fetch flow.
- **Localized content:** the `localizedString`, `localizedRichText`,
  `localizedRichTextLite` and `localizedStringArray` object types are registered.
  Header fields carry a `localizedTitle`/`localizedSubtitle` duplicate next to
  their legacy field ([`headerFields.ts`](../sanity/schemas/common/headerFields.ts)),
  and the academic entities carry `localizedName`, `localizedTitle`,
  `localizedDescription`, `localizedKeywords` and `localizedBio`
  ([`academicFields.tsx`](../sanity/schemas/common/academicFields.tsx)).
  Nothing reads the localized values yet — the frontend and the database sync
  still consume the legacy fields, and hand-written fields such as
  `subject.code` have no localized duplicate. Switch the queries, sync and
  components over, then delete the legacy fields and the duplication.
- **Shared field builders:** decide whether the string `bio` variant stays in
  [`academicFields.tsx`](../sanity/schemas/common/academicFields.tsx)
  (`AcademicBioOptions`). `academicGrouping` already takes the grouping keys as
  an argument, so the override path exists.
- **Link selector targets:** it only offers a custom path/URL today
  ([`link-selector.ts`](../sanity/schemas/common/link-selector.ts)). Add academic
  entities and database pages back as internal targets — the removed `page` and
  `section` document types are not coming back — then use it for the plain `url`
  website field in [`person.ts`](../sanity/schemas/misc/person.ts).
- **Validation:** add `min` for string fields in `buildLengthRules`
  ([`validation.ts`](../sanity/schemas/validation.ts)) once the validation revamp
  lands (a `min` rule currently breaks rich text validation).
- **Studio styles:** add the remaining variants and nest the styles in
  [`button-color-variants.css`](../sanity/styles/components/button-color-variants.css).
- **Structure tool:** sort people by academic field in
  [`misc-structure.ts`](../sanity/structure-tool/misc-structure.ts).

## Visual fidelity

The surfaces now carry their material detail — a sheen band, a 1px inner top
highlight, groove dividers and darker chrome on the nav/header/footer — as
described in
[`next/STYLING_GUIDE.md`](../next/STYLING_GUIDE.md#surface-detail). Outstanding:

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
- **Cache Components:** investigate the `use cache` directive and partial
  prerendering.
- **Font weights:** the declarations and the preload links are settled — the
  local families preload nothing, and the unused Bricolage family is gone, so a
  page fetches the five faces it renders instead of 22 files. What is left is
  trimming the *declared* weights: the fonts file declares 21 faces across
  `Matter` and `Antique Olive`, and no page uses more than three of each. That
  needs a sweep of the UI's computed font-weights once the design is final,
  because removing a declared weight changes any element that falls back to it.
- **Animated backdrop cost:** the star canvas repaints continuously in
  `requestAnimationFrame`, so whatever sits over it recomposites every frame.
  Backdrop blur has been removed site-wide, so surfaces are flat 97% fills and
  no longer pay that cost; `prefers-reduced-motion` draws one static frame and
  the canvas is capped at `devicePixelRatio` 2. What is left is pausing the
  canvas and compositing: `content-visibility: auto` on long card grids, and
  stopping the canvas while the page is scrolled far from it.

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

- **The notification tray filtering is one of two shapes.** Today a study site
  shows that study's notifications plus the platform-wide ones, and any other
  page shows everything, so nothing is ever unreachable. The alternative worth
  building later is grouped rather than filtered: show everything everywhere,
  in collapsible groups (platform-wide, then one per study), with the current
  site's group open. That keeps a study's rows visible off its site without
  letting them crowd the page; it needs the tray to become expandable, which the
  flat list it is now is not.
- **A study's pages are navigated two ways, not one.** The overview
  (`/study/[siteSlug]`) links forward to the scripts with a header action, and
  the feed links back with an "Overview" one; the calendar is only reachable from
  the header's calendar alert or a nav item. A study sub-nav in
  `app/(study)/study/[siteSlug]/layout.tsx` (Feed · Overview · Calendar) would
  make the three pages one surface and let the Sanity nav drop its study-specific
  `customLink` — worth doing once a study has a fourth page of its own.
- **Write scoping is enforced in the API, not in RLS.** Phase 5 gates script,
  comment, vote, subject-rating and favorite writes on membership in (or a role
  on) the target study, but the RLS policies behind them still accept any
  authenticated, unrestricted caller. Anything written straight to Supabase with
  a user's token — outside these routes — would bypass the rule. Add the same
  predicate to the insert policies (a `has_study_membership(uid, study)` helper
  next to `has_study_role`) before any second writer exists.
- **The "create an account" reminder now shows for every signed-out reader** —
  it used to depend on a guest having saved onboarding data. Decide whether it
  should key off "this browser has a study setup" instead of "nobody is signed
  in", now that setup is per study.
- **Calendar notes are not study-scoped:** the calendar is per study now, but a
  note (`calendar-notes`, keyed by profile and day) carries no study, so the same
  note shows on every study's calendar for that day. Decide whether a note
  belongs to the study whose calendar it was written on (a `study_id` on the
  row, and the same scope on the header alert's dismissal keys) or is genuinely
  personal and should stay shared. Deferred: nothing reads notes across studies
  today.
- **Professor comments and ratings are university-wide:** a professor belongs to
  one university and teaches across its studies, so the professor page stays a
  catalog page, but its comments and ratings are keyed by the professor's
  database id alone — every study in that university shares one thread and one
  rating average, and a comment on a professor carries no study, so only an
  owner can moderate it (study admins cannot). Decide whether professor threads
  should gain a study dimension (a reader's comment belongs to the study they
  wrote it in), a university dimension, or stay shared, and give the moderation
  path the same scope. Deferred: nothing depends on it yet.
- **Narrow moderator permissions:** a study `moderator` satisfies every
  `'moderator'` check today, so one can edit and delete other people's scripts
  and comments inside their study, exactly like a study admin. The intended
  model is smaller: moderators flag (hiding the item with a notice) and can
  impose a short restriction of a day or two, but never edit or delete someone
  else's content. `has_study_role(uid, study, need)` makes an admin satisfy a
  moderator check, so narrowing means moving the script/comment update/delete
  checks from `'moderator'` to `'admin'` in the policies and in the
  `requireStudyRole` callers, then giving hiding, flagging and restricting their
  own `'moderator'` path — and deciding whether the admin UI stays open to
  moderators. Deferred: nothing depends on the extra rights yet.
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
  metrics. The download review (`/admin/download-review`) is where that
  evidence is checked now; the thresholds may need raising once it has been
  used.

## Exploratory ideas

- **Christmas effects:** the `christmasCanvas` document is one of the backgrounds
  the website settings accept (the single `background` field references either it
  or a `starCanvas`), so switching it on is a Studio edit: create the document,
  point the background field at it. `AppBackground` reads `_type` and mounts the skybox
  plus `ChristmasCanvas` (`next/components/ui/app-background/ChristmasCanvas.tsx`,
  scenery in `next/lib/app-background/christmas-canvas.ts`) instead of the star
  canvas. Settings and light/dark scenery colors come from the document, with
  defaults and editable color roles in `shared/config/christmas-canvas.ts`. Still
  open: deciding when the seasonal background starts and ends (today it is on only
  while the document is referenced).
- **Computed rarity:** derive an achievement's rarity from the share of
  profiles that hold it instead of the admin-set tier. Only meaningful with a
  much larger user base.
