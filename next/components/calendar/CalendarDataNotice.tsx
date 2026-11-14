import InfoOutlineIcon from '@sanity/icons/InfoOutline'
import { CALENDAR_STRINGS_PACK } from '@shared/strings/calendar-strings'
import { Box } from '@/components/common/Box'
import { Text } from '@/components/typography/Text'
import { formatCalendarDay } from '@/lib/calendar'
import { getServerLocale, getServerStrings } from '@/lib/server-strings'
import type { CalendarPageViewModel } from '@/types/components/Calendar.types'

/**
 * Says why a period can be empty: the calendar document only holds the previous
 * and the next six months, so a month or week outside that range will never
 * fill in, however often it is revisited.
 */
export const CalendarDataNotice = async ({
  dataRange,
}: Pick<CalendarPageViewModel, 'dataRange'>) => {
  const strings = await getServerStrings(CALENDAR_STRINGS_PACK)
  const locale = await getServerLocale()

  return (
    <Box
      role='status'
      className='ui-cluster flex-nowrap items-start ui-above-inside gap-1'
    >
      <InfoOutlineIcon aria-hidden='true' className='shrink-0' />
      <Box className='ui-stack gap-0.5'>
        <Text className='ui-body-strong'>
          {dataRange ? strings.dataRangeNoticeTitle : strings.dataEmptyTitle}
        </Text>
        <Text className='ui-caption text-fg-muted'>
          {dataRange
            ? strings.dataRangeNotice(
                formatCalendarDay(dataRange.from, locale),
                formatCalendarDay(dataRange.to, locale)
              )
            : strings.dataEmptyNotice}
        </Text>
      </Box>
    </Box>
  )
}
