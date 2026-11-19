import bundleAnalyzer from '@next/bundle-analyzer'
import { DEFAULT_LOCALE, LOCALES } from '@shared/config/localization-constants'
import type { NextConfig } from 'next'

// Initialize bundle analyzer with type safety
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

/**
 * A study is served from its own hostname (`lbe.scriptr.uk`) by rewriting that
 * host's paths onto the study tree (`/study/[siteSlug]/…`). One deployment, one
 * build: the routes never move, only the address a reader types.
 *
 * The domain comes from the site origin, so a study host cannot drift from the
 * catalog's. `.env` is not guaranteed to be loaded for this file, so a build
 * without the variable falls back to the origin that deployment runs on.
 */
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000'
    : 'https://scriptr.uk')

const siteUrl = ((): URL => {
  try {
    return new URL(SITE_URL)
  } catch {
    return new URL('https://scriptr.uk')
  }
})()

/**
 * `scriptr.uk`, or `localhost` in development — the host studies hang off.
 * Next matches a `has: { type: 'host' }` pattern against the hostname with the
 * port already stripped, so the patterns must not carry one.
 */
const SITE_HOST = siteUrl.hostname.replace(/^www\./, '')
/** The same host as a reader would type it, port included, for redirects. */
const SITE_HOST_WITH_PORT = siteUrl.host.replace(/^www\./, '')
const SITE_ORIGIN = `${siteUrl.protocol}//${SITE_HOST_WITH_PORT}`

/**
 * Whether a study is served from its own hostname here. A localhost origin stays
 * path-based, or the dev session cookie does not follow `lbe.localhost` and
 * tooling that does not special-case `localhost` cannot reach it. Mirrors
 * `STUDY_HOSTS` in `next/config/env.ts`; `NEXT_PUBLIC_STUDY_HOSTS=true` opts in.
 */
const STUDY_HOSTS = process.env.NEXT_PUBLIC_STUDY_HOSTS
  ? process.env.NEXT_PUBLIC_STUDY_HOSTS === 'true'
  : !/^https?:\/\/(?:[a-z0-9-]+\.)?localhost(?::\d+)?$/i.test(SITE_URL)

/** Subdomains the app itself serves; a study handle can never be one. */
const RESERVED_LABELS = [
  'www',
  'api',
  'studio',
  'sanity',
  'files',
  'cdn',
  'assets',
]

const escapeHost = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** `lbe.scriptr.uk`, capturing `lbe` as `label`, and never `www`/`api`. */
const STUDY_HOST = `(?<label>(?!(?:${RESERVED_LABELS.join('|')})\\.)[a-z0-9-]+)\\.${escapeHost(SITE_HOST)}`
/** The catalog host and any study host — everything this app answers for. */
const OUR_HOSTS = `(?:[a-z0-9-]+\\.)?${escapeHost(SITE_HOST)}`

const onStudyHost = [{ type: 'host' as const, value: STUDY_HOST }]
const onOurHosts = [{ type: 'host' as const, value: OUR_HOSTS }]

/**
 * Paths a study site owns. Anything else on a study host is either a static
 * asset or a catalog page, so it is not rewritten — a catch-all would swallow
 * `/_next` and `/api`. Each one is rewritten by prefixing the study tree onto
 * the same path, so `lbe.scriptr.uk/scripts/x` is served by
 * `/[locale]/study/[siteSlug]/scripts/[scriptSlug]` with the URL unchanged.
 *
 * The list is written once and registered in both shapes: unprefixed (the
 * default language) and under every non-default prefix (`/mk/scripts/x`). A
 * study host is a site of its own, so a reader who chose Macedonian must not be
 * thrown back to English by following a link there.
 */
const STUDY_OWNED_PATHS = [
  '/scripts/:path*',
  '/subject/:path*',
  '/calendar',
  '/academic-setup',
  '/user/:username/:path*',
  '/user/:username',
]

/**
 * The study tree's sitemap handlers stay outside `[locale]`: a sitemap carries
 * every language's alternates in one entry, its URL is not one a reader picks a
 * language for, and a study host rewrites `/sitemap.xml` straight onto it. So
 * these map onto the tree without a locale segment.
 */
const STUDY_SITEMAP_PATHS = ['/sitemap/:path*']

/** The section name the sitemap index is served under — kept in step with
 * `lib/study-sitemap.ts`. */
const STUDY_SITEMAP_INDEX_SECTION = 'index'

/** Every non-default language, so the rules below are generated rather than
 * written twice. */
const NON_DEFAULT_LOCALES = LOCALES.filter(
  (locale) => locale !== DEFAULT_LOCALE
)

