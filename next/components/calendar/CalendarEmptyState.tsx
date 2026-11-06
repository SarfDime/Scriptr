import CalendarIcon from '@sanity/icons/Calendar'
import type { CalendarView } from '@shared/config/calendar'
import { CALENDAR_STRINGS } from '@shared/strings/calendar-strings'
import { NextLink } from '@/components/common/NextLink'
import { Text } from '@/components/typography/Text'
import { Title } from '@/components/typography/Title'
import { Card } from '@/components/ui/Card'

type CalendarEmptyStateProps = {
  period: CalendarView
  todayHref: string
}

/** The designed empty state: a period with nothing on it still says so, and
 * offers the way back to today. */
export const CalendarEmptyState = ({
  period,
  todayHref,
}: CalendarEmptyStateProps) => (
  <Card className='ui-stack items-center gap-3 text-center'>
    <CalendarIcon aria-hidden='true' className='size-8 text-fg-muted' />
    <Title as='h2' className='ui-title'>
      {CALENDAR_STRINGS.emptyTitle}
    </Title>
    <Text className='max-w-prose leading-relaxed text-fg-muted'>
      {CALENDAR_STRINGS.emptyDescription(period)}
    </Text>
    <NextLink href={todayHref} className='button solid'>
      {CALENDAR_STRINGS.emptyAction}
    </NextLink>
  </Card>
)
