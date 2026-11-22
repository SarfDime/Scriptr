<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# `next/` — Next.js 16, React 19

Repo rules: [`../AGENTS.md`](../AGENTS.md). Architecture:
[`Frontend Structure`](../docs/ARCHITECTURE-FRONTEND.md),
[`API Client`](../docs/ARCHITECTURE-API-CLIENT.md), [`CANVAS.md`](../docs/CANVAS.md),
[`STYLING_GUIDE.md`](STYLING_GUIDE.md).

## Components

- Server Components by default. `'use client'` only for real interactivity, state or
  effects; `'use server'` only for real Server Actions. Chrome that prints the clock
  stays server and wraps a client leaf (`HeaderDate`).
- Every browser-touching module says so, not just components: a hook or a helper that
  reads `localStorage`/`document` starts with `'use client'`, so a Server Component
  importing it fails the build instead of 500ing at request time.
- React Compiler is on (`reactCompiler: true`): no hand-written `useMemo`,
  `useCallback` or `React.memo`; justify an exception in a comment.
- `params`/`searchParams` are `Promise`s everywhere, `generateMetadata` included — always
  `await`.
- Turbopack is the bundler; no webpack config without a documented reason.
- No middleware. Request interception means `proxy.ts` (Node runtime), never
  `middleware.ts`.
- Keep pages thin: `page.tsx` awaits params, calls a loader in `next/lib/<feature>-page.ts`
  (fetching, cookies, 404s) and composes components that take a view model from
  `next/types/components/`. Components do not fetch; one responsibility each.
- Every screen needs loading, error and empty states, and semantic, ARIA-correct HTML.
- An icon-only `<Button>`/`<NextLink>` needs an explicit `aria-label`
  (`AccessibleNameProps` cannot see an element child).

## Caching and rendering

Cache Components is on: every route ships a prerendered shell and its request-time
parts stream into it. `dynamic`, `revalidate`, `fetchCache` and `dynamicParams` are
build errors — do not add them.

- **Request data goes in a leaf inside `<Suspense>`**: `params`, `searchParams`,
  `cookies()`, `headers()`, the session, a clock or a random value. Headings, chrome
  and Sanity content stay in the shell; the leaf that resolves the URL renders last.
  Awaiting `params` at the top of a page ties its shell to one URL, so a route with
  reader-supplied params (`[username]`, `[scriptSlug]`) awaits them inside a boundary.
- **A route that must stay fully prerendered** exports
  `ensureStatic = 'navigation'` beside `generateStaticParams`. Never on a route that
  reads `searchParams`, `cookies()` or `headers()`. Client Components cannot carry
  segment config.
- **A page whose whole content is the URL's entity** (university, faculty, professor,
  study overview, subject) exports `instant = false`: it awaits `params` before the first
  byte, which keeps its prerendered document complete and an unknown slug a real `404`.
  `instant` only turns off instant-navigation validation; it does not change what is
  prerendered.
- **A clock or `Math.random` in a render fails the prerender.** Read it on the client
  (`useMounted`, or `useRelativeNow` for a relative label) or cache it
  (`getPrerenderNow`). `connection()` marks a request-time read that must be explicit,
  such as the calendar's "today".
- **`use cache` is for a value no request decides** — the clock the shell was built
  with, the calendar's window. Give it a `cacheLife`, a `cacheTag` when a mutation must
  reach it, and read the language through `next/root-params` (part of the cache key) or
  take it as an argument. Never read `cookies()`/`headers()` inside it.
- No time-based revalidation of data: `cachedPublicRead`, `cachedUnlessPersonalized` and
  `fetchSanityData` pass `revalidate: false`. A Hono mutation that changes a cached
  read calls `revalidateCacheTags` with tags from `shared/config/cache-tags.ts`.
- `revalidateTag()` needs a `cacheLife` profile; `/api/revalidate` keeps
  `revalidateTag(tag, { expire: 0 })` so a mutation never serves stale data.
- **A client shell above the page cannot suspend**, so it reads the pathname with
  `useCurrentPathname` (`providers/nav/pathname-scope.tsx`), never `usePathname`.
- **A layout hands params down as a promise** and lets the parts that need them resolve
  inside a boundary — the study tree's alert and search scope do
  (`components/navigation/StudyChrome.tsx`). Awaiting them in the layout ties every page
  below to one URL. Keep the boundary to that leaf: a component that reads a client store
  (the session, notifications) inside a deferred boundary hydrates against a store that has
  already loaded, and mismatches the HTML the server sent.
- **A `notFound()` after the shell has been sent answers `200`** with the localized 404
  and its `noindex`. Only a param known at prerender keeps the real status.
- **`apiFetch` rethrows Next's own errors before treating a failure as an outage.** A
  prerender or navigation that bails out aborts the in-flight request, and
  `unstable_rethrow` (first line of the `catch`) is what keeps that bailout visible
  instead of logging an API failure.
- `next/image`: 16-era defaults (async decoding, `fetchPriority: auto`,
  `qualities`/`minimumCacheTTL`/`imageSizes` in `next.config.ts`).

## API and data

- Only `apiFetch` (`next/lib/api/next-api.ts`) and the `next/lib/api/*-api.ts`
  wrappers, with paths from `apiRoutes` (`shared/config/api-routes.ts`). No new `fetch`
  pattern, no hardcoded path.
- **`SITEMAP_SECRET` and `/api/sitemap/*` are server-only:** no `NEXT_PUBLIC_`
  prefix, no `env` entry in `next.config.ts`, no logging or returning it, no Client
  Component, hook, `'use client'` module or Server Action sending
  `x-sitemap-secret` or using `apiRoutes.sitemap.*`. The one call lives in
  `next/lib/api/sitemap-api.ts` (`import 'server-only'`). A feature that seems to need
  another shared-secret route gets a session-authenticated `hono/` route instead.
  After `corepack pnpm build:next`, grep `next/.next/static` for `x-sitemap-secret`
  and for the value; both must be empty.