/**
 * The default language keeps the addresses it had before localization: an
 * unprefixed request is served by the `[locale]` tree as `en` without changing
 * the URL. The exclusion only decides what is rewritten — `mk` and `en` are
 * real segments, `_next` and `api` belong to the app, and a path carrying a
 * dot is a file. It runs last in `beforeFiles`, so a study host's own paths are
 * mapped first.
 */
const DEFAULT_LOCALE_REWRITE = [
  {
    source: '/:path((?!mk|en|api|_next|.*\\..*).*)',
    destination: '/en/:path*',
  },
]

/**
 * `/en/…` is the same page as the unprefixed address, which is the canonical
 * one, so the alias redirects rather than serving a second copy. The exact
 * `/en` rule is not redundant: a `:path*` that matches nothing produces an
 * empty `Location`.
 */
const DEFAULT_LOCALE_ALIAS = [
  { source: '/en', destination: '/', permanent: false },
  { source: '/en/:path*', destination: '/:path*', permanent: false },
]

/**
 * The remembered language sends a reader who enters at a root to the language
 * they last used. `scriptr-language` is a cookie, not just the `localStorage`
 * entry it used to be: a config redirect can only read a cookie, and the value
 * here is a preference, never authorisation.
 *
 * Two roots answer this: the catalog's, and a study host's — which now serves
 * `/mk/…` too, so sending a Macedonian reader to `/mk` lands on that study in
 * their language rather than on a 404 or on English.
 */
const LANGUAGE_PREFERENCE_REDIRECTS = NON_DEFAULT_LOCALES.flatMap((locale) => {
  const has = [
    { type: 'cookie' as const, key: 'scriptr-language', value: locale },
  ]

  return [
    {
      source: '/',
      has,
      missing: onStudyHost,
      destination: `/${locale}`,
      permanent: false,
    },
    {
      source: '/',
      has: [...onStudyHost, ...has],
      destination: `/${locale}`,
      permanent: false,
    },
  ]
})

/**
 * Paths that are the catalog's even when requested on a study host. `/user` is
 * exact on purpose: the signed-in reader's own account page is global, while
 * `/user/<name>` is that person's profile inside the study.
 */
const CATALOG_OWNED_PATHS = [
  '/user',
  '/search',
  '/start',
  '/auth/:path*',
  '/admin/:path*',
  '/university/:path*',
  '/professor/:path*',
]

/**
 * A calendar's period lives in the URL and every render links to two more, so a
 * crawler can walk it forever — each step a function invocation. Nothing in the
 * response is per-reader (notes, the session and preferences are client
 * islands), so a repeated address is served from the edge; only the rendered
 * period can be up to ten minutes old, never the data behind it, which is still
 * read once and invalidated by tag.
 */
const CALENDAR_CACHE_HEADERS = [
  {
    key: 'Vercel-CDN-Cache-Control',
    value: 'public, s-maxage=600, stale-while-revalidate=3600',
  },
]

/** Both shapes the calendar answers at: a study host before the rewrite, and the
 * study tree's own path on the catalog host. */
const CALENDAR_CACHE_ROUTES = [
  '/calendar',
  '/study/:siteSlug/calendar',
  ...NON_DEFAULT_LOCALES.flatMap((locale) => [
    `/${locale}/calendar`,
    `/${locale}/study/:siteSlug/calendar`,
  ]),
]

