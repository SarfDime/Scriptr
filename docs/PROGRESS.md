# Scriptr: Outstanding Work

What is left to do. The system as it stands is described in
[`ARCHITECTURE.md`](ARCHITECTURE.md); this file only tracks work, so finished
features are not repeated here.

Last reconciled: 2026-11-16. Tags: **[bug]**, **[decision]** (needs a call
before anyone builds it), **[deferred]** (recorded so it is not rediscovered,
not queued).

> **Standing rule:** any Postgres or Sanity schema change is followed by
> `corepack pnpm gen:api-types` / `corepack pnpm sanity:typegen` and a clean
> `corepack pnpm check-types` before it counts as done.

## Next

In roughly this order:

1. **Comment and docs cleanup** — see [Code and comments](#code-and-comments);
   the change-narration and signature restatements are done, the long prose
   blocks in `next/components/` and `optimizer/src/` are left.
2. Everything else below, by area.

## Study hostnames

`lbe.scriptr.uk` serves the `lbe` study from the same build and deployment as the
catalog; how that works is
[`ARCHITECTURE-STUDY-DOMAINS.md`](ARCHITECTURE-STUDY-DOMAINS.md). Outstanding:

- **Attaching a host per study is three manual steps** (`vercel domains add`, a
  proxied `CNAME` at Cloudflare, then the certificate). Automate attaching on
  handle assignment and detaching on delete, so a new study does not depend on
  someone remembering.
- **Each host's sitemap is submitted separately in Search Console.** One-time per
  host, and currently only `lbe` exists.
- **A Sanity nav item that points at a catalog path** renders on the study host
  rather than the catalog (the router's fetch cannot be redirected cross-origin,
  so the redirect skips `?_rsc=` requests). A `/study/<handle>` item is
  normalized to the study's address in `NavigationLinks`; a catalog one still
  needs an absolute address in the Studio to land on the apex.

## Features

### Content and presentation

- **The study feed's curated mode is switched off [temporary].**
  `CURATED_FEED_ENABLED` in the scripts page is `false`, so the feed always lists
  every script and the sidebar every subject. The switch, the per-subject read and
  the copy stay, so turning curation back on is that flag.
- **A 404's initial HTML is Next's error shell [deferred, upstream].** With
  `[locale]` as the root layout, `notFound()` answers the first response with
  `<html id="__next_error__">` and an empty body; the localized page arrives in
  the flight payload (verified in a browser, status 404). It is
  [`vercel/next.js#100596`](https://github.com/vercel/next.js/issues/100596), open
  and reproduced outside this repo, and not specific to `[locale]`.
  **Decided 2026-11-14: keep the localized 404 and re-test when that issue
  closes.** Four alternatives were measured and rejected: dropping the
  catch-all, the `global-not-found` hybrid, a root layout above `[locale]`, and
  a proxy. `next/app/[locale]/[...notFound]/page.tsx` is the shim to delete
  once the fix lands.
- **React's dev-only performance track throws on an aborted server component
  [deferred, upstream].** Firefox reports `Performance.measure: Given attribute
  end cannot be negative` (Chromium words it "cannot have a negative time
  stamp"); it is thrown inside React's Server Component performance track, not
  in our code. `childrenEndTime` starts at `-Infinity` and is only recorded once
  a component's children finish, and the branch that reports an errored or
  aborted component passes it to `performance.measure` unguarded — the normal
  render branch has the `0 <= childrenEndTime` check that this one lacks.
  Anything that ends a server subtree early reaches it: `notFound()`,
  `redirect()` and an auth-guarded route, which is why `/admin` reports it (its
  layout `notFound()`s a visitor who cannot enter). It is
  [`react/react#37561`](https://github.com/react/react/issues/37561) with the fix
  in [`react/react#37572`](https://github.com/react/react/pull/37572), and the
  Next.js side is [`vercel/next.js#86060`](https://github.com/vercel/next.js/issues/86060)
  — both open against React 19.3.1 / Next 16.4.2. Development only: the
  production client bundle contains none of the track, so nothing a reader sees
  is affected, and the page still renders. Re-test after the React release that
  carries #37572; there is no app-side fix that does not mean disabling React's
  performance tracks.

## Correctness and quality

- **Scrollbar layout shift (Chromium) [bug, deferred]:** locking body scroll
  removes the classic scrollbar, and the page jumps by its width when it
  returns. `scrollbar-gutter: stable` on `html` and a measured
  `padding-right` compensation in [`useBodyScroll.ts`](../next/hooks/useBodyScroll.ts)
  were both tried and rejected (empty strip, and still shifted); the only
  scrollbar CSS today is the `scrollbar-hidden` utility. The lock is
  ref-counted now (`useBodyScrollLock`), which fixed nested dialogs but not the
  shift. Next: a custom `::-webkit-scrollbar` with a reserved width.
- **Accessibility, one item at a time [low priority]:** the type-level
  name rule and the a11y lint rules cover what a compiler and a parser can see.
  These need a design pass each, so they are listed instead of done — split so
  each ships on its own:
  - **No skip link** past the navbar to `main`.
- **UI polish:** take z-index values from `Z_INDEX` rather than inline classes
  (the select list uses `z-90`), image sizing, a mobile layout pass, production
  CSS obfuscation, and more mobile-friendly toasts.

## Performance

- **`content-visibility` on a very long feed is unverified.** The
  `content-auto` utility (now
  `contain-intrinsic-size: auto var(--content-auto-size, 500px)`, in
  [`utilities.module.css`](../next/styles/base/utilities.module.css)) sits on the
  script cards, the catalog cards, the root comment threads, the notification
  rows, the admin user rows and the calendar day cards, each tuned to its own
  measured height. The dataset holds one script per subject, so the two things a
  long list can still break — scroll restoration landing where the reader left
  off, and find-in-page revealing a card that was never rendered — have not been
  exercised. Check both on a feed with several screens of scripts.
- **The canvas frame is cheap again, but only measured on one reader's
  Firefox.** The scratch layer is gone: glows and chimney smoke are drawn
  straight onto the effects canvas and the occluders are cut out of it there, the
  houses' animated glows were dropped (their windows keep a faint halo painted
  with the scenery, so it costs nothing per frame), and the remaining per-spot
  work is a mask built once per layout. A reporter's Firefox at 2016×1059, DPR 0.95 now
  shows ~50–60 fps with `draw` at 1.3–2.3 ms (`?canvasStats=1`), down from a
  frame that dropped badly. What is left: the two full-canvas `clearRect`s (the
  effects layer and the front layer with Santa and the near snow) are the largest
  single item when the rasterizer is software (~6 ms of the ~13 ms draw in
  headless Firefox at DPR 2), so a dirty-region clear is the next lever if a
  software-composited browser ever struggles again.
- **Cache Components, what is left.**
  - A slug that matches nothing answers `200` with the localized 404 and `noindex` on
    the study sub-pages (`…/scripts`, `…/calendar`, `…/academic-setup`),
    `/user/[username]` and `…/scripts/[scriptSlug]`. The catalog's entity pages
    (`/university/[universitySlug]`, the faculty, professor, study and subject pages)
    keep the real `404`: they await `params` and export `instant = false` instead of
    splitting. A real status for the rest needs a fast existence check in `proxy.ts`;
    not worth a request per page until a crawler complains.
  - `LanguageToggle` cannot build the other language's address in the shell of a
    route whose URL is unknown, so those routes show its placeholder until the
    address resolves. A same-page switch that needs no address (client-only
    `router.push`) would close that hole.
  - `next dev` reports a `Date.now()` insight for
    `/study/[siteSlug]/scripts/[scriptSlug]` during its metadata pass; the build
    is clean. Trace it before adding a suppression — nothing in the route reads
    the clock.
  - The admin gate resolves `params`/`cookies` above its boundary, so an admin
    shell is per request rather than generic. Correct for a gated surface;
    revisit only if the first paint of `/admin` feels slow.
- **Font weights:** the declarations and the preload links are settled — the
  local families preload nothing, and the unused Bricolage family is gone, so a
  page fetches the five faces it renders instead of 22 files. What is left is
  trimming the _declared_ weights: the fonts file declares 21 faces across
  `Matter` and `Antique Olive`, and no page uses more than three of each. That
  needs a sweep of the UI's computed font-weights once the design is final,
  because removing a declared weight changes any element that falls back to it.

## SEO

- **Robots:** `next/app/robots.ts` owns `/robots.txt` — AI and scraper agents are
  disallowed site-wide, `/calendar` and `/admin` are disallowed for everyone (both
  language shapes). Admin also answers `noindex, nofollow` (layout metadata and
  `X-Robots-Tag`) and is absent from every sitemap. `Sitemap:` names `/sitemap.xml`.
  Verify after the first deploy that our file wins over Vercel's injected
  content-signals preamble; if it is shadowed, turn the platform's injection off.

## Code and comments

- **Comment and docs cleanup:** done for the three shapes the earlier pass named
  — comments that narrated a fixed bug or the refactor that produced the current
  code now state the invariant instead (the cache-version notes, the toast and
  provider histories, the canvas notes on the removed scratch layer, the
  `get-file` route's security note), docs that only repeated a signature or a
  type name are gone (the `hono/src/routes/` handlers, `env.types.ts`,
  `next/types/academics/`, `Text`/`Title`/`Divider`/`Field`/`NormalBlock`), and
  the restatements of a type's own name went with them. What is left is a
  reading pass over the long multi-line blocks in `next/components/` and
  `optimizer/src/`: they mostly explain why, so trimming one is a judgment call
  rather than a rule, and no mechanical scan finds them. The workspace guides
  (the workspace `AGENTS.md` files, `next/STYLING_GUIDE.md`) remain the place for
  conventions the code should not repeat.

## Sanity Studio

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

The surfaces carry their material detail — a sheen band, a 1px inner top
highlight, snow caps, ice ridges on horizontal and vertical dividers (and on
the card/dialog/navbar edges) and darker chrome on the nav/header/footer — as
described in
[`next/STYLING_GUIDE.md`](../next/STYLING_GUIDE.md#surface-detail). Outstanding:

- **Contrast audit coverage:** the simple-mode pass sampled five pages and fixed
  muted captions through `--color-fg-muted` and `--shadow-strength` on
  `:root[data-simple]`. Re-run it over the account, admin and dialog surfaces,
  which were not sampled.

## Infrastructure and deployment

- **Serving cost:** a preview or a download goes through
  `/file-ops/get-file`, which reads the `script_files` row and presigns an R2 URL
  per request (buckets are derived from the row, deliberately). Review those
  paths for avoidable egress and repeated signing before the traffic grows.

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
  `app/[locale]/(study)/study/[siteSlug]/layout.tsx` (Feed · Overview · Calendar) would
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
- **The `currently_taking` status is accepted but never written [decision]:**
  the only writers of `profile_subjects` store `completed` (the setup sync and
  the academics editor), and nothing reads a stored `currently_taking` row for
  display — the "taking" view derives from the enrolled study
  (`deriveIncompleteSubjectDbIds`). Decide whether the status is worth keeping
  (then keep the value, its copy and the view toggle in sync) or the derived
  view is enough (then drop the status from the route, the type and
  `isProfileSubjectStatus`). Note that registration no longer writes these rows
  at all: that seeding went with the per-study profile.
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
  [`next/app/[locale]/layout.tsx`](../next/app/[locale]/layout.tsx) no longer renders
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

- **When the Christmas scenery is on:** the `christmasCanvas` document is one of
  the backgrounds the website settings accept, so switching it on is a Studio
  edit — create the document, point the background field at it — and
  `AppBackground` then mounts the skybox plus
  [`ChristmasCanvas`](../next/components/ui/app-background/ChristmasCanvas.tsx)
  (scenery in [`christmas-canvas.ts`](../next/lib/app-background/christmas-canvas.ts)).
  Settings and light/dark scenery colors come from the document, with defaults
  and editable color roles in `shared/config/christmas-canvas.ts`; the sky's day,
  sun and moon size, stars, clouds, full-screen behaviour and per-theme colors
  come from the `skybox` document the same settings point at. Still open:
  deciding when the seasonal background starts and ends — today it is on only
  while the document is referenced, so it takes a manual Studio edit in both
  directions.
- **Computed rarity:** derive an achievement's rarity from the share of
  profiles that hold it instead of the admin-set tier. Only meaningful with a
  much larger user base.
