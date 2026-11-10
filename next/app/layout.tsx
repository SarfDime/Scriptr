import { SANITY_CACHE_TAGS } from '@shared/config/cache-tags'
import { UI_STRINGS } from '@shared/config/strings'
import type { Metadata } from 'next'
import { NavBar } from '@/components/navigation/Navbar'

import './globals.css'
import { NotificationsAside } from '@/components/notifications/NotificationsAside'
import { AppBackground } from '@/components/ui/AppBackground'
import type { StarCanvasSanityData } from '@/components/ui/StarCanvas'
import { ToastContainer } from '@/components/ui/toast/ToastContainer'
import { fetchWebsiteSeoSettings, toOrigin } from '@/lib/academic-detail-page'
import { NavProvider } from '@/providers/nav/NavProvider'
import { fetchSanityData } from '@/sanity/lib/utils'
import { navMenuQuery } from '@/sanity/queries/nav.queries'
import { starCanvasQuery } from '@/sanity/queries/website.queries'
import type { NavMenuType } from '@/types/components/Nav.types'
import { antiqueOlive, antiqueOliveCond, matter } from './fonts/fonts'
import { Providers } from './providers'

/**
 * Site-level metadata, read from the `website` document like every page's own
 * metadata is — so the site name, the fallback description and the keyword list
 * have one source rather than being repeated here. `metadataBase` gives any
 * relative URL (an image, a canonical a route did not build itself) an origin;
 * `PageSEO` still emits absolute URLs of its own.
 */
export async function generateMetadata(): Promise<Metadata> {
  const seo = await fetchWebsiteSeoSettings()
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
    },
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const navMenu = await fetchSanityData<NavMenuType>({
    query: navMenuQuery,
    fetchOrigin: `navMenuQuery`,
    tags: [SANITY_CACHE_TAGS.navigation],
  })
  const starCanvasConfig = await fetchSanityData<StarCanvasSanityData>({
    query: starCanvasQuery,
    fetchOrigin: `starCanvasConfig(layout)`,
    tags: [SANITY_CACHE_TAGS.website],
  })

  return (
    <html
      lang='en'
      data-scroll-behavior='smooth'
      className={`${antiqueOlive.variable} ${antiqueOliveCond.variable} ${matter.variable} antialiased`}
    >
      <body>
        <Providers>
          <ToastContainer />
          <AppBackground sanityData={starCanvasConfig} />
          <NavProvider>
            <NavBar {...navMenu} />
            {children}
          </NavProvider>
          <NotificationsAside />
        </Providers>
      </body>
    </html>
  )
}
