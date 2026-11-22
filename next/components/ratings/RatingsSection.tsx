'use client'

import type { RatingTargetType } from '@shared/config/api'
import { RATING_STRINGS_PACK } from '@shared/strings/ratings-strings'
import type { RatingTarget } from '@shared/types/ratings.types'
import { useId } from 'react'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { Text } from '@/components/typography/Text'
import { Skeleton } from '@/components/ui/skeleton/Skeleton'
import { useRatings } from '@/hooks/useRatings'
import { cn } from '@/lib/common-utils'
import { useAuthModal } from '@/providers/AuthModalProvider'
import { useStrings, useUIStrings } from '@/providers/locale/use-strings'
import { RatingCriterionRow } from './RatingCriterionRow'

/**
 * Rows reserved while the catalog loads. The criteria are admin-defined rows in
 * `rating_types` (three for a professor, two for a subject today), and the
 * block's own height is what pushes the card below it, so the placeholder has
 * to match them; a criterion added in the admin UI costs one row of drift until
 * this map is updated. It reserves space only — the rows themselves still come
 * from the API.
 */
const RATING_PLACEHOLDER_ROWS: Record<RatingTargetType, number> = {
  professor: 3,
  subject: 2,
}

/** The height the loaded list occupies, measured in the card it renders in:
 * 116px for a professor (one long label wraps onto a second line) and 54px for
 * a subject. A placeholder cannot know which label wraps, so the list holds at
 * least the loaded height instead of trying to draw it. */
const RATING_PLACEHOLDER_MIN_HEIGHT: Record<RatingTargetType, string> = {
  professor: 'min-h-[7.25rem]',
  subject: 'min-h-[3.375rem]',
}

/**
 * Compact ratings block meant to sit inside a host card (the professor's About
 * card, the subject's details card). Criteria come from the API
 * (`rating_types`), never from a hardcoded list. The host page stays static:
 * everything here loads in the browser. Pass a database id, not a slug, and
 * render with `key={targetId}` (see useRatings).
 */
export function RatingsSection({ targetType, targetId }: RatingTarget) {
  const headingId = useId()
  const ui = useUIStrings()
  const strings = useStrings(RATING_STRINGS_PACK)
  const { open: openAuthModal } = useAuthModal()
  const { catalog, viewer, retryCatalog, retryViewer, setScore } = useRatings({
    targetType,
    targetId,
  })

  const target: RatingTarget = { targetType, targetId }
  const canRate = viewer.status === 'member'
  const restricted = viewer.status === 'member' && viewer.restricted

  return (
    <Box
      as='section'
      aria-labelledby={headingId}
      aria-busy={catalog.status === 'loading' || undefined}
      className='ui-stack gap-2'
    >
      {/* The viewer state sits at the far end of the heading row and wraps under
       * the heading when the card is too narrow for both, so neither line costs
       * the rows below any height of their own. */}
      <Box className='ui-cluster justify-between gap-x-3 gap-y-1'>
        <Text id={headingId} className='ui-title-modern'>
          {strings.title}
        </Text>
        {catalog.status === 'loaded' && catalog.types.length > 0 && (
          <>
            {viewer.status === 'guest' && (
              <Box className='ui-cluster gap-2'>
                <Text className='ui-caption'>{strings.signInPrompt}</Text>
                <Button
                  className='button button-sm subtle'
                  onClick={() => openAuthModal()}
                >
                  {strings.signIn}
                </Button>
              </Box>
            )}
            {viewer.status === 'checking' && (
              <Text className='ui-caption' role='status'>
                {strings.checkingAccess}
              </Text>
            )}
          </>
        )}
      </Box>

      {catalog.status === 'loading' && (
        // Rows, not a one-line message: the loaded block is a row per criterion,
        // so announcing it in the space of one line made the card below jump
        // when the catalog arrived.
        <>
          <Text className='sr-only' role='status'>
            {strings.loading}
          </Text>
          <Box
            as='ul'
            className={cn(
              'ui-stack gap-1.5',
              RATING_PLACEHOLDER_MIN_HEIGHT[targetType]
            )}
            aria-busy
          >
            {Array.from(
              { length: RATING_PLACEHOLDER_ROWS[targetType] },
              (_, index) => (
                // Full width, and the height of a real row (24px): two bars
                // wrapped onto two lines in the narrow card and over-reserved.
                <Box as='li' key={index}>
                  <Skeleton loading className='h-6 w-full' />
                </Box>
              )
            )}
          </Box>
        </>
      )}

      {catalog.status === 'error' && (
        <Box className='ui-cluster gap-2'>
          <Text className='ui-caption' role='alert'>
            {strings.loadError}
          </Text>
          <Button className='button button-sm subtle' onClick={retryCatalog}>
            {strings.retry}
          </Button>
        </Box>
      )}

      {catalog.status === 'loaded' && catalog.types.length === 0 && (
        <Text className='ui-caption'>{strings.empty}</Text>
      )}

      {catalog.status === 'loaded' && catalog.types.length > 0 && (
        <>
          {/* A failed "my ratings" read keeps its own line — it carries a retry
           * and should not sit inside the heading row. */}
          {viewer.status === 'error' && (
            <Box className='ui-cluster gap-2'>
              <Text className='ui-caption' role='alert'>
                {strings.loadMineError}
              </Text>
              <Button className='button button-sm subtle' onClick={retryViewer}>
                {strings.retry}
              </Button>
            </Box>
          )}
          {restricted && (
            <Text className='ui-caption' role='note'>
              {ui.general.restrictedAction}
            </Text>
          )}

          <Box as='ul' className='ui-stack gap-1.5'>
            {catalog.types.map((ratingType) => (
              <RatingCriterionRow
                key={ratingType.id}
                target={target}
                ratingType={ratingType}
                stat={catalog.stats.find(
                  (stat) => stat.rating_type_id === ratingType.id
                )}
                canRate={canRate}
                restricted={restricted}
                myScore={
                  viewer.status === 'member'
                    ? viewer.scores[ratingType.id]
                    : undefined
                }
                onScoreChange={setScore}
              />
            ))}
          </Box>
        </>
      )}
    </Box>
  )
}
