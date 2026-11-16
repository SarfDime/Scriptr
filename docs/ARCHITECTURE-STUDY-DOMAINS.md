# Study Domains

A study is its own site: `lbe.scriptr.uk` serves the `lbe` study. One build and one
deployment — `scriptr-web` answers for the catalog on `scriptr.uk` and for every study host.
Routes never move; only the address a reader types does. Deployment values:
[`VERCEL_DEPLOYMENT.md`](VERCEL_DEPLOYMENT.md).

## The address is derived, never configured

A study's host is `<siteSlug>.<host of NEXT_PUBLIC_SITE_URL>`
(`next/lib/study-origin.ts`), so `https://scriptr.uk` puts `lbe` at
`https://lbe.scriptr.uk` and `http://localhost:3000` at `http://lbe.localhost:3000`.

- **Development uses paths, not hosts**: a localhost origin serves `/study/<handle>`, and
  its addresses, links, canonicals and sitemap stay path-based — `*.localhost` is a
  different origin, so the dev session cookie would not follow. `NEXT_PUBLIC_STUDY_HOSTS=true`
  opts in; production never sets it, and `next.config.ts` registers no host rules without it.
- The subdomain label **is** the `siteSlug`. No host table, no per-study routing config, no
  Sanity read: an unknown label rewrites to a handle `getStudySiteOrNotFound` already 404s.
  Reserved labels (`www`, `api`, `studio`, `sanity`, `files`, `cdn`, `assets`) can never be
  a study.

## Host → study tree (`next/next.config.ts`)

A study host's paths are rewritten onto `/[locale]/study/[siteSlug]/…` before files are
served, so the visible URL never changes:

| On `lbe.scriptr.uk` | Served by |
| --- | --- |
| `/` | `[locale]/study/[siteSlug]/page.tsx` — the academic overview |
| `/scripts`, `/scripts/<slug>` | the feed and a script |
| `/subject/<slug>` | a subject inside the study |
| `/calendar`, `/academic-setup` | the study's calendar and setup |
| `/user/<name>` | that person's profile **inside the study** |
| `/sitemap.xml`, `/sitemap/<id>.xml` | the study's own sitemap |

Every path is registered twice — unprefixed (the default language, mapping to `/en/study/…`)
and under a non-default prefix (`/mk/scripts/x` → `/mk/study/[siteSlug]/scripts/x`) — so a
study host serves both languages at the address the reader chose. Its `/mk` is its overview
in Macedonian and its root follows the remembered language. The sitemap handlers sit outside
`[locale]`, so their addresses carry no language: `/sitemap.xml` maps onto
`/study/[siteSlug]/sitemap/index.xml`, `/sitemap/<id>.xml` onto the section route.

Everything else is left alone:

- `/_next/*`, `/api/*` and static files are never rewritten. The study paths are **listed**,
  not caught by `/:path*`, which would also match those and 404 every asset.
- `/user` **exact** is the global account page, which is why the profile rule is
  `/user/<name>` (one segment) plus `/user/<name>/<rest>`.
- Catalog-owned paths (`/search`, `/start`, `/auth*`, `/admin*`, `/university/*`,
  `/professor/*`, `/user`) `307` to the catalog host. `/search` covers the catalog only, so
  a study's header bar submits to that study's `/scripts?q=…`: the study layout passes the
  handle to `HeaderSearch` as a prop, keeping hosts out of the client and the catalog tree.
- `/study/<label>/*` `308`s to `<label>.scriptr.uk` on any of our hosts, which is how
  `scriptr.uk/study/lbe` (still minted by the API, old bookmarks and a Sanity nav item)
  resolves in one hop — and why a study host never renders a different study.

Two Next route-config constraints are load-bearing:

- **`has: { type: 'host' }` matches the hostname with the port stripped.** A pattern built
  from `localhost:3000` matches nothing; the port belongs only in the destination.
  `next.config.ts` keeps `SITE_HOST` (patterns) and `SITE_HOST_WITH_PORT` (destinations)
  apart for this.
