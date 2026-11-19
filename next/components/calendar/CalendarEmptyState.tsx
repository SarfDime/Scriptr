import CalendarIcon from '@sanity/icons/Calendar'
import type { CalendarView } from '@shared/config/calendar'
import { CALENDAR_STRINGS_PACK } from '@shared/strings/calendar-strings'
import { NextLink } from '@/components/common/NextLink'
import { Text } from '@/components/typography/Text'
import { Title } from '@/components/typography/Title'
import { Card } from '@/components/ui/Card'
import { getServerStrings } from '@/lib/server-strings'

type CalendarEmptyStateProps = {
  period: CalendarView
  todayHref: string
}

/** The designed empty state: a period with nothing on it still says so, and
 * offers the way back to today. */
export const CalendarEmptyState = async ({
  period,
  todayHref,
}: CalendarEmptyStateProps) => {
  const strings = await getServerStrings(CALENDAR_STRINGS_PACK)

  return (
    <Card className='ui-stack items-center gap-3 text-center'>
      <CalendarIcon aria-hidden='true' className='size-8 text-fg-muted' />
      <Title as='h2' className='ui-title'>
        {strings.emptyTitle}
      </Title>
      <Text className='max-w-prose leading-relaxed text-fg-muted'>
        {strings.emptyDescription(period)}
      </Text>
      <NextLink href={todayHref} rel='nofollow' className='button solid'>
        {strings.emptyAction}
      </NextLink>
    </Card>
  )
}
