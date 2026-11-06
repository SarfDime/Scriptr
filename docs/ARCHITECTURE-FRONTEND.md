# Frontend Structure & UI Conventions

* **Thin pages.** A route's `page.tsx` awaits its params, calls a loader, and composes components. Fetching, cookies and 404 handling live in `next/lib/<feature>-page.ts` (e.g. `loadScriptDetailScript` for the existence check, then `loadScriptDetailPage` for the rest; `loadPublicProfilePage` for `/user/[username]` and `loadMyProfilePage` for `/user`, both in `next/lib/profile-page.ts`), which return view models typed in `next/types/components/` (e.g. `ScriptDetailViewModel`, `PublicProfilePageViewModel`, `MyProfilePageViewModel`). Components receive plain props and never fetch. Pure helpers (sorting, link labels, author display) live in `next/lib/<feature>.ts`.
* **A `loading.tsx` costs the 404 status.** A segment-level Suspense boundary flushes the response before the page resolves, so `notFound()` streams after the headers and the route answers `200`. The script detail route therefore has no `loading.tsx`; it awaits its existence check first and uses the skeleton as its own `Suspense` fallback for the body. `/user/[username]` is the same case — a `loading.tsx` there made a missing profile answer `200`. Its loader, `loadPublicProfilePage` (`next/lib/profile-page.ts`), makes both route-level decisions before anything renders: a viewer opening their own username is redirected to `/user`, and `getPublicProfileByUsername` returning `null` (the API answered `404`) becomes `notFound()`. Any other failed read throws to the error boundary rather than showing a false 404; only the stats read is contained (`null` leaves the counts undefined, so the activity strip is skipped).
* **Homepage script feed.** The default list is curated from the viewer's in-progress subjects; `/?scripts=all` renders the platform-wide top list. The choice is read from `searchParams` in the Server Component and switched with plain links (`ScriptFeedToggle`), so the page stays server-rendered and only the selected list is fetched.
* **Script detail page** (`/scripts/[slug]`): `ScriptDetailOverview` places two frosted surfaces in a wrapping flex row: the info group (`ScriptInfoPanel` + `ScriptAdditionalReading`, always shown, with an empty state) and `ScriptFilesSection`. The files take almost all free space (grow 100 vs 1), so when the row is too narrow the *first* wrap is the files dropping below the info group; only then does the reading panel wrap under the info. Files render in an `auto-fit` grid; each `ScriptFileCard` is its own container-query container, stacked while narrow and thumbnail-beside-details once about 28rem wide. A lone file is capped to its content width. `ScriptFileCard` composes `ScriptFileThumbnail` and `ScriptFileActions` and owns the preview modal.
* **The academic calendar** (`/calendar`, §9 in [Calendar](ARCHITECTURE-CALENDAR.md))
  keeps its view in the URL (`?view=month|week&date=YYYY-MM-DD`), so it is a
  Server Component with `Link` controls and no client state; it reads
  `searchParams` and must never be pinned `force-static`. Opening a day is a
  link to the week view, so its one client island is the header alert (the
  layout ships build-time events, and the island narrows them to the reader's
  subjects).