// Define base Next.js configuration with TypeScript types
const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
        port: '',
      },
      {
        protocol: 'https',
        hostname: '**.cloudflarestorage.com',
        port: '',
      },
      {
        protocol: 'https',
        hostname: 'files.scriptr.uk',
        port: '',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [480, 768, 810, 960, 1024, 1200, 1680],
    imageSizes: [16, 32, 48, 64, 96, 128],
    qualities: [65, 85, 91],
  },
  reactCompiler: true,

  async headers() {
    return CALENDAR_CACHE_ROUTES.map((source) => ({
      source,
      headers: CALENDAR_CACHE_HEADERS,
    }))
  },

  /**
   * One canonical address per study. The catalog path still answers — a link, a
   * bookmark or an API-minted href may carry it — but it redirects to the
   * study's own host, where the page is canonical.
   *
   * Redirects run before rewrites, so these win without ordering tricks. The
   * destination's `:label` is filled from the host pattern's named group.
   */
  async redirects() {
    if (!STUDY_HOSTS) {
      return [...LANGUAGE_PREFERENCE_REDIRECTS, ...DEFAULT_LOCALE_ALIAS]
    }

    return [
      ...LANGUAGE_PREFERENCE_REDIRECTS,
      ...DEFAULT_LOCALE_ALIAS,
      {
        source: '/study/:label/:path*',
        has: onOurHosts,
        destination: `${siteUrl.protocol}//:label.${SITE_HOST_WITH_PORT}/:path*`,
        permanent: true,
      },
      {
        source: '/study',
        has: onOurHosts,
        destination: SITE_ORIGIN,
        permanent: true,
      },
      // The same two addresses under a language prefix: the prefix survives the
      // hop, so `/mk/study/lbe` lands on the study's site in Macedonian.
      ...NON_DEFAULT_LOCALES.flatMap((locale) => [
        {
          source: `/${locale}/study/:label/:path*`,
          has: onOurHosts,
          destination: `${siteUrl.protocol}//:label.${SITE_HOST_WITH_PORT}/${locale}/:path*`,
          permanent: true,
        },
        {
          source: `/${locale}/study`,
          has: onOurHosts,
          destination: `${SITE_ORIGIN}/${locale}`,
          permanent: true,
        },
      ]),
      // A study host serves its study, not the rest of the platform: a catalog
      // page opened there belongs on the catalog host.
      //
      // `?_rsc=` is excluded on purpose. That is the router's own fetch, and a
      // cross-origin redirect of it is blocked by CORS — the link logged
      // "Cross-Origin Request Blocked … Status code: 307" and fell back to a
      // hard reload. A page request still redirects; the payload of a client
      // navigation is rendered here instead, and the next full load lands on
      // the catalog. Links the app renders are absolute catalog addresses
      // (`catalogUrl`), so the router does not fetch them through this host at
      // all; this is the safety net for a stored link, a bookmark or an
      // API-minted one.
      ...CATALOG_OWNED_PATHS.map((source) => ({
        source,
        has: onStudyHost,
        missing: [{ type: 'query' as const, key: '_rsc' }],
        destination: `${SITE_ORIGIN}${source}`,
        permanent: false,
      })),
      // A catalog page opened on a study host in a non-default language goes to
      // the same page on the catalog host, prefix and all.
      ...NON_DEFAULT_LOCALES.flatMap((locale) =>
        CATALOG_OWNED_PATHS.map((source) => ({
          source: `/${locale}${source}`,
          has: onStudyHost,
          missing: [{ type: 'query' as const, key: '_rsc' }],
          destination: `${SITE_ORIGIN}/${locale}${source}`,
          permanent: false,
        }))
      ),
    ]
  },

  /** A study host's own paths, served by the study tree without changing the
   * URL the reader sees. */
  async rewrites() {
    if (!STUDY_HOSTS) {
      return {
        beforeFiles: [...DEFAULT_LOCALE_REWRITE],
        afterFiles: [],
        fallback: [],
      }
    }

    return {
      beforeFiles: [
        {
          source: '/',
          has: onStudyHost,
          destination: `/${DEFAULT_LOCALE}/study/:label`,
        },
        // A study host's root in a non-default language: `/mk` serves the
        // study's overview in Macedonian, at that address.
        ...NON_DEFAULT_LOCALES.map((locale) => ({
          source: `/${locale}`,
          has: onStudyHost,
          destination: `/${locale}/study/:label`,
        })),
        // A study's sitemap index is served by the section handler under a
        // reserved name: `generateStaticParams` is ignored on a segment ending
        // in a dot (so `/sitemap.xml` cannot be the route), and an
        // extension-less route handler path is shadowed by the `[locale]`
        // catch-all. `index.xml` is neither.
        {
          source: '/sitemap.xml',
          has: onStudyHost,
          destination: `/study/:label/sitemap/${STUDY_SITEMAP_INDEX_SECTION}.xml`,
        },
        ...STUDY_OWNED_PATHS.map((source) => ({
          source,
          has: onStudyHost,
          destination: `/${DEFAULT_LOCALE}/study/:label${source}`,
        })),
        // The same paths under a language prefix, which is the shape a reader
        // in that language follows from a link the app renders.
        ...NON_DEFAULT_LOCALES.flatMap((locale) =>
          STUDY_OWNED_PATHS.map((source) => ({
            source: `/${locale}${source}`,
            has: onStudyHost,
            destination: `/${locale}/study/:label${source}`,
          }))
        ),
        ...STUDY_SITEMAP_PATHS.map((source) => ({
          source,
          has: onStudyHost,
          destination: `/study/:label${source}`,
        })),
        ...DEFAULT_LOCALE_REWRITE,
      ],
      afterFiles: [],
      fallback: [],
    }
  },
} satisfies NextConfig

const bundleAnalyzerConfig = withBundleAnalyzer(nextConfig)

export default bundleAnalyzerConfig
