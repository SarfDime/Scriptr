'use client'

import type { RatingTargetType } from '@shared/config/api'
import { UI_STRINGS } from '@shared/config/strings'
import { RATING_STRINGS } from '@shared/strings/ratings-strings'
import type { RatingTarget } from '@shared/types/ratings.types'
import { useId } from 'react'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { Text } from '@/components/typography/Text'
import { Skeleton } from '@/components/ui/skeleton/Skeleton'
import { useRatings } from '@/hooks/useRatings'
import { cn } from '@/lib/common-utils'
import { useAuthModal } from '@/providers/AuthModalProvider'
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
      <Text id={headingId} className='ui-label'>
        {RATING_STRINGS.title}
      </Text>

      {catalog.status === 'loading' && (
        // Rows, not a one-line message: the loaded block is a row per criterion,
        // so announcing it in the space of one line made the card below jump
        // when the catalog arrived. The viewer slot is reserved here too, since
        // it is part of the loaded block's height.
        <>
          <Box className='min-h-[1.625rem]'>
            <Text className='sr-only' role='status'>
              {RATING_STRINGS.loading}
            </Text>
          </Box>
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
            {RATING_STRINGS.loadError}
          </Text>
          <Button className='button button-sm subtle' onClick={retryCatalog}>
            {RATING_STRINGS.retry}
          </Button>
        </Box>
      )}

      {catalog.status === 'loaded' && catalog.types.length === 0 && (
        <Text className='ui-caption'>{RATING_STRINGS.empty}</Text>
      )}

      {catalog.status === 'loaded' && catalog.types.length > 0 && (
        <>
          {/* One slot for whatever the viewer state has to say — the prompt
           * for a guest, the check while the session resolves, nothing for a
           * member — held at the prompt's height so the rows below (and the
           * card under this one) do not move when it resolves. */}
          <Box className='min-h-6.5'>
            {viewer.status === 'guest' && (
              <Box className='ui-cluster gap-2'>
                <Text className='ui-caption'>
                  {RATING_STRINGS.signInPrompt}
                </Text>
                <Button
                  className='button button-sm subtle'
                  onClick={() => openAuthModal()}
                >
                  {RATING_STRINGS.signIn}
                </Button>
              </Box>
            )}
            {viewer.status === 'checking' && (
              <Text className='ui-caption' role='status'>
                {RATING_STRINGS.checkingAccess}
              </Text>
            )}
            {viewer.status === 'error' && (
              <Box className='ui-cluster gap-2'>
                <Text className='ui-caption' role='alert'>
                  {RATING_STRINGS.loadMineError}
                </Text>
                <Button
                  className='button button-sm subtle'
                  onClick={retryViewer}
                >
                  {RATING_STRINGS.retry}
                </Button>
              </Box>
            )}
          </Box>
          {restricted && (
            <Text className='ui-caption' role='note'>
              {UI_STRINGS.general.restrictedAction}
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
