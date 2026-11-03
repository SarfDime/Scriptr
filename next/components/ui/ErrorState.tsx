import type { ReactNode } from 'react'
import { Box } from '@/components/common/Box'
import { Text } from '@/components/typography/Text'
import { AstronautIllustration } from './AstronautIllustration'

type ErrorStateProps = {
  title: string
  description: string
  action?: ReactNode
}

/**
 * The shared error/not-found presentation: illustration, headline, one line of
 * copy and at most one action.
 *
 * Sizes are set here rather than through the `ui-*` classes: this is the only
 * screen of its kind, and the display scale was far too large for a short
 * centred message.
 *
 * A `<section>`, not a `<main>` — every route, including the framework's error
 * and not-found boundaries, renders inside the root layout's `MainLayout`,
 * which already owns the `main` landmark.
 */
export const ErrorState = ({ title, description, action }: ErrorStateProps) => (
  <Box
    as='section'
    className='ui-section ui-stack items-center gap-4 text-center'
  >
    <AstronautIllustration className='error-float h-32 w-auto max-w-full sm:h-40' />
    <Text className='text-balance text-2xl font-semibold leading-tight text-fg-700 sm:text-3xl'>
      {title}
    </Text>
    <Text className='max-w-prose text-base leading-relaxed text-fg-muted'>
      {description}
    </Text>
    {action}
  </Box>
)
