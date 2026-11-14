import { CALENDAR_STRINGS_PACK } from '@shared/strings/calendar-strings'
import type { ReactNode } from 'react'
import { Box } from '@/components/common/Box'
import { PageLayout } from '@/components/layout/PageLayout'
import { Divider } from '@/components/ui/Divider'
import type { CalendarPageViewModel } from '@/types/components/Calendar.types'
import { CalendarDataNotice } from './CalendarDataNotice'
import { CalendarDayList } from './CalendarDayList'
import { CalendarEmptyState } from './CalendarEmptyState'
import { CalendarMonthGrid } from './CalendarMonthGrid'
import { CalendarToolbar } from './CalendarToolbar'
import { CalendarWeekView } from './CalendarWeekView'

/**
 * The whole `/calendar` page as a Server Component. Month view is a grid from
 * `lg` up (a populated day links to that day's week) and the day list below it;
 * week view is the week's days with their events as wrapping cards.
 *
 * The grid renders even when the period holds no events: an empty day is where
 * a note gets written, so hiding the calendar would hide the feature. The empty
 * state becomes a line above the grid instead of a replacement for it.
 */
export const CalendarScreen = (viewModel: CalendarPageViewModel) => {
  const {
    view,
    isAtToday,
    weeks,
    agendaDays,
    weekdayLabels,
    eventCount,
    dataRange,
    isOutsideData,
    links,
  } = viewModel

  // The small-screen month view lists the days that have something on them, so
  // an event-free month would leave nothing to write a note against. It falls
  // back to the period's own days, compactly, in that case.
  const periodDays = weeks
    .flatMap((week) => week.days)
    .filter((day) => day.inPeriod)
  const agenda = agendaDays.length > 0 ? agendaDays : periodDays

  let content: ReactNode
  if (view === 'month') {
    content = (
      <>
        <CalendarMonthGrid
          className='hidden lg:flex grow'
          weeks={weeks}
          weekdayLabels={weekdayLabels}
        />
        <CalendarDayList className='lg:hidden grow' days={agenda} />
      </>
    )
  } else {
    content = <CalendarWeekView days={weeks[0]?.days ?? []} />
  }

  return (
    <PageLayout
      header={{
        title: CALENDAR_STRINGS_PACK.pageTitle,
        subtitle: CALENDAR_STRINGS_PACK.pageSubtitle,
      }}
      className='min-h-full'
    >
      <Box className='ui-stack ui-above grow'>
        <CalendarToolbar
          view={view}
          isAtToday={isAtToday}
          periodLabel={viewModel.periodLabel}
          periodLabelShort={viewModel.periodLabelShort}
          links={links}
        />
        <Divider />

        {isOutsideData && <CalendarDataNotice dataRange={dataRange} />}

        {eventCount === 0 && !isOutsideData && (
          <CalendarEmptyState period={view} todayHref={links.today} />
        )}

        {content}
      </Box>
    </PageLayout>
  )
}
