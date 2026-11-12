# Study Domains

A study is a site of its own: `lbe.scriptr.uk` serves the `lbe` study. It is
**one build and one deployment** — `scriptr-web` answers for the catalog on
`scriptr.uk` and for every study host, and nothing is built separately for a
study. The routes never move; only the address a reader types does.

This file records how that works, how to attach another host, and what was
deliberately not done. Deployment-side values live in
[`VERCEL_DEPLOYMENT.md`](VERCEL_DEPLOYMENT.md).

## The address is derived, never configured

A study's host is `<siteSlug>.<host of NEXT_PUBLIC_SITE_URL>`
(`next/lib/study-origin.ts`), so `https://scriptr.uk` makes `lbe` live at
`https://lbe.scriptr.uk` and `http://localhost:3000` makes it
`http://lbe.localhost:3000`. There is no second variable to forget and no way
for a study host to disagree with the catalog's origin.

The subdomain label **is** the `siteSlug`. There is no host table, no per-study
routing config and no Sanity read in front of the app: an unknown label rewrites
to a handle that `getStudySiteOrNotFound` already 404s. A reserved label
(`www`, `api`, `studio`, `sanity`, `files`, `cdn`, `assets`) can never be a study.

## Mapping a host onto the study tree — `next/next.config.ts`

A study host's own paths are rewritten onto `/study/[siteSlug]/…` before files
are served, so the URL the reader sees never changes:

| Path on `lbe.scriptr.uk` | Served by |
| --- | --- |
| `/` | `study/[siteSlug]/page.tsx` — the academic overview |
| `/scripts`, `/scripts/<slug>` | the study's feed and a script |
| `/subject/<slug>` | a subject inside the study |
| `/calendar`, `/academic-setup` | the study's calendar and setup |
| `/user/<name>` | that person's profile **inside the study** |
| `/sitemap.xml`, `/sitemap/<id>.xml` | the study's own sitemap |

Everything else is left alone, which is the point:

* `/_next/*`, `/api/*` and static files are never rewritten. The study paths are
  **listed**, not caught by a `/:path*` catch-all, because a catch-all also
  matches those and would 404 every asset on a study host.
* `/user` **exact** is the signed-in reader's own account page, which is global.
  That is why the profile rule is `/user/<name>` (one segment) plus
  `/user/<name>/<rest>` rather than a prefix.
* Catalog-owned paths (`/search`, `/start`, `/auth*`, `/admin*`, `/university/*`,
  `/professor/*`, `/user`) redirect to the catalog host, so a study host never
  pretends to own the platform. They are `307`s: structural today, but not
  promised forever.
* `/study/<label>/*` redirects to `<label>.scriptr.uk` with a `308`, on any of our
  hosts. That is what makes `scriptr.uk/study/lbe` — the address the API, old
  bookmarks and a Sanity nav item still mint — resolve to the study's canonical
  host in one hop, and it is why a study host never renders a *different* study
  under a `/study/…` URL.

Two constraints of Next's route config are load-bearing here:

* **`has: { type: 'host' }` matches the hostname with the port already stripped.**
  A pattern built from `localhost:3000` matches nothing; the port belongs only in
  the redirect *destination*. `next.config.ts` keeps `SITE_HOST` (patterns) and
  `SITE_HOST_WITH_PORT` (destinations) apart for this reason.
* **A named group in `has.value` is captured into the destination**
  (`destination: '/study/:label'`). Next 16.4.2 does this in
  `prepare-destination.js`, but it is **undocumented**, so it needs a test on
  upgrade. If it ever stops working the fallback is a `next/proxy.ts` that does
  the same mapping from the forwarded host.

Redirects run before rewrites, so the apex exits win without ordering tricks.

## Address versus path

Two shapes exist and they are not interchangeable:

* **Absolute address** — what a link from outside a study, a canonical and a
  sitemap entry need. `getStudySiteUrl` / `getStudyFeedPath`
  (`next/lib/academic-routes.ts`), `studySiteOrigin` (`next/lib/study-origin.ts`).
  `getAcademicPath` returns one for `study`, `subject` and `script`, so catalog
  cards, `NavStudies`, `StudyPicker`, search, profile links and the calendar's
  subject links all name the study's host.