- **A named group in `has.value` is captured into the destination**
  (`destination: '/study/:label'`). Next 16.4.2 does this in `prepare-destination.js` but it
  is **undocumented**: test it on upgrade. If it breaks, the fallback is a `next/proxy.ts`
  doing the same mapping from the forwarded host.

Redirects run before rewrites, so the apex exits win without ordering tricks.

## Address versus path

- **Absolute address** — what an outside link, a canonical and a sitemap entry need.
  `getStudySiteUrl`/`getStudyFeedPath` (`next/lib/academic-routes.ts`),
  `studySiteOrigin` (`next/lib/study-origin.ts`). `getAcademicPath` returns one for `study`,
  `subject` and `script`, so catalog cards, `NavStudies`, `StudyPicker`, search, profile
  links and the calendar all name the study's host. Every builder takes a `LocaleId` and
  puts the prefix inside the path (`https://lbe.scriptr.uk/mk/scripts/x`).
- **Catalog address** — a study page's link to something the study does not own (`/admin`,
  `/user`, `/auth`, `/start`, a professor, a university). It must be absolute too:
  `catalogUrl`, or `catalogUrl(getAcademicPath(…))`. A relative one is worse than slow: the
  router prefetches it from the study host, the cross-origin redirect is blocked as an RSC
  fetch ("Cross-Origin Request Blocked … 307"), and the reader gets a hard reload.
- One exemption: `getScriptSitePath` (`shared/utils/site-paths.ts`) stays a
  `/study/<label>/…` path, because the API mints notification and admin hrefs from a
  non-study context. Every web-app link passes it through `studyUrlFromPath` first.

## Canonicals

`PageSEO` takes `pagePath` as a path **or** an absolute URL; an absolute one is used
unchanged for the canonical and `og:url`. Study routes pass their host, so
`lbe.scriptr.uk/scripts` carries `https://lbe.scriptr.uk/scripts` and the catalog path that
redirects to it is never a second address. The catalog keeps its own origin.

## Sitemaps

- The catalog publishes `scriptr.uk/sitemap.xml` → one `catalog` section
  (`app/sitemap.xml/route.ts`, `app/sitemap/[section]/route.ts`,
  `next/lib/sitemap-entries.ts`): `/`, `/search`, universities, faculties, professors —
  never a study URL.
- A study publishes its own index and sections under the study tree
  (`app/(study)/study/[siteSlug]/sitemap/[section]/route.ts`, `next/lib/study-sitemap.ts`):
  a `study` section with its root, feed and subjects, then `scripts-<n>` pages. The index is
  the same route under the reserved `index.xml`, which the host rewrite sends `/sitemap.xml`
  to — so each host publishes its own URLs without reading a host header.
- Both publish **one entry per page with `alternates.languages`**, never one per language.
- **Both are prerendered per study at build** (`generateStaticParams` from
  `listStudySites()`), so a new study's sitemap appears after the next deploy.
- The script list comes from `GET /api/sitemap/scripts` (`x-sitemap-secret`, 10 reads a
  day), filtered by `study_site_slug`. Submit each host's sitemap separately in Search
  Console; there is no cross-host index.

Two traps shaped the routes: a segment ending in a dot cannot be prerendered per parameter
(Next ignores `generateStaticParams` and substitutes `-`, serving that placeholder to every
host), and an extension-less route handler is shadowed by a page matching the same URL
(`[locale]/[...notFound]`). Hence `sitemap/route.ts` with `index.xml`.

## Sessions and calls

The browser loads `https://lbe.scriptr.uk` directly, so cookies and CORS are ordinary
cross-subdomain cases: `COOKIE_DOMAIN` must be `.scriptr.uk` and `CORS_ORIGINS` must match
`*.scriptr.uk` (both set, see [`VERCEL_DEPLOYMENT.md`](VERCEL_DEPLOYMENT.md)). No study
hostname needs an environment variable of its own.

Cloudflare only forwards: the `Host` reaches Vercel unchanged, which is what makes the
rewrite work. The zone has no Origin Rule, Transform or Page Rule, and Cloudflare rewrites
`Host` only when a rule says so — **adding an Origin Rule that rewrites `Host` would break
every study host.**

