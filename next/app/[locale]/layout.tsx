import { BRAND_COLORS, BRAND_OG_IMAGE } from '@shared/config/brand'
import { SANITY_CACHE_TAGS } from '@shared/config/cache-tags'
import { LOCALES, type LocaleId } from '@shared/config/localization-constants'
import { UI_STRINGS_PACK } from '@shared/config/strings'
import type { Metadata, Viewport } from 'next'
import { notFound } from 'next/navigation'
import { NavBar } from '@/components/navigation/Navbar'

import '../globals.css'
import type {
  WebsiteBackground,
  WebsiteSkybox,
} from '@shared/types/app-background.types'
import { NotificationsAside } from '@/components/notifications/NotificationsAside'
import { AppBackground } from '@/components/ui/app-background/AppBackground'
import { ToastContainer } from '@/components/ui/toast/ToastContainer'
import { fetchWebsiteSeoSettings, toOrigin } from '@/lib/academic-detail-page'
import { getPrerenderNow } from '@/lib/prerender-clock'
import { getServerStrings } from '@/lib/server-strings'
import { NavProvider } from '@/providers/nav/NavProvider'
import { fetchSanityData } from '@/sanity/lib/utils'
import { navMenuQuery, studyLogosQuery } from '@/sanity/queries/nav.queries'
import {
  websiteBackgroundQuery,
  websiteSkyboxQuery,
} from '@/sanity/queries/website.queries'
import type {
  NavMenuType,
  NavStudyLogoEntry,
  NavStudyLogos,
} from '@/types/components/Nav.types'
import { antiqueOlive, antiqueOliveCond, matter } from '../fonts/fonts'
import { Providers } from '../providers'

/**
 * Both languages, built ahead of time. Without this the `[locale]` segment is
 * dynamic and every page under it renders per request — the exact opposite of
 * the reason the locale is a route param.
 */
export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

const isLocaleId = (value: string): value is LocaleId =>
  LOCALES.includes(value as LocaleId)

/**
 * The browser chrome follows the brand, not the surface: the mark's own blue on
 * the light scheme and green on the dark one. The app also offers an explicit
 * theme toggle, which a `theme-color` media query cannot follow — it tracks the
 * system preference only.
 */
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: BRAND_COLORS.light.brand },
    { media: '(prefers-color-scheme: dark)', color: BRAND_COLORS.dark.brand },
  ],
}

/**
 * Site-level metadata, read from the `website` document like every page's own
 * metadata is — so the site name, the fallback description and the keyword list
 * have one source rather than being repeated here. `metadataBase` gives any
 * relative URL (an image, a canonical a route did not build itself) an origin;
 * `PageSEO` still emits absolute URLs of its own.
 */
export async function generateMetadata(): Promise<Metadata> {
  const [seo, UI_STRINGS] = await Promise.all([
    fetchWebsiteSeoSettings(),
    getServerStrings(UI_STRINGS_PACK),
  ])
  const siteName = seo.siteName ?? 'Scriptr'

  return {
    metadataBase: toOrigin(seo.siteUrl),
    title: seo.defaultSeoTitle ?? siteName,
    description: seo.defaultSeoDescription ?? UI_STRINGS.home.metaDescription,
    keywords: seo.defaultKeywords,
    applicationName: siteName,
    openGraph: {
      type: 'website',
      siteName,
      title: seo.defaultSeoTitle ?? siteName,
      description: seo.defaultSeoDescription ?? undefined,
      images: [{ ...BRAND_OG_IMAGE, alt: siteName }],
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.defaultSeoTitle ?? siteName,
      description: seo.defaultSeoDescription ?? undefined,
      images: [{ ...BRAND_OG_IMAGE, alt: siteName }],
    },
  }
}

/**
 * The app's root layout, and the only place `<html lang>` is owned: the
 * language is the first path segment, so it is known before anything renders
 * and every Server Component below can read it with `next/root-params`.
 */
export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode
  params: Promise<{ locale: string }>
}>) {
  const { locale } = await params
  if (!isLocaleId(locale)) notFound()

  const [navMenu, background, skybox, studyLogos, prerenderNow] =
    await Promise.all([
      fetchSanityData<NavMenuType>({
        query: navMenuQuery,
        locale,
        fetchOrigin: `navMenuQuery`,
        tags: [SANITY_CACHE_TAGS.navigation],
      }),
      fetchSanityData<WebsiteBackground>({
        query: websiteBackgroundQuery,
        fetchOrigin: `websiteBackgroundQuery(layout)`,
        tags: [SANITY_CACHE_TAGS.website],
      }),
      fetchSanityData<WebsiteSkybox>({
        query: websiteSkyboxQuery,
        fetchOrigin: `websiteSkyboxQuery(layout)`,
        tags: [SANITY_CACHE_TAGS.website],
      }),
      fetchSanityData<Array<NavStudyLogoEntry>>({
        query: studyLogosQuery,
        fetchOrigin: 'studyLogosQuery',
        tags: [SANITY_CACHE_TAGS.study],
      }),
      getPrerenderNow(),
    ])

  // The enrolled-studies list in the navbar carries Postgres rows, which have
  // no logo; the handle the row does carry is the key into this cached map.
  const studyLogosBySite: NavStudyLogos = Object.fromEntries(
    (studyLogos ?? []).flatMap(({ siteSlug, logo }) =>
      logo ? [[siteSlug, logo] as const] : []
    )
  )

  return (
    <html
      lang={locale}
      data-scroll-behavior='smooth'
      data-surface='ice'
      className={`${antiqueOlive.variable} ${antiqueOliveCond.variable} ${matter.variable} antialiased`}
    >
      <body>
        <Providers locale={locale} prerenderNow={prerenderNow}>
          <ToastContainer />
          <AppBackground background={background} skybox={skybox} />
          <NavProvider>
            <NavBar {...navMenu} studyLogos={studyLogosBySite} />
            {children}
          </NavProvider>
          <NotificationsAside />
        </Providers>
      </body>
    </html>
  )
}
