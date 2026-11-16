'use client'

import CalendarIcon from '@sanity/icons/Calendar'
import CloseIcon from '@sanity/icons/Close'
import { CALENDAR_STRINGS_PACK } from '@shared/strings/calendar-strings'
import type { ResolvedStrings } from '@shared/types/localization.types'
import { useSyncExternalStore } from 'react'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { NextLink } from '@/components/common/NextLink'
import { Text } from '@/components/typography/Text'
import { Badge } from '@/components/ui/Badge'
import {
  calendarDayKey,
  currentCalendarDayKey,
  dayKeyDistance,
  matchesCalendarAlert,
} from '@/lib/calendar'
import {
  type CalendarDismissals,
  dismissCalendarEvents,
  getServerCalendarDismissals,
  readCalendarDismissals,
  subscribeToCalendarDismissals,
} from '@/lib/calendar-dismissals'
import { cn } from '@/lib/common-utils'
import { useStrings } from '@/providers/locale/use-strings'
import { useSession } from '@/providers/SessionProvider'
import type {
  CalendarAlertEvent,
  CalendarAlertSubject,
} from '@/types/components/Calendar.types'

const subscribeToMount = () => () => {
  // Mounting is a one-way trip; there is nothing to unsubscribe from.
}
const getMounted = () => true
const getServerMounted = () => false

/** `true` only after hydration, so the server render and the first client
 * render are identical — the badge and the preview need `Date.now()`, the
 * session and `localStorage`, none of which the server has. */
const useMounted = () =>
  useSyncExternalStore(subscribeToMount, getMounted, getServerMounted)

const isDismissed = (dismissals: CalendarDismissals, eventId: string) =>
  eventId in dismissals

type CalendarStrings = ResolvedStrings<typeof CALENDAR_STRINGS_PACK>

/** `today`, `tomorrow`, `in 2 days` — in `CALENDAR_TIME_ZONE` days. */
const describeWhen = (
  strings: CalendarStrings,
  todayKey: string,
  date: string
) => {
  const distance = dayKeyDistance(todayKey, calendarDayKey(date))

  if (distance <= 0) return strings.alert.today
  if (distance === 1) return strings.alert.tomorrow
  return strings.alert.inDays(distance)
}

type CalendarAlertProps = {
  className?: string
  /** The study's events, read on the server by the study layout. */
  events: Array<CalendarAlertEvent>
  /** That study's `/calendar`. */
  calendarHref: string
  /** The study's subjects, read on the server with the events: the alert needs
   * no catalog of its own to match an event or to name it. */
  subjects: Array<CalendarAlertSubject>
}

/**
 * The header's calendar link, its alert badge and the desktop preview.
 *
 * Matching happens here because it needs the session: an event counts when it
 * has no subject and is high importance (every signed-in reader, and every
 * signed-out one), or when its subject is one of this study's subjects the
 * reader has not completed. While the session is still loading only the global
 * branch applies, which is also what the server rendered.
 */
export const CalendarAlert = ({
  className,
  events,
  calendarHref,
  subjects,
}: CalendarAlertProps) => {
  const strings = useStrings(CALENDAR_STRINGS_PACK)
  const mounted = useMounted()
  const dismissals = useSyncExternalStore(
    subscribeToCalendarDismissals,
    readCalendarDismissals,
    getServerCalendarDismissals
  )
  const { session } = useSession()

  const user = session.status === 'authenticated' ? session.user : null

  const todayKey = currentCalendarDayKey()
  // The study's subjects minus the ones this reader has finished: the session
  // carries the reader's own statuses, the server the study's subject list.
  const uncompletedSubjectDbIds = user
    ? new Set(
        subjects.flatMap(({ dbId }) =>
          user.subjects.some(
            (subject) =>
              subject.subject_id === dbId && subject.status === 'completed'
          )
            ? []
            : [dbId]
        )
      )
    : null

  const matching = events.filter((event) =>
    matchesCalendarAlert(event, todayKey, uncompletedSubjectDbIds)
  )
  const pending = matching.filter((event) => !isDismissed(dismissals, event.id))
  const next = pending[0]
  // The badge counts everything that matches: dismissing hides the preview, not
  // the fact that there are events coming up.
  const count = mounted ? matching.length : 0

  const subjectName = next?.subjectDbId
    ? subjects.find((subject) => subject.dbId === next.subjectDbId)?.name
    : undefined
  const previewLabel =
    next &&
    (subjectName
      ? strings.alert.subjectEvent(
          strings.eventType[next.type],
          describeWhen(strings, todayKey, next.date),
          subjectName
        )
      : strings.alert.globalEvent(
          next.title,
          describeWhen(strings, todayKey, next.date)
        ))

  return (
    <Box className={cn('flex items-center gap-1.5', className)}>
      <NextLink
        href={calendarHref}
        aria-label={
          count > 0
            ? strings.alert.openCalendarWithAlerts(count)
            : strings.alert.openCalendar
        }
        className='button ghost relative p-2'
      >
        <CalendarIcon />
        {count > 0 && (
          <Badge
            className='absolute top-1 right-1 px-1.5 py-0 text-[10px]'
            colorPalette='cp-danger'
          >
            {count}
          </Badge>
        )}
      </NextLink>
      {mounted && next && previewLabel && (
        <NextLink
          href={calendarHref}
          className='button link hidden items-center gap-2 lg:flex'
        >
          <Text className='ui-caption font-semibold'>
            {strings.alert.previewWithMore(previewLabel, pending.length - 1)}
          </Text>
          <Button
            onClick={() => dismissCalendarEvents(matching)}
            aria-label={strings.alert.dismiss}
            className='button button-sm subtle p-0.5 rounded-lg'
          >
            <CloseIcon className='w-5 h-5 overwrite' />
          </Button>
        </NextLink>
      )}
    </Box>
  )
}
