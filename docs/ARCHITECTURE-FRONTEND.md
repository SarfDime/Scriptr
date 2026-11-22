# Frontend Structure & UI Conventions

Rules for changing `next/` live in [`next/AGENTS.md`](../next/AGENTS.md); this file records
how the frontend is put together.

- **Thin pages.** `page.tsx` either awaits its params or hands the promise to the leaf that
  needs them, calls a loader and composes components. Fetching, cookies and 404 handling
  live in `next/lib/<feature>-page.ts`, returning view models typed in
  `next/types/components/` (`ScriptDetailViewModel`, `ProfilePageViewModel`). Pure helpers
  live in `next/lib/<feature>.ts`. Components never fetch.
- **Rendering is Prerendering.** Cache Components is on, so each route ships a static shell
  and streams its request-time parts. A page keeps its headings, chrome and Sanity content
  in the shell and resolves `params`, `searchParams`, the session and the clock in a leaf
  behind `<Suspense>`; the fallback is a sibling of the component that needs it
  (`ScriptsPageSkeleton` beside the feed, `ProfilePageSkeleton` beside the profile,
  `AdminPageSkeleton`, `CalendarScreenSkeleton`, `ScriptDetailPageSkeleton`). The study
  layout enumerates its `siteSlug` values, so the whole study tree is prerendered per study,
  and it hands the handle down as a promise: the calendar alert and the search scope resolve
  it in their own boundaries (`components/navigation/StudyChrome.tsx`), so the frame itself
  never waits for the URL. Only those two leaves are deferred — the bell and the profile
  link stay in the first hydration pass, because a deferred component that reads a client
  store hydrates against a store that has already loaded. The catalog detail routes enumerate their params the same way
  through `createAcademicStaticParams`, and because the page _is_ the URL's entity they
  await `params` and export `instant = false` rather than split: the entry is prerendered
  whole and an unknown slug keeps a real `404`.
- **A reader-supplied address answers a soft 404.** `[username]` and `[scriptSlug]` are not
  known at build time, so the shell is already sent when `notFound()` runs: the response is
  `200` carrying the localized 404 and its `noindex`. The study sub-pages
  (`…/scripts`, `…/calendar`, `…/academic-setup`) answer the same way for an unknown
  `siteSlug`. Only a param known at prerender — or an entity page that awaits `params`
  with `instant = false` — keeps the real status. `loadPublicProfilePage` still makes both
  decisions in one place (own username → `/user`; API `404` → `notFound()`), and any other
  failed read throws to the error boundary; only the stats read is contained.
- **The loading overlay** shows the last task's `message` and optional `hint` from
  `LoadingTaskDetails`, or the wordmark animation when there is neither.
- **The root is the catalog.** `/` lists universities, faculties and studies
  (`CatalogHomeContent`, `catalogHomeQuery`); each study links to its own site. No
  subjects, professors or scripts — they belong to a study. Cached until the publish
  webhook invalidates it. The catalog is the apex host only; a study is served from its own
  hostname by a `next.config.ts` rewrite onto `/study/[siteSlug]/…`
  ([`ARCHITECTURE-STUDY-DOMAINS.md`](ARCHITECTURE-STUDY-DOMAINS.md)).
  - A study's root `/study/[siteSlug]` is the **academic overview** (overview card,
    subjects, professors); its **content surface** is `…/scripts`, curated to the reader's
    unfinished subjects, with `?scripts=all` for the study's top scripts and a sidebar of
    unfinished subjects. The setup gate hangs off the feed.
  - The catalog page header offers create-account (`/auth?mode=register`) and set-up
    (`/start`); below it the three levels are columns of one surface (`CatalogSection`),
    two columns from `md`, three from `lg`, each a stack of `CatalogCard`s.
- **Script detail** (`/study/[siteSlug]/scripts/[scriptSlug]`): `ScriptDetailOverview`
  places the info group (`ScriptInfoPanel` + `ScriptAdditionalReading`, with an empty
  state) and `ScriptFilesSection` in a wrapping flex row. Files grow 100 against 1, so the
  first wrap is files dropping below; then the reading panel wraps. Files form an
  `auto-fit` grid; each `ScriptFileCard` is a container-query container, stacked narrow and
  thumbnail-beside-details from ~28rem. A lone file is capped to its content width unless
  previewable, when it spans the surface and previews inline. `ScriptFileCard` composes
  `ScriptFileThumbnail` and `ScriptFileActions` and owns the preview modal.
