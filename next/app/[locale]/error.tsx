'use client'

import { Button } from '@/components/common/Button'
import { ErrorState } from '@/components/ui/ErrorState'
import { useUIStrings } from '@/providers/locale/use-strings'

/** Route-level error boundary. The message is deliberately generic: `error` is
 * an exception, and its text can carry database or stack details. What the
 * reader needs is a way to retry, which re-renders the failed segment. */
export default function RouteError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const UI_STRINGS = useUIStrings()

  return (
    <ErrorState
      title={UI_STRINGS.general.unexpectedError}
      description={UI_STRINGS.general.errors.description}
      action={
        <Button onClick={reset} className='button solid'>
          {UI_STRINGS.general.errors.retry}
        </Button>
      }
    />
  )
}