Two places read the host because the path no longer names the study:
`getSiteSlugFromHost` (`shared/utils/site-paths.ts`) for the notification tray, and
`externalLink` (`next/lib/common-utils.ts`) so an absolute study address on our domain is
treated as internal.

## Attaching a study host

One-time per study, and the host must resolve **before** the build that links to it is
deployed.

1. **Vercel:** `vercel domains add <siteSlug>.scriptr.uk scriptr-web`. A wildcard
   (`*.scriptr.uk`) needs a plan that supports it; an explicit domain per study does not.
2. **DNS:** a **proxied** `CNAME <siteSlug> → <project-cname>.vercel-dns-017.com` (the
   target `vercel domains verify` reports):
   `cf dns records create -z scriptr.uk --body '{"type":"CNAME","name":"<siteSlug>","content":"<project-cname>.vercel-dns-017.com","proxied":true,"ttl":1}'`.
   Proxied matches `scriptr.uk`: same WAF, rate limits, analytics and HSTS. Cloudflare
   forwards `Host`, caches none of these responses (`cf-cache-status: DYNAMIC` — Next answers
   `public, max-age=0, must-revalidate`), and `vercel domains verify` still reports
   `configured_correctly` because it validates over HTTP-01 through the proxy. Rocket Loader
   must stay off in front of Next (zone-wide). `cloudflared` and `wrangler` cannot manage DNS
   records; `cf` can.
3. **Certificates, which fail differently:** Cloudflare's Universal SSL covers
   `<siteSlug>.scriptr.uk` as soon as the record is proxied, so the browser side is never
   uncovered; the origin side is Vercel's — `vercel certs ls` should show the host, and
   `vercel certs issue <host>` forces it (~8s). A missing origin certificate fails the TLS
   handshake, which Cloudflare reports as an error page, not a certificate warning.

Attaching and detaching on handle assignment is not automated; it is these three steps
([`PROGRESS.md`](PROGRESS.md)).

## Accepted costs and traps

- **`localStorage` is per origin.** A guest who set a study up on `scriptr.uk` looks unset on
  `lbe.scriptr.uk` and is prompted once. Accepted.
- **A preview deployment cannot exercise a study host** — its `NEXT_PUBLIC_SITE_URL` is a
  `*.vercel.app` alias, so the patterns target that alias. Locally use
  `NEXT_PUBLIC_STUDY_HOSTS=true` with `http://lbe.localhost:<port>`.
- **A study rename breaks its hostname**: `siteSlug` is immutable once the row exists;
  renaming needs a hostname redirect as well as a path one.
- **`robots.txt` is Vercel's**, so a per-host one needs that injection turned off first.
- **A study's sitemap is built, not rendered** — see above.
- **A study's content is built per site, its interaction is not.** The overview and every
  subject are prerendered per study (`generateStaticParams` from `listStudySites()` and
  `subjectStaticParamsQuery`) and held until a publish tag invalidates them. The feed, the
  calendar, academic setup, a script's page and a member's profile read `searchParams` or the
  session, so they render per request — a segment config cannot make those static.
- **A cross-origin redirect of the router's own fetch is a CORS error.** The catalog-owned
  redirects therefore skip `?_rsc=` requests: a page request still redirects, while a client
  navigation renders on the study host and the next full load lands on the catalog. Rendered
  links use `catalogUrl`; the exclusion is for stored and API-minted links.
- **A Sanity nav item is data.** One pointing at a catalog path renders on the study host
  and redirects on the next full load; author absolute links there or normalize them in
  `NavigationLinks`. One pointing at `/study/lbe` costs a single redirect.

## Not chosen

- **A second deployment per route group.** `next build` cannot build a subset of `app/`,
  the trees are not disjoint, and it buys nothing: one build already prerenders both the
  catalog and the study tree's per-site pages, beside the sitemaps.
- **A Cloudflare Worker or Origin Rules.** Both hide the real hostname from Vercel, forcing a
  forwarded header that is attacker-controlled and would need validating per request. A
  proxied `CNAME` already gives edge protection while forwarding `Host`.
- **A Cloudflare redirect.** It only bounces the browser; nothing would serve the study.