- **The calendar** (a study's `/study/[siteSlug]/calendar`,
  [`ARCHITECTURE-CALENDAR.md`](ARCHITECTURE-CALENDAR.md)) keeps its view in the URL
  (`?view=month|week&date=YYYY-MM-DD`): a Server Component with `Link` controls and no
  client state, resolved inside a boundary because the period and "today" are request-time.
  Its one client island is the header alert, which narrows the layout's prerendered events
  to the reader's unfinished subjects.
- **Subject lists share one filter pair.** `useSubjectFilters` + `SubjectFilters` own the
  year and electives state for the explorer, the scripts sidebar and the profile sidebar.
  One year at a time (no "all years"), opening on the first year the list has; electives
  included until toggled off. `useSubjectSort` adds sort to the explorer, the scripts
  sidebar and the profile sidebar; the explorer alone adds search. The scripts sidebar
  puts the electives toggle in its header and keeps sort in the filter row. Both sidebars
  and the professors list show four and reveal the rest through `ShowMoreList`.
- **The client shells read the pathname through one store.** `NavProvider` and
  `NotificationsProvider` wrap every page, so they cannot sit inside a Suspense boundary;
  `PathnameScope` (`providers/nav/pathname-scope.tsx`) is that boundary and publishes the
  pathname for `useCurrentPathname`. `LanguageToggle` needs the address itself, so it does
  use `usePathname` and has its own fallback (`LanguageToggleFallback`) on routes whose URL
  is not known at build time.
- **The navbar scrolls its middle.** A study has its links, its enrolled studies and
  its favorites between the logo and the account controls; on a laptop they do not all
  fit. The links, studies and favorites share the one scrollable region, so the logo and
  the account controls stay put.
- **Footer** is a static Server Component (wordmark and copyright, `UI_STRINGS.footer`) on
  `ui-above`, full width like the header, rendered by `MainLayout` with no request-time
  API. The Sanity `footer` document is unused. `MainLayout` is a flex column and
  `--footer-height` lets full-screen layouts account for it.
- **Copy and localization.** Collections live in `shared/strings/*` or `UI_STRINGS`; the
  `<AREA>_PACK` export is the source of truth and the historical export
  (`UI_STRINGS`, `CALENDAR_STRINGS`, …) is that collection resolved to `DEFAULT_LOCALE`
  through `getStrings`, which keeps the un-migrated imports (including `hono/`) working.
  Collections are registered in `shared/config/string-packs.ts`, which also derives
  `StringPackPath<P>` and the path aliases. Mechanics and traps: `next/AGENTS.md`.
- **The chrome is server, the clock is a leaf.** `MainLayout`, `Header`, `PageLayout` and
  `Footer` are Server Components; `HeaderDate` and `FooterCopyright` take the instant the
  page was prerendered with (`getPrerenderNow`) and replace it with the browser's once
  mounted, so the shell carries a date instead of a hole. A relative label ("3 days ago")
  reads its reference instant from `useRelativeNow` (`providers/clock/clock.tsx`), which
  renders the same one. `NavToggle`, `HeaderActions`, `NavLogo` stay client. A component
  rendered from a client parent (`Footer`, `PageHeader` under `PageLayout`) is itself a
  Client Component and reads copy with the hooks. `auth/callback/page.tsx` is a Server
  Component around `AuthCallbackCard`, which needs `window.location`.
- **The default language keeps its unprefixed address.** The tree is `app/[locale]` with
  `prefixDefault: false`: English at `/university/ukim`, Macedonian under `/mk/…`. A
  `beforeFiles` rewrite serves the unprefixed default out of `[locale]`; `/en/…`, the
  cookie-driven `/` and study-host roots are `next.config.ts` redirects — no proxy, no
  middleware, no request hop. Sitemaps carry one entry per page with
  `alternates.languages`, not one per language.
- **A stored notification's sentence is rebuilt at read time.** The API writes finished
  English into `notifications.title`/`body` at event time (no reader exists yet);
  `resolveStoredNotificationCopy` (`shared/utils/notification-copy.ts`) rebuilds it from
  `type` and `data`, so older rows follow the reader too. What it cannot rebuild keeps the
  stored text: an `announcement` and an achievement outside the catalogue, plus quoted
  reasons and content titles.
