'use client'

import { ADMIN_STRINGS } from '@shared/strings/admin-strings'
import type { DownloadReviewAccount } from '@shared/types/download-review.types'
import { useState } from 'react'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { NextLink } from '@/components/common/NextLink'
import { Text } from '@/components/typography/Text'
import { convertDateToClientLocale } from '@/lib/common-utils'
import { DownloadReviewEvents } from './DownloadReviewEvents'

/** One account in the review: how much it downloaded and how many scripts,
 * addresses and devices that came from, with its events one click away. */
export const DownloadReviewAccountItem = ({
  account,
  study,
}: {
  account: DownloadReviewAccount
  study: string | null
}) => {
  const [open, setOpen] = useState(false)
  const name =
    account.full_name ?? account.username ?? ADMIN_STRINGS.unknownUser

  return (
    <Box as='article' className='ui-stack ui-above-inside h-full gap-3'>
      <Box className='ui-stack min-w-0 gap-0.5'>
        <Text className='ui-body-strong'>
          {account.username ? (
            <NextLink href={`/user/${account.username}`}>{name}</NextLink>
          ) : (
            name
          )}
        </Text>
        {account.username && (
          <Text className='ui-caption'>@{account.username}</Text>
        )}
      </Box>

      <Box className='ui-stack gap-1'>
        <Text className='ui-caption'>
          {ADMIN_STRINGS.downloadReviewEvents}: {account.events}
          {' · '}
          {ADMIN_STRINGS.downloadReviewScriptCount}: {account.scripts}
        </Text>
        <Text className='ui-caption'>
          {ADMIN_STRINGS.downloadReviewAddresses}: {account.ip_addresses}
          {' · '}
          {ADMIN_STRINGS.downloadReviewDevices}: {account.devices}
        </Text>
        <Text className='ui-caption'>
          {ADMIN_STRINGS.downloadReviewLastDownload}:{' '}
          {convertDateToClientLocale(account.last_download_at)}
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

      {open && (
        <DownloadReviewEvents profileId={account.profile_id} study={study} />
      )}
    </Box>
  )
}
