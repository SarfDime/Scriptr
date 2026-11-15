import { cn } from '@/lib/common-utils'
import type { CalendarAlertData } from '@/types/components/Calendar.types'
import { Box, type BoxProps } from '../common/Box'
import { Header } from '../navigation/Header'
import { Footer } from './Footer'

export type MainLayoutProps = BoxProps & {
  /** Only the study tree passes these: a calendar belongs to a study, and its
   * layout is the only place that knows which one on the server. */
  calendarAlert?: CalendarAlertData
  /** Only the study tree passes this, for the same reason: the header's search
   * bar searches that study's scripts rather than the catalog. */
  studySiteSlug?: string | null
}

/**
 * The app's chrome: the header, the content column and the footer.
 *
 * Its own module rather than a second export of `PageLayout`: a page composes
 * the content layout, and keeping the two apart means composing one never pulls
 * the chrome into the same module. Both are Server Components — the clock in
 * the header and footer is their only client leaf (`HeaderDate`,
 * `FooterCopyright`).
 */
export const MainLayout = ({
  children,
  className,
  calendarAlert,
  studySiteSlug,
  ...rest
}: MainLayoutProps) => {
  return (
    <Box
      as='main'
      id='main'
      className={cn('ui-container flex flex-col', className)}
      {...rest}
    >
      <Header calendarAlert={calendarAlert} studySiteSlug={studySiteSlug} />
      {/* The container grows to full width while the navbar is collapsed (so the
          header spans the screen); page content keeps its docked-navbar width
          and is centered. `grow` pushes the footer to the bottom of short pages. */}
      <Box className='mx-auto w-full grow xl:max-w-(--nav-width-offset)'>
        {children}
      </Box>
      <Footer />
    </Box>
  )
}
