import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { NavBar } from '@/components/navigation/Navbar'
import { ThemeProvider } from '../providers/theme/ThemeProvider'

import './globals.css'
import { draftMode } from 'next/headers'
import { VisualEditing } from 'next-sanity/visual-editing'
import { DisableDraft } from '@/components/ui/DisableDraft'
import { isStaging } from '@/config/env'
import { getDraftMode } from '@/lib/common-utils'
import { SanityLive } from '@/sanity/lib/live'
import { fetchSanityData } from '@/sanity/lib/utils'
import { navMenuQuery } from '@/sanity/queries/nav.queries'
import type { NavMenuType } from '@/types/components/Nav.types'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
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

  return (
    <html lang='en' data-scroll-behavior='smooth'>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <NavBar {...navMenu} />
          {children}
        </ThemeProvider>
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
