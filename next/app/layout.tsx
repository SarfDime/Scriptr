import type { Metadata } from 'next'
import { Bricolage_Grotesque } from 'next/font/google'
import localFont from 'next/font/local'
import { NavBar } from '@/components/navigation/Navbar'

import './globals.css'
import { draftMode } from 'next/headers'
import { VisualEditing } from 'next-sanity/visual-editing'
import { MainLayout } from '@/components/layout/PageLayout'
import { NotificationsAside } from '@/components/notifications/NotificationsAside'
import { OnboardingModal } from '@/components/onboarding/OnboardingModal'
import { AppBackground } from '@/components/ui/AppBackground'
import { DisableDraft } from '@/components/ui/DisableDraft'
import type { StarCanvasSanityData } from '@/components/ui/StarCanvas'
import { ToastContainer } from '@/components/ui/toast/ToastContainer'
import { isStaging } from '@/config/env'
import { getDraftMode } from '@/lib/common-utils'
import { NavProvider } from '@/providers/nav/NavProvider'
import { SanityLive } from '@/sanity/lib/live'
import { fetchSanityData } from '@/sanity/lib/utils'
import { navMenuQuery } from '@/sanity/queries/nav.queries'
import { onboardingCatalogQuery } from '@/sanity/queries/onboarding.queries'
import { starCanvasQuery } from '@/sanity/queries/website.queries'
import type { NavMenuType } from '@/types/components/Nav.types'
import type { OnboardingCatalog } from '@/types/onboarding.types'
import { Providers } from './providers'

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-bricolage',
  // axes: ['wdth', 'opsz'],
})

// 1. Matter - Standard geometric font with straightforward weights
const matter = localFont({
  src: [
    { path: './fonts/Matter-Light.woff2', weight: '300', style: 'normal' },
    {
      path: './fonts/Matter-LightItalic.woff2',
      weight: '300',
      style: 'italic',
    },
    { path: './fonts/Matter-Regular.woff2', weight: '400', style: 'normal' },
    {
      path: './fonts/Matter-RegularItalic.woff2',
      weight: '400',
      style: 'italic',
    },
    { path: './fonts/Matter-Medium.woff2', weight: '500', style: 'normal' },
    {
      path: './fonts/Matter-MediumItalic.woff2',
      weight: '500',
      style: 'italic',
    },
    { path: './fonts/Matter-SemiBold.woff2', weight: '600', style: 'normal' },
    {
      path: './fonts/Matter-SemiBoldItalic.woff2',
      weight: '600',
      style: 'italic',
    },
    { path: './fonts/Matter-Bold.woff2', weight: '700', style: 'normal' },
    { path: './fonts/Matter-BoldItalic.woff2', weight: '700', style: 'italic' },
    { path: './fonts/Matter-Heavy.woff2', weight: '900', style: 'normal' },
    {
      path: './fonts/Matter-HeavyItalic.woff2',
      weight: '900',
      style: 'italic',
    },
  ],
  variable: '--font-matter',
  display: 'swap',
})

// 2. Antique Olive - Main Family
const antiqueOlive = localFont({
  src: [
    {
      path: './fonts/AntiqueOliveStd-Light.woff2',
      weight: '300',
      style: 'normal',
    },
    {
      path: './fonts/AntiqueOliveStd-Roman.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: './fonts/AntiqueOliveStd-Italic.woff2',
      weight: '400',
      style: 'italic',
    },
    {
      path: './fonts/AntiqueOliveStd-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
    // Compact is narrower and heavier than Bold, lighter than Black
    {
      path: './fonts/AntiqueOliveStd-Compact.woff2',
      weight: '800',
      style: 'normal',
    },
    {
      path: './fonts/AntiqueOliveStd-Black.woff2',
      weight: '900',
      style: 'normal',
    },
    // Nord is the ultra-bold, wide display cut of Antique Olive
    {
      path: './fonts/AntiqueOliveStd-Nord.woff2',
      weight: '950',
      style: 'normal',
    },
    {
      path: './fonts/AntiqueOliveStd-NordItalic.woff2',
      weight: '950',
      style: 'italic',
    },
  ],
  variable: '--font-antique-olive',
  display: 'swap',
})

// 3. Antique Olive Condensed (Separated so it doesn't conflict with standard Bold)
const antiqueOliveCond = localFont({
  src: [
    {
      path: './fonts/AntiqueOliveStd-BoldCond.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-antique-olive-cond',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Scriptr',
  description: 'A platform for students to share and discover study materials.',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const navMenu = await fetchSanityData<NavMenuType>({
    query: navMenuQuery,
    fetchOrigin: `navMenuQuery`,
  })
  const isDraft = await getDraftMode(draftMode)

  const catalog = await fetchSanityData<OnboardingCatalog>({
    query: onboardingCatalogQuery,
    fetchOrigin: `onboardingCatalog(layout)`,
  })

  const starCanvasConfig = await fetchSanityData<StarCanvasSanityData>({
    query: starCanvasQuery,
    fetchOrigin: `starCanvasConfig(layout)`,
  })

  return (
    <html
      lang='en'
      data-scroll-behavior='smooth'
      className={`${antiqueOlive.variable} ${antiqueOliveCond.variable} ${matter.variable} ${bricolage.variable} antialiased`}
    >
      <body>
        <Providers catalog={catalog}>
          <ToastContainer />
          <AppBackground sanityData={starCanvasConfig} />
          <NavProvider>
            <NavBar {...navMenu} />
            <MainLayout>{children}</MainLayout>
          </NavProvider>
          <NotificationsAside />
          <OnboardingModal catalog={catalog} />
        </Providers>
        {isStaging && <SanityLive />}
        {isDraft && isStaging && (
          <>
            <VisualEditing />
            <DisableDraft />
          </>
        )}
      </body>
    </html>
  )
}