* **Site-relative path** — what a page rendered *by* a study site links to:
  `studySiteHomePath` (`/`), `studySiteFeedPath` (`/scripts`),
  `studySiteCalendarPath`, `studySiteSetupPath`. Pointing those at
  `/study/<label>/…` would still work, but every click would pay a redirect.

Two exceptions are accepted rather than fixed:

* `getScriptSitePath` (`shared/utils/site-paths.ts`) stays a `/study/<label>/…`
  path because the API mints notification and admin hrefs with it, from a
  context that is not a study site.
* A script card links through `getAcademicPath({ type: 'script' })` — the
  absolute address — and is also rendered on the catalog profile page, where it
  must name the study. The cost is one same-origin `308` per click from inside a
  study.

## Canonicals: one address per study

`PageSEO` (`next/components/page-seo/PageSEO.tsx`) takes `pagePath` as a path
**or** an absolute URL; an absolute one is used unchanged for both the canonical
and `og:url`. The study routes pass their host, so `lbe.scriptr.uk/scripts`
carries `https://lbe.scriptr.uk/scripts` as its canonical and the catalog path
that redirects to it is never a second address for the same page. The catalog
keeps its own origin.

## Sitemaps: one index per host

The catalog publishes `scriptr.uk/sitemap.xml` → one `catalog` section
(`next/app/sitemap.xml/route.ts`, `next/app/sitemap/[section]/route.ts`, built in
`next/lib/sitemap-entries.ts`). It lists `/`, `/search`, the universities,
faculties and professors — never a study URL, since a study has a canonical host
of its own.

A study publishes its own index and sections under the study tree
(`next/app/(study)/study/[siteSlug]/sitemap/route.ts` and
`…/sitemap/[section]/route.ts`, built in `next/lib/study-sitemap.ts`): a `study`
section with its root, its feed and its subjects, then `scripts-<n>` pages of its
scripts. The host rewrite sends `/sitemap.xml` to the first of those, so each
host publishes its own URLs without reading a host header.

**Both are prerendered per study at build** — `generateStaticParams` from
`listStudySites()` — and held until the next deploy, like the catalog's. That is
not optional. Next ignores `generateStaticParams` on a route segment that ends in
a dot, so `/study/[siteSlug]/sitemap.xml` was prerendered once with `-` as the
handle and every study host was served that placeholder's empty body: a 404 on
the live host, while the same request worked under `next start`. That is why the
index is `sitemap/route.ts` and the host rewrite maps `/sitemap.xml` onto it.
The consequence to remember: a new study's sitemap appears after the next
deploy, not the moment its host is attached.

The script list comes from `GET /api/sitemap/scripts` (behind `x-sitemap-secret`,
limited to 10 reads a day) and is filtered by `study_site_slug`. Submit each
host's sitemap separately in Search Console; there is no cross-host index.

## Sessions and calls

The browser loads `https://lbe.scriptr.uk` itself, so the session cookie and CORS
are ordinary cross-subdomain cases: `COOKIE_DOMAIN` must be `.scriptr.uk` and
`CORS_ORIGINS` must match `*.scriptr.uk` (both are already set, see
[`VERCEL_DEPLOYMENT.md`](VERCEL_DEPLOYMENT.md)). Nothing in the app needs a
study hostname in an environment variable of its own.

Cloudflare sits in front (see *Attaching a study host*) but it only forwards: the
`Host` reaches Vercel unchanged, which is what makes the rewrite work. The zone
has no Origin Rule, Transform Rule, cache rule or Page Rule (`cf rulesets list`,
`cf page-rules list` are all empty), and Cloudflare rewrites `Host` only when a
rule says so — hence no forwarded-header handling and no trust rule, unlike the
Worker or Origin-Rules routes rejected at the end of this file. **Adding an
Origin Rule that rewrites `Host` would break every study host.**

Two places read the host rather than the path, because the path no longer names
the study:

* the notification tray (`getSiteSlugFromHost`, `shared/utils/site-paths.ts`), so
  a study site shows that study's notifications plus the platform-wide ones;
* `externalLink` (`next/lib/common-utils.ts`), so an absolute study address on
  our own domain is treated as internal instead of opening in a new tab with an
  external-link icon.

## Attaching a study host

One-time per study, and the order matters: the host must resolve **before** the
build that links to it is deployed, or the study is unreachable from the catalog.

