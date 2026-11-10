'use client'

import { ADMIN_STRINGS } from '@shared/strings/admin-strings'
import type { DownloadReviewScript } from '@shared/types/download-review.types'
import { useState } from 'react'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { NextLink } from '@/components/common/NextLink'
import { Text } from '@/components/typography/Text'
import { getAcademicPath } from '@/lib/academic-routes'
import { convertDateToClientLocale } from '@/lib/common-utils'
import { DownloadReviewEvents } from './DownloadReviewEvents'

/** One script in the review: its volume split between signed-in accounts and
 * anonymous downloads, which is where inflation shows up. */
export const DownloadReviewScriptItem = ({
  script,
}: {
  script: DownloadReviewScript
}) => {
  const [open, setOpen] = useState(false)
  const name =
    script.title ?? script.slug ?? ADMIN_STRINGS.downloadReviewUnknownScript

  return (
    <Box as='article' className='ui-stack ui-above-inside h-full gap-3'>
      <Box className='ui-stack min-w-0 gap-0.5'>
        <Text className='ui-body-strong'>
          {script.slug ? (
            <NextLink
              href={getAcademicPath({
                type: 'script',
                scriptSlug: script.slug,
              })}
            >
              {name}
            </NextLink>
          ) : (
            name
          )}
        </Text>
      </Box>

      <Box className='ui-stack gap-1'>
        <Text className='ui-caption'>
          {ADMIN_STRINGS.downloadReviewEvents}: {script.events}
          {' · '}
          {ADMIN_STRINGS.downloadReviewAccountCount}: {script.accounts}
          {' · '}
          {ADMIN_STRINGS.downloadReviewAnonymous}: {script.anonymous}
        </Text>
        <Text className='ui-caption'>
          {ADMIN_STRINGS.downloadReviewAddresses}: {script.ip_addresses}
          {' · '}
          {ADMIN_STRINGS.downloadReviewDevices}: {script.devices}
        </Text>
        <Text className='ui-caption'>
          {ADMIN_STRINGS.downloadReviewLastDownload}:{' '}
          {convertDateToClientLocale(script.last_download_at)}
        </Text>
      </Box>

      <Button
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className='button button-sm subtle mt-auto w-fit'
      >
        {open
          ? ADMIN_STRINGS.downloadReviewHideEvents
          : ADMIN_STRINGS.downloadReviewShowEvents}
      </Button>

      {open && <DownloadReviewEvents scriptId={script.script_id} />}
    </Box>
  )
}
