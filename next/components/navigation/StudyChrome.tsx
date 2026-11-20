import { getStudyCalendarAlert } from '@/lib/calendar-alert'
import { CalendarAlert } from './CalendarAlert'
import { HeaderSearch } from './HeaderSearch'

/** The study a header belongs to, as the layout hands it down: the handle is a
 * route param, and the layout itself must not wait for it — that would tie the
 * whole study tree's shell to one URL. */
export type StudySiteParams = Promise<{ siteSlug: string }>

/**
 * The header's calendar alert for one study. A leaf, because it needs the
 * handle: inside the layout it would block every page below.
 */
export const StudyCalendarAlert = async ({
  params,
  className,
}: {
  params: StudySiteParams
  className?: string
}) => {
  const { siteSlug } = await params
  const alert = await getStudyCalendarAlert(siteSlug)

  return <CalendarAlert className={className} {...alert} />
}

/** The header's search bar, scoped to this study. A leaf for the same reason;
 * it holds no client state of its own before hydration, so hydrating it after
 * the rest of the header is harmless. */
export const StudySearch = async ({ params }: { params: StudySiteParams }) => {
  const { siteSlug } = await params

  return <HeaderSearch studySiteSlug={siteSlug} />
}
