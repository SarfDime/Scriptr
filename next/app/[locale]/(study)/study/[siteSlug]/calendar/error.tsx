'use client'

import { CALENDAR_STRINGS_PACK } from '@shared/strings/calendar-strings'
import { Button } from '@/components/common/Button'
import { ErrorState } from '@/components/ui/ErrorState'
import { useStrings } from '@/providers/locale/use-strings'

/** Route-level boundary for a study's `/calendar`: the calendar has its own copy, because
 * "the page could not be loaded" and "the calendar could not be read" are not
 * the same thing to a reader. The thrown message is never rendered — it is an
 * exception and can carry database or stack details. */
export default function CalendarError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const strings = useStrings(CALENDAR_STRINGS_PACK)

  return (
    <ErrorState
      title={strings.errorTitle}
      description={strings.errorDescription}
      action={
        <Button onClick={reset} className='button solid'>
          {strings.errorRetry}
        </Button>
      }
    />
  )
}
