'use client'

import { UI_STRINGS } from '@shared/config/strings'
import { RATING_STRINGS } from '@shared/strings/ratings-strings'
import type { RatingTarget } from '@shared/types/ratings.types'
import { useId } from 'react'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { Text } from '@/components/typography/Text'
import { useRatings } from '@/hooks/useRatings'
import { useAuthModal } from '@/providers/AuthModalProvider'
import { RatingCriterionRow } from './RatingCriterionRow'

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
        <Text className='ui-caption' role='status'>
          {RATING_STRINGS.loading}
        </Text>
      )}

      {catalog.status === 'error' && (
        <Box className='ui-cluster items-center gap-2'>
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
          {viewer.status === 'guest' && (
            <Box className='ui-cluster items-center gap-2'>
              <Text className='ui-caption'>{RATING_STRINGS.signInPrompt}</Text>
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
            <Box className='ui-cluster items-center gap-2'>
              <Text className='ui-caption' role='alert'>
                {RATING_STRINGS.loadMineError}
              </Text>
              <Button className='button button-sm subtle' onClick={retryViewer}>
                {RATING_STRINGS.retry}
              </Button>
            </Box>
          )}
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
