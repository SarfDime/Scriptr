import { CALENDAR_TYPE_SCHEMES } from '@shared/config/calendar'
import { CALENDAR_STRINGS_PACK } from '@shared/strings/calendar-strings'
import { Fragment } from 'react'
import { Box } from '@/components/common/Box'
import { NextLink } from '@/components/common/NextLink'
import { Text } from '@/components/typography/Text'
import { Title } from '@/components/typography/Title'
import { Badge } from '@/components/ui/Badge'
import { formatCalendarTime } from '@/lib/calendar'
import { cn } from '@/lib/common-utils'
import { getServerLocale, getServerStrings } from '@/lib/server-strings'
import type {
  CalendarEntityLink,
  CalendarEventViewModel,
} from '@/types/components/Calendar.types'
import {
  CalendarImportanceDot,
  calendarImportanceRing,
} from './CalendarImportanceDot'

/** A related entity with a page, or its name alone when it has none. */
const CalendarEntity = ({ link }: { link: CalendarEntityLink }) =>
  link.href ? (
    <NextLink
      href={link.href}
      className='text-brand-600 underline-offset-2 hover:underline'
    >
      {link.name}
    </NextLink>
  ) : (
    link.name
  )

/**
 * The readable form of one event: type, time, title, the description only when
 * Sanity has one, and the subject and professors as links when their pages
 * exist.
 */
export const CalendarEventDetails = async ({
  className,
  event,
}: {
  className?: string
  event: CalendarEventViewModel
}) => {
  const strings = await getServerStrings(CALENDAR_STRINGS_PACK)
  const locale = await getServerLocale()

  return (
    <Box as='article' className={cn('ui-stack gap-1.5', className)}>
      <Title as='h4' className='ui-large-caption md:ui-body-strong font-bold'>
        {event.title}
      </Title>

      {event.description && (
        <Text className='ui-label md:ui-large-caption font-normal text-fg-muted'>
          {event.description}
        </Text>
      )}

      {event.subject && (
        <Text as='p' className='ui-caption text-fg-muted mt-auto'>
          {strings.subjectLabel}: <CalendarEntity link={event.subject} />
        </Text>
      )}

      {event.professors.length > 0 && (
        <Text as='p' className='ui-caption text-fg-muted'>
          {strings.professorsLabel}:{' '}
          {event.professors.map((professor, index) => (
            <Fragment key={professor.id}>
              {index > 0 && ', '}
              <CalendarEntity link={professor} />
            </Fragment>
          ))}
        </Text>
      )}
      <Box className='ui-cluster gap-2 mt-1 ui-groove-t pt-2.5'>
        <Badge
          colorPalette={CALENDAR_TYPE_SCHEMES[event.type].chip}
          className={cn('gap-1', calendarImportanceRing(event.importance))}
        >
          <CalendarImportanceDot importance={event.importance} />
          {strings.eventType[event.type]}
        </Badge>
        <Text as='span' className='ui-caption text-fg-muted'>
          {formatCalendarTime(event.date, locale)}
        </Text>
      </Box>
    </Box>
  )
}
