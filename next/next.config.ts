import bundleAnalyzer from '@next/bundle-analyzer'
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
 * `/study/[siteSlug]/scripts/[scriptSlug]` with the URL unchanged.
 */
const STUDY_OWNED_PATHS = [
  '/scripts/:path*',
  '/subject/:path*',
  '/calendar',
  '/academic-setup',
  '/sitemap.xml',
  '/sitemap/:path*',
  '/user/:username/:path*',
  '/user/:username',
]

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

  /**
   * One canonical address per study. The catalog path still answers — a link, a
   * bookmark or an API-minted href may carry it — but it redirects to the
   * study's own host, where the page is canonical.
   *
   * Redirects run before rewrites, so these win without ordering tricks. The
   * destination's `:label` is filled from the host pattern's named group.
   */
  async redirects() {
    return [
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
      // A study host serves its study, not the rest of the platform: a catalog
      // page opened there belongs on the catalog host.
      ...CATALOG_OWNED_PATHS.map((source) => ({
        source,
        has: onStudyHost,
        destination: `${SITE_ORIGIN}${source}`,
        permanent: false,
      })),
    ]
  },

  /** A study host's own paths, served by the study tree without changing the
   * URL the reader sees. */
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/',
          has: onStudyHost,
          destination: '/study/:label',
        },
        ...STUDY_OWNED_PATHS.map((source) => ({
          source,
          has: onStudyHost,
          destination: `/study/:label${source}`,
        })),
      ],
      afterFiles: [],
      fallback: [],
    }
  },
} satisfies NextConfig

const bundleAnalyzerConfig = withBundleAnalyzer(nextConfig)

export default bundleAnalyzerConfig
