'use client'

import { UI_STRINGS } from '@shared/config/strings'
import { Button } from '@/components/common/Button'
import { ErrorState } from '@/components/ui/ErrorState'

/** Route-level boundary for a script page. The thrown message is not rendered:
 * it is an exception, not copy, and may carry database or stack details. */
export default function ScriptError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <ErrorState
      title={UI_STRINGS.scripts.detail.errorTitle}
      description={UI_STRINGS.scripts.detail.errorFallback}
      action={
        <Button onClick={reset} className='button solid'>
          {UI_STRINGS.scripts.detail.errorRetry}
        </Button>
      }
    />
  )
}
