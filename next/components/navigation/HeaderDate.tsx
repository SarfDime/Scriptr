'use client'

import { formatWeekdayDayMonth } from '@shared/utils/date-format.utils'
import { Text } from '@/components/typography/Text'
import { useLocale } from '@/providers/locale/LocaleProvider'
import { useUIStrings } from '@/providers/locale/use-strings'

/** The academic week a date falls in: week 1 starts on 1 October. */
const getAcademicWeek = (date: Date): number => {
  const academicYearStart = new Date(
    date.getFullYear() - (date.getMonth() < 9 ? 1 : 0),
    9,
    1
  )

  return (
    Math.floor(
      (date.getTime() - academicYearStart.getTime()) / (7 * 24 * 60 * 60 * 1000)
    ) + 1
  )
}

/**
 * The header's "now": the weekday and date, and the academic week they fall in.
 * The clock is the one part of the header that cannot be resolved on the server
 * — a Server Component would freeze it at build time on any prerendered page —
 * so it is this leaf, and the header around it stays a Server Component.
 *
 * The names come from the shared date tables rather than `Intl`: a browser
 * without Macedonian data fell back to English here, inside an otherwise
 * Macedonian header.
 */
export const HeaderDate = () => {
  const { locale } = useLocale()
  const strings = useUIStrings()
  const now = new Date()

  return (
    /* Suppressed: the label is "now", so a render that straddles midnight
       legitimately differs between the server and the client. */
    <Text
      className='ui-caption hidden lg:block capitalize'
      suppressHydrationWarning
    >
      {formatWeekdayDayMonth(now, locale)}{' '}
      <span className='mx-2 text-grey-400'>/</span>{' '}
      {strings.navigation.week(getAcademicWeek(now))}
    </Text>
  )
}