* **Study tips** are Sanity-only content (`studyTip` documents with a rich text title and rich text content, no `dbId`, not synced to the database); the card heading is the tip's own title. `getDailyStudyTip` (`next/lib/study-tip.ts`) fetches them on the server and picks one by UTC day number, so the choice is deterministic and there is no client-side randomness. The pages that show the card (homepage, `/user`, `/user/[username]`) pass it down as a prop; with no tips, or a failed fetch, nothing renders. The pick is evaluated per request, which holds only while those pages are dynamic: if one were made static or ISR, its tip would freeze until revalidation.
* **Footer.** A one-line static Server Component (`Footer`, wordmark and copyright, copy in `UI_STRINGS.footer`) styled with `ui-above` and spanning the full width of the main area like the header (so it is full width while the navbar is collapsed), rendered by `MainLayout` after the content, with no request-time APIs so static routes stay static. The existing Sanity `footer` document is not used and is not linked from `website`; the static footer was chosen because no footer content exists. `MainLayout` is a flex column so the footer sits at the bottom of short pages, and `--footer-height` lets full-screen layouts (`/auth` on mobile) account for it.
* **Strings.** User-facing copy lives in `shared/strings/<area>-strings.ts` (`comments-strings.ts`, `scripts-strings.ts`, `ratings-strings.ts`) or `UI_STRINGS` (`shared/config/strings.ts`), never inline in components.
* **Failures.** A thrown render or data failure lands on a route boundary —
  `next/app/error.tsx`, plus `scripts/[slug]/error.tsx` for the script page —
  which shows generic copy and a retry. Never render `error.message`: it is an
  exception, and its text can carry database or stack details. Unknown routes
  render a `not-found.tsx`; the root and per-segment ones share `ErrorState`
  (`next/components/ui/ErrorState.tsx`), which is a `<section>` because the
  root layout's `MainLayout` already owns the `main` landmark. Its
  illustration is an inline SVG component
  (`next/components/ui/AstronautIllustration.tsx`) rather than an `<img>`,
  because a CSS variable cannot reach an external SVG: every fill is an
  `--illustration-*` role from `styles/base/semantic.module.css`, which
  re-tints the figure per theme and carries light-theme literals as
  fallbacks for `global-error.tsx`, where no stylesheet loads.
  `global-error.tsx` catches failures in the layout itself, where the
  stylesheet is not guaranteed, so it uses inline styles only.
* **A failed user action is a toast, not a page.** Mutations report the
  outcome in place with `useToast().addToast({ type: 'error' | 'success', ... })`
  (`next/providers/toaster/ToasterProvider.tsx`); the reader stays where the
  action was, and the copy comes from `UI_STRINGS`. Only a failure that throws
  during render reaches an error boundary.