- **Admin is gated twice** — admin session plus a twenty-minute TOTP unlock.
  `app/[locale]/(app)/admin/layout.tsx` shows `AdminAccessGate` when it is missing or
  spent, but a layout is not re-rendered on a client-side navigation, so **every**
  admin page starts with
  `const cookie = await requireAdminUnlock(); if (!cookie) return <AdminAccessGate />`
  and passes that cookie to its loader. Keep admin pages under `/admin`; never read the
  token in a component. The surface is `noindex, nofollow` (layout metadata and
  `X-Robots-Tag`), disallowed in `app/robots.ts`, and absent from the sitemaps.

## UI

- Follow [`STYLING_GUIDE.md`](STYLING_GUIDE.md): reuse `Box`/`Card`/`Button`/`Badge`/
  `Divider` and the `ui-*`/`cp-*` classes; never invent a class absent from `styles/`.
  Theme through `providers/theme/`, never hardcoded colours. A utility needs 3+ repeats.
- `Dialog` mounts only while open — no `<dialog>`, no children when closed. Pass
  `isOpen` (with `hideTrigger`) or let its trigger open it; never wrap its children in
  another `isOpen &&`. The body scroll lock is ref-counted (`useBodyScrollLock`).
- `Field` owns label and description wiring: it generates the ids and controls take
  them from `useFieldControl`. Never hand-roll `id`/`aria-describedby`; pass `grouped`
  when the children are several controls or composed content.
- Toast severity picks the region: `error` and `warning` are assertive (`role='alert'`),
  everything else polite.
- Background canvases follow [`CANVAS.md`](../docs/CANVAS.md) — the only place a
  `requestAnimationFrame` loop is allowed.

## Localization

- A translated entry is `{ en, mk }` in its collection (`shared/strings/*`,
  `UI_STRINGS`, `shared/config/strings.ts`). The `_PACK` export is the source of truth;
  the historical export is its English view. Copy that depends on a value is a function
  on the collection.
- Client Component: `useUIStrings()` / `useStrings(pack)` (`providers/locale/`). Any
  table or label array built from strings is built inside the render — module scope
  freezes the first language. A file calling these hooks **is** a Client Component and
  must say `'use client'`.
- Server Component: `await getServerStrings(<AREA>_PACK)` (`next/lib/server-strings.ts`).
  `PageHeader` takes a `LocalizedMessage` (a string or an entry) and resolves it itself,
  which makes it server-only — a Client Component passes a resolved string.
- A string needed as a `string` in a Client Component (an attribute, a `string` prop)
  comes from `useCopy('path')`. Path types (`UIPath`, `CalendarPath`,
  `StringPackPath<P>`) come from `@shared/config/string-packs`.
- **Every minted address carries the locale**: `localizedPath(path, locale)` for links,
  redirects, canonicals and sitemaps; the builders (`getAcademicPath`,
  `getStudyFeedPath`, `getStudySiteUrl`, `catalogUrl`, `studyUrlFromPath`) take a
  `LocaleId`. `getServerLocale()` on the server, `useLocale()` on the client. A link
  that stays in the app is built, never written as `/start`.
- The remembered language is the `scriptr-language` cookie plus `localStorage`
  (`setStoredLocale`), because the `next.config.ts` redirect for `/` can read only a
  cookie. It is a preference, never authorization.
- Sanity text: every projection reads a localized field through `localizedProjection`
  (or `localizedValue` in a `match`/`order()`) from
  `next/sanity/queries/localized.queries.ts`, so components never see a `localized*`
  object. The helper stays an expression-bodied arrow over a plain template string, and
  languages are read by name (`x.en`), never by index — typegen silently drops what it
  cannot evaluate. A rendered read passes `locale: await getServerLocale()`.
- Dates: `shared/utils/date-format.utils.ts`, never `Intl` or `toLocaleDateString` — a
  browser without `mk-MK` data silently resolves to `en-US`. Pass `'utc'` for calendar
  day keys. Relative times go through `formatDate` (`mkCount` for the counted singular).
- The locale is a route param: the tree under `app/[locale]` is the root layout and owns
  `<html lang>`; route handlers (`app/api/*`, both sitemap trees) stay outside it. A page
  reads `params` (`LocalePageProps<T>`); deeper code calls `getServerLocale()`. A layout
  declares `locale: string` (Next's `LayoutConfig` rejects a narrowed type). Route
  handlers and `generateStaticParams` get the default language.
  `generateStaticParams` stays on the `[locale]` layout, and the layout validates the
  segment against `LOCALES`.
- `global-error.tsx` stays English at `app/` (it replaces the root layout);
  `not-found.tsx` and `error.tsx` live under `[locale]`. Never import
  `providers/locale/*` from `shared/`, `hono/` or `sanity/`.
- Macedonian is short and natural, not literal: prefer the shorter noun to the adjective
  (`Ден` / `Ауто` / `Ноќ`), and fit the test to the widest control.
- Verify a localization change per language, not per build: `lang`, page title,
  canonical, one `aria-label`, a sitemap entry carrying both alternates, a document
  authored in one language only, and a client-side switch with no full reload.
  `next/.next/server/app/[locale]/…/page_client-reference-manifest.js` shows whether a
  component crossed into the client bundle.

## Environment

- A new variable gets an entry in `ENV_REQUIREMENTS` (`next/lib/startup-report.ts`,
  reported by `instrumentation.ts`). Say when a `NEXT_PUBLIC_*` value is inlined at
  build. Names only, never values.
