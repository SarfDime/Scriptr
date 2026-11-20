import { cn } from '@/lib/common-utils'
import { Box, type BoxProps } from '../common/Box'
import { Header } from '../navigation/Header'
import type { StudySiteParams } from '../navigation/StudyChrome'
import { Footer } from './Footer'

export type MainLayoutProps = BoxProps & {
  /** Only the study tree passes this: a calendar belongs to a study and its
   * search bar searches that study's scripts. It arrives as a promise so this
   * frame is prerendered before the handle is known; the header resolves the
   * two parts that need it in their own boundaries. */
  studySiteParams?: StudySiteParams
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
  studySiteParams,
  ...rest
}: MainLayoutProps) => {
  return (
    <Box
      as='main'
      id='main'
      className={cn('ui-container flex flex-col', className)}
      {...rest}
    >
      <Header studySiteParams={studySiteParams} />
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
