'use client'

import CalendarIcon from '@sanity/icons/Calendar'
import CloseIcon from '@sanity/icons/Close'
import { CALENDAR_STRINGS } from '@shared/strings/calendar-strings'
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
import { deriveIncompleteSubjectDbIds } from '@/lib/study-subjects'
import {
  EMPTY_ONBOARDING_CATALOG,
  useOnboardingCatalog,
} from '@/providers/onboarding/OnboardingProvider'
import { useSession } from '@/providers/SessionProvider'
import type { CalendarAlertEvent } from '@/types/components/Calendar.types'

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

/** `today`, `tomorrow`, `in 2 days` — in `CALENDAR_TIME_ZONE` days. */
const describeWhen = (todayKey: string, date: string) => {
  const distance = dayKeyDistance(todayKey, calendarDayKey(date))

  if (distance <= 0) return CALENDAR_STRINGS.alert.today
  if (distance === 1) return CALENDAR_STRINGS.alert.tomorrow
  return CALENDAR_STRINGS.alert.inDays(distance)
}

type CalendarAlertProps = {
  className?: string
  /** Build-time events from `getCalendarAlertEvents` — no user logic applied. */
  events: Array<CalendarAlertEvent>
}

/**
 * The header's calendar link, its alert badge and the desktop preview.
 *
 * Matching happens here because it needs the session: an event counts when it
 * has no subject and is high importance (every signed-in reader, and every
 * signed-out one), or when its subject is one of the subjects the reader's
 * studies include and has not completed. While the session is still loading
 * only the global branch applies, which is also what the server rendered.
 */
export const CalendarAlert = ({ className, events }: CalendarAlertProps) => {
  const mounted = useMounted()
  const dismissals = useSyncExternalStore(
    subscribeToCalendarDismissals,
    readCalendarDismissals,
    getServerCalendarDismissals
  )
  const { session } = useSession()

  const user = session.status === 'authenticated' ? session.user : null
  // Only a signed-in reader matches events against their own subjects, so only
  // they need the catalog; everyone else sees global events without it.
  const catalog =
    useOnboardingCatalog(Boolean(user)) ?? EMPTY_ONBOARDING_CATALOG
  const todayKey = currentCalendarDayKey()
  const uncompletedSubjectDbIds = user
    ? new Set(
        deriveIncompleteSubjectDbIds(
          catalog,
          user.selected_study_ids,
          user.subjects
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
    ? catalog.subjects.find((subject) => subject.dbId === next.subjectDbId)
        ?.name
    : undefined
  const previewLabel =
    next &&
    (subjectName
      ? CALENDAR_STRINGS.alert.subjectEvent(
          CALENDAR_STRINGS.eventType[next.type],
          describeWhen(todayKey, next.date),
          subjectName
        )
      : CALENDAR_STRINGS.alert.globalEvent(
          next.title,
          describeWhen(todayKey, next.date)
        ))

  return (
    <Box className={cn('flex items-center gap-1.5', className)}>
      <NextLink
        href='/calendar'
        aria-label={
          count > 0
            ? CALENDAR_STRINGS.alert.openCalendarWithAlerts(count)
            : CALENDAR_STRINGS.alert.openCalendar
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
          href='/calendar'
          className='button link hidden items-center gap-2 lg:flex'
        >
          <Text className='ui-caption font-semibold'>
            {CALENDAR_STRINGS.alert.previewWithMore(
              previewLabel,
              pending.length - 1
            )}
          </Text>
          <Button
            onClick={() => dismissCalendarEvents(matching)}
            aria-label={CALENDAR_STRINGS.alert.dismiss}
            className='button button-sm hollow p-0.5 rounded-lg'
          >
            <CloseIcon className='w-5 h-5 overwrite' />
          </Button>
        </NextLink>
      )}
    </Box>
  )
}