* **Only reader-written errors are quoted.** What a failure *says* comes from
  `toUserMessage(error, fallback)` (`next/lib/user-facing-error.ts`): an error
  the code marked as `UserFacingError` keeps its wording — the optimizer
  rejecting a file, or naming which one still has to be sent — and everything
  else gets the `UI_STRINGS` line. Every `ApiError` is in the second group on
  purpose: its body is written for whoever calls the API, so some messages are
  reader copy and some are not ("Invalid pagination or sort parameters"), and
  the `503` that `apiFetchRequired` throws when the API is unreachable names
  the endpoint. A client that needs a specific case shown maps it itself and
  wraps it in a `UserFacingError`. The request layer converts one status on its
  own: a `429` is thrown as a `UserFacingError`, because every rate-limit body
  in the API tells the reader what to do ("Too many comments. Please try again
  later.", "Too many uploads. Please wait a few minutes and try again.").
  Sign-in is the other exception: `SessionProvider` shows a 4xx from `/auth/*`
  verbatim, because those routes pass Supabase's own wording through ("Invalid
  login credentials", "Email not confirmed"), and falls back to generic copy for
  a 5xx body.
* **"Failed" is not "empty".** A loader must not swallow a failed read into an
  empty list or `null` when the page would then misreport the state — a profile
  read that fails must not render `404`, and a search that never ran must not
  say "no results". Return the failure, and let the page render its error
  state. The `apiFetchPublicRead` fallbacks exist only for reads a build or a
  static route must survive.
* **A control carries its own name.** `Button` and `NextLink` require `ButtonProps`/`NextLinkProps`, which are `AccessibleNameProps` — rendered content, or an `aria-label`/`aria-labelledby` when there is none — so a button with no content and no name fails to compile rather than shipping as an unnamed control. Wrappers that render their own content take the base props instead (`ButtonBaseProps`, `NextLinkBaseProps`) or supply a default label (`CloseButton`), and they wrap props with `OmitProps` rather than `Omit`: the built-in one keeps only the keys a union shares, which would drop the requirement (and the rest of the props) instead of narrowing them. The limit worth knowing: `<Button><CloseIcon /></Button>` has children, so nothing — type or lint — sees that it has no name; that stays a review pass. Beyond names, the a11y lint rules cover static-element handlers and key handlers, and toasts announce through one polite live region (`ToastContainer`).
* **The root layout owns only the shell.** Fonts are declared in `next/app/fonts/fonts.ts` (beside the woff2 files, so the paths stay local) and exported as class names the layout applies; the layout itself fetches the nav menu, the onboarding catalog and the star-canvas config and renders chrome. Site-level metadata comes from `generateMetadata`, reading the same `website` document every page reads — so `siteName`, the fallback description and the keyword list have one source — and sets `metadataBase` from `website.siteUrl` through `toOrigin` (`next/lib/academic-detail-page.ts`), which falls back to the environment origin and then to nothing rather than throwing on free text typed in the Studio. Font preloads are off for the local families on purpose: `next/font` preloads every declared file, which made a page fetch 22 woff2 files to render five faces.
* **Metadata and canonicals come from the route's real path.** Detail pages get their metadata from `PageSEO` (`next/components/page-seo/PageSEO.tsx`), which takes `pagePath` — the page's own site-relative path, built with `getAcademicPath` (`next/lib/academic-routes.ts`) — and turns it into the canonical and the Open Graph URL, so it has to equal the URL the route is served at. The four academic entities are nested, and the prefix is singular (`/university/...`, `/professor/...`), which is why the pair of props this used to take (`pageDomain` plus the leaf slug) silently emitted canonicals pointing at URLs that 404: `/universities/ukim`, `/faculties/<slug>`. `PageSEO` now requires `pagePath` and has no other way to build one. `/scripts/[slug]` uses it as well. `/sitemap.xml` (`next/app/sitemap.ts`) lists `/`, `/search`, every academic route from the same `*StaticParamsQuery` the routes pre-generate from, and every script; the script list comes from `GET /api/sitemap/scripts` (behind `x-sitemap-secret`, scoped to that one route and limited to 10 reads a day) because the public listing is admin-only and paginated, and it carries only `slug` and `updated_at`. The sitemap itself is prerendered at build time and never revalidated, so that read happens once per deployment. Mirroring the static params means it cannot list a URL the route would 404, a failed read drops its own section instead of publishing an empty one, and the whole file is empty (with a warning) when `NEXT_PUBLIC_SITE_URL` is unset, since its URLs need the origin.
* **Surfaces and dialogs.** Content sits on a frosted outer surface (`ui-above`) with a lighter inner fill (`ui-above-inside`) where text is shown; dialogs (file preview, sign-in) follow the same pattern. Details in `next/STYLING_GUIDE.md`.
* **The navbar docks at `xl` (1280px).** Below it the navigation is the off-canvas drawer opened by the header toggle, and the content column gets the full width; the breakpoints are custom (`next/styles/base/breakpoints.module.css`: `lg` is 992px, `xl` is 1280px), so the CSS side (`Header`, `Navbar`, `PageLayout`, `ui-container`) and the JS side (`DESKTOP_QUERY` in `next/providers/nav/NavProvider.tsx`) have to name the same one — they decide the same state, and when they disagreed the drawer and the dock could both apply. Docking later is deliberate: a 248px rail plus its gutter leaves under 800px of content at 992-1280px, where the cards are narrow enough that wrapping text dominated the page.
* **`Avatar` sizes its initials from its box.** `InitialsIcon` is the box (`[container-type:inline-size]`) and the letters are a child at `38cqi`, so one component serves a 24px header circle, a 40px card avatar and a 64px profile one without a per-site font size. The size must stay off the container itself: `cqi` on the element that declares the query resolves against the next container up, which rendered 114px letters inside a 24px circle. A caller sizes the box; passing a padding or a `text-*` with it either clips the letters or centres nothing, and an `Avatar` in an unsized flex row has no box to fill at all.
