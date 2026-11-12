'use client'

import { DOWNLOAD_REVIEW_EVENT_PAGE_SIZE } from '@shared/config/shared-constants'
import { ADMIN_STRINGS } from '@shared/strings/admin-strings'
import type { DownloadReviewEventsResponse } from '@shared/types/download-review.types'
import { getScriptSitePath } from '@shared/utils/site-paths'
import { useEffect, useState } from 'react'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { NextLink } from '@/components/common/NextLink'
import { Text } from '@/components/typography/Text'
import { getDownloadReviewEvents } from '@/lib/api/download-review-api'
import { studyUrlFromPath } from '@/lib/study-origin'

/** Events are reviewed for bursts, so the list needs the time of day, unlike
 * the date-only formatter the admin cards use. */
const formatEventTime = (value: string) =>
  new Date(value).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

/** The individual downloads behind one account or one script, newest first,
 * one page at a time. Rendered only while its row is expanded, so it reads
 * them on mount. */
export const DownloadReviewEvents = ({
  scriptId,
  profileId,
  study,
}: {
  scriptId?: string
  profileId?: string
  study: string | null
}) => {
  const [page, setPage] = useState<DownloadReviewEventsResponse | null>(null)
  const [failed, setFailed] = useState(false)
  // The generation only makes a new object, which re-runs the read below —
  // that is how the retry button repeats a request for the same offset.
  const [request, setRequest] = useState({ offset: 0, generation: 0 })
  const offset = request.offset

  useEffect(() => {
    let active = true

    getDownloadReviewEvents({
      script_id: scriptId,
      user_id: profileId,
      limit: DOWNLOAD_REVIEW_EVENT_PAGE_SIZE,
      offset: request.offset,
      study,
    })
      .then((result) => {
        if (!active) return
        setPage(result)
        setFailed(false)
      })
      .catch(() => {
        if (active) setFailed(true)
      })

    return () => {
      active = false
    }
  }, [scriptId, profileId, study, request])

  if (failed) {
    return (
      <Box className='ui-cluster gap-2'>
        <Text role='alert' className='text-error-red ui-caption'>
          {ADMIN_STRINGS.downloadReviewEventsError}
        </Text>
        <Button
          onClick={() => {
            setFailed(false)
            setRequest((current) => ({
              ...current,
              generation: current.generation + 1,
            }))
          }}
          className='button button-sm subtle'
        >
          {ADMIN_STRINGS.retry}
        </Button>
      </Box>
    )
  }

  const loading = page?.offset !== offset
  if (loading || !page) {
    return (
      <Text aria-busy='true' className='ui-caption'>
        {ADMIN_STRINGS.downloadReviewLoadingEvents}
      </Text>
    )
  }

  if (page.total === 0) {
    return (
      <Text className='ui-caption'>{ADMIN_STRINGS.downloadReviewNoEvents}</Text>
    )
  }

  const hasPrevious = offset > 0
  const hasNext = offset + page.events.length < page.total

  return (
    <Box className='ui-stack gap-2'>
      <Box as='ul' className='ui-stack gap-2'>
        {page.events.map((event) => (
          <Box as='li' key={event.id} className='ui-stack gap-0.5'>
            <Text className='ui-caption'>
              {formatEventTime(event.created_at)}
              {' · '}
              {ADMIN_STRINGS.downloadReviewIdentityNames[event.identity]}
            </Text>
            <Text className='ui-caption'>
              {event.username ? (
                <NextLink href={`/user/${event.username}`}>
                  @{event.username}
                </NextLink>
              ) : (
                ADMIN_STRINGS.downloadReviewAnonymousAccount
              )}
              {' · '}
              {event.script_slug ? (
                <NextLink
                  href={studyUrlFromPath(
                    getScriptSitePath({
                      siteSlug: event.script_site_slug,
                      slug: event.script_slug,
                    })
                  )}
                >
                  {event.script_title || event.script_slug}
                </NextLink>
              ) : (
                ADMIN_STRINGS.downloadReviewUnknownScript
              )}
            </Text>
            <Text className='ui-caption'>
              {ADMIN_STRINGS.downloadReviewAddresses}: {event.ip_address ?? '—'}
              {' · '}
              {ADMIN_STRINGS.downloadReviewDevices}: {event.device_id ?? '—'}
            </Text>
          </Box>
        ))}
      </Box>

      <Box className='ui-cluster items-center justify-between gap-2'>
        <Text className='ui-caption'>
          {ADMIN_STRINGS.usersPageRange(
            offset + 1,
            offset + page.events.length,
            page.total
          )}
        </Text>
        <Box className='ui-cluster gap-2'>
          <Button
            onClick={() =>
              setRequest((current) => ({
                offset: Math.max(
                  current.offset - DOWNLOAD_REVIEW_EVENT_PAGE_SIZE,
                  0
                ),
                generation: current.generation + 1,
              }))
            }
            disabled={!hasPrevious}
            className='button button-sm subtle'
          >
            {ADMIN_STRINGS.usersPreviousPage}
          </Button>
          <Button
            onClick={() =>
              setRequest((current) => ({
                offset: current.offset + DOWNLOAD_REVIEW_EVENT_PAGE_SIZE,
                generation: current.generation + 1,
              }))
            }
            disabled={!hasNext}
            className='button button-sm subtle'
          >
            {ADMIN_STRINGS.usersNextPage}
          </Button>
        </Box>
      </Box>
    </Box>
  )
}