1. **Vercel** — attach the name to the `scriptr-web` project:
   `vercel domains add <siteSlug>.scriptr.uk scriptr-web`. A wildcard
   (`*.scriptr.uk`) needs a plan that supports it; an explicit domain per study
   needs nothing extra.
2. **DNS** — a **proxied** `CNAME <siteSlug> → <project-cname>.vercel-dns-017.com`,
   the target `vercel domains verify` reports:
   `cf dns records create -z scriptr.uk --body '{"type":"CNAME","name":"<siteSlug>","content":"<project-cname>.vercel-dns-017.com","proxied":true,"ttl":1}'`.
   Proxied matches `scriptr.uk`: the same WAF, rate limits, analytics and HSTS in
   front of a study's pages. It costs nothing in correctness — Cloudflare
   forwards the `Host`, does not cache these responses (`cf-cache-status:
   DYNAMIC` on the catalog and on a study host alike, because Next answers
   `cache-control: public, max-age=0, must-revalidate`), and
   `vercel domains verify` keeps reporting `configured_correctly` because it
   validates over HTTP-01 through the proxy rather than by resolving the CNAME.
   Rocket Loader must stay **off** in front of Next (it is, zone-wide).
   `cloudflared` (a tunnel client) and `wrangler` (workers and storage) cannot
   manage DNS records; `cf` can.
3. **Certificate** — two certificates, and they fail differently. Cloudflare's
   Universal SSL covers `<siteSlug>.scriptr.uk` (one label under the apex) as
   soon as the record is proxied, so the browser's side is never uncovered. The
   origin side is Vercel's: `vercel certs ls` should show the host, and if it
   does not after a few minutes `vercel certs issue <host>` forces it (about 8s).
   A host without one fails the TLS handshake at the origin, which Cloudflare
   surfaces as an error page rather than as a certificate warning.

Attaching and detaching a host when a study gains or loses its handle is **not
automated** — it is the three steps above. Recorded in
[`PROGRESS.md`](PROGRESS.md).

## Accepted costs and traps

* **`localStorage` is per origin.** A guest who set up a study on `scriptr.uk`
  looks unset on `lbe.scriptr.uk` and is prompted once. Accepted, not fixed.
* **A preview deployment cannot exercise a study host.** Its
  `NEXT_PUBLIC_SITE_URL` is a `*.vercel.app` alias, so the patterns built from it
  target that alias. Test on `http://lbe.localhost:<port>` instead.
* **A study rename breaks its hostname.** `siteSlug` is immutable once the study
  is in the database; renaming now needs a hostname redirect as well as a path
  redirect.
* **`robots.txt` is Vercel's**, not ours, so a per-host one needs that injection
  turned off first (see `PROGRESS.md`).
* **A study's sitemap is built, not rendered.** It is prerendered from the study
  list at build, so a study added after a deploy has a working site and no
  sitemap until the next one.
* **A route segment ending in a dot cannot be prerendered per parameter.** Next
  silently ignores `generateStaticParams` there and substitutes `-`, and the
  placeholder's body is what every host is served. Verified on `/sitemap.xml`
  under `study/[siteSlug]`; the workaround is a dot-free route plus a rewrite.
* **A Sanity nav item that points at `/study/lbe`** costs one redirect to the
  study host. Its destination is data, so it is corrected in the Studio, not in
  the app.

## Not chosen

* **A second deployment per route group** (`app/(study)` only, `app/(site)` only).
  `next build` cannot build a subset of `app/`, the trees are not disjoint
  (a study page links to `/university/…` and `/professor/…`), and it would buy
  nothing: the whole study tree is dynamic (`ƒ` in the build manifest), so all of
  the build cost is the catalog's `generateStaticParams` and the sitemaps.
* **A Cloudflare Worker or Origin Rules in front of the Vercel alias.** Both hide
  the real hostname from Vercel, which forces a forwarded header that only the
  app can interpret — and that header is attacker-controlled, so it would have to
  be validated against the study domain on every request. A proxied `CNAME` to
  the project already gives edge protection while forwarding the `Host`
  unchanged, so neither is needed.
* **A Cloudflare redirect.** A redirect only bounces the browser; nothing would
  serve the study at that hostname.