- **Failures.** A thrown render or data failure lands on a route boundary
  (`app/[locale]/error.tsx`, plus the calendar's own), showing generic copy and a retry —
  never `error.message`, which can carry database or stack details. Unknown routes render
  `not-found.tsx`; root and segment versions share `ErrorState` (a `<section>`, because
  `MainLayout` owns the `main` landmark), whose illustration is an inline SVG
  (`AstronautIllustration`) tinted through `--illustration-*` roles. `global-error.tsx`
  catches layout failures where no stylesheet is guaranteed, so it uses inline styles only.
- **A failed user action is a toast**, not a page: `useToast().addToast` keeps the reader in
  place. Only a render-time throw reaches an error boundary.
- **Only reader-written errors are quoted.** `toUserMessage(error, fallback)`
  (`next/lib/user-facing-error.ts`) keeps the wording of a `UserFacingError`; everything
  else gets the `UI_STRINGS` line. Every `ApiError` is in the second group, since its body
  is written for API callers. The request layer converts one status itself: a `429` becomes
  a `UserFacingError` because every rate-limit body tells the reader what to do. Sign-in is
  the other exception — `SessionProvider` shows a 4xx from `/auth/*` verbatim and generic
  copy for a 5xx.
- **"Failed" is not "empty".** A loader must not swallow a failed read into an empty list
  when the page would misreport it (a failed profile read must not render `404`; a search
  that never ran must not say "no results"). `apiFetchPublicRead` fallbacks exist only for
  reads a build must survive. The client session read makes the same split: `getSession`
  resolving to `null` means the request failed, so `SessionProvider` keeps the session it
  had; a `200` with `user: null` is what signs the reader out.
- **A control carries its own name.** `Button`/`NextLink` require `AccessibleNameProps`;
  wrappers take `ButtonBaseProps`/`NextLinkBaseProps` or supply a default (`CloseButton`),
  and wrap with `OmitProps`, since `Omit` over a union keeps only shared keys. A button
  whose only child is an element is still a review pass. Toasts announce through one polite
  live region.
- **The root layout owns only the shell.** Fonts are declared in `next/app/fonts/fonts.ts`
  and exported as class names; the layout fetches the nav menu and the background and
  skybox config and renders chrome, not the catalog — each study page reads its own study.
  Site metadata comes from `generateMetadata` over the same `website` document every page
  reads, with `metadataBase` from `toOrigin(website.siteUrl)` (falling back to the
  environment origin, then nothing).
- **Metadata and canonicals come from the route's real address.** `PageSEO` takes
  `pagePath` — built with `getAcademicPath`: site-relative in the catalog, absolute inside a
  study's site — and turns it into the canonical and Open Graph URL, so it must equal the
  served URL in the reader's language. The same path yields `alternates.languages`
  (`languageAlternates`), so the variants name each other; a page without `PageSEO`
  returns both itself. `/sitemap.xml` is an index over sections built in
  `next/lib/sitemap-entries.ts` and served by `app/sitemap/[section]/route.ts`; each study
  host publishes its own index and sections from `next/lib/study-sitemap.ts`, so neither
  host lists the other's pages. Script URLs come from `GET /api/sitemap/scripts` (secret-
  guarded, 10 reads a day) and carry only `slug` and `updated_at`; the sitemap is
  prerendered and never revalidated, so that is one read per deployment. A failed read
  drops its own section rather than publishing an empty one; with `NEXT_PUBLIC_SITE_URL`
  unset the file is empty, with a warning.
- **Surfaces and dialogs.** Content sits on a translucent outer surface (`ui-above`) with
  `ui-above-inside` where text is shown; dialogs follow the same pattern and are styled by
  `next/STYLING_GUIDE.md`. A closed `Dialog` renders nothing at all.
- **The navbar docks at `xl` (1280px).** Below it the off-canvas drawer gives the content
  the full width. Breakpoints are custom (`lg` 992px, `xl` 1280px), so CSS (`Header`,
  `Navbar`, `PageLayout`, `ui-container`) and `DESKTOP_QUERY`
  (`next/providers/nav/NavProvider.tsx`) must name the same one. `NavStudies` lists the
  viewer's studies from `ProfileProvider`, each opening that study's overview;
  `NavFavorites` sits below it; both render nothing for a guest or an empty list. The
  docked state defaults to open and a stored choice wins on the next visit.
  `ProfileProvider` holds a `LoadingProvider` task until the profile arrives, so the boot
  veil waits for the nav's studies too. Study logos come from `studyLogosQuery`, a cached
  catalog read keyed by site handle — profile rows carry no image.
- **`Avatar` sizes its initials from its box.** `InitialsIcon` declares
  `[container-type:inline-size]` and the letters are a child at `38cqi`, so one component
  serves a 24px header circle and a 64px profile avatar. The size must stay off the
  container itself (`cqi` would resolve against the next container up). A caller sizes the
  box; adding padding or `text-*` clips or uncentres the letters.
