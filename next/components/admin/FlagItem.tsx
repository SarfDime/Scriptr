'use client'

import { ADMIN_STRINGS } from '@shared/strings/admin-strings'
import type { AdminFlag, FlagStatus } from '@shared/types/flags.types'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { NextLink } from '@/components/common/NextLink'
import { Text } from '@/components/typography/Text'
import { Badge } from '@/components/ui/Badge'
import { convertDateToClientLocale } from '@/lib/common-utils'
import type { ComponentColorPalettes } from '@/types/components/ColorPalettes.types'

const STATUS_PALETTE: Record<FlagStatus, ComponentColorPalettes> = {
  pending: 'cp-warning',
  reviewed: 'cp-success',
  dismissed: 'cp-gray',
}

type FlagItemProps = {
  flag: AdminFlag
  busy: boolean
  restrictLoading: boolean
  onChangeStatus: (status: FlagStatus) => void
  onRestrict: () => void
}

export const FlagItem = ({
  flag,
  busy,
  restrictLoading,
  onChangeStatus,
  onRestrict,
}: FlagItemProps) => {
  const target = flag.target
  const reporter = flag.reporter?.full_name ?? flag.reporter?.username
  const canRestrict =
    target !== null && target.kind !== 'user' && Boolean(target.author_id)

  return (
    <Box as='article' className='ui-stack ui-above-inside h-full'>
      <Box className='ui-cluster items-start justify-between gap-3'>
        <Box className='ui-stack min-w-0 gap-1'>
          <Box className='ui-cluster gap-1 items-center'>
            <Text className='ui-caption'>{ADMIN_STRINGS.submittedBy}:</Text>
            {flag.reporter ? (
              <NextLink
                className='button link'
                href={`/user/${flag.reporter.username}`}
              >
                {reporter}
              </NextLink>
            ) : (
              ADMIN_STRINGS.unknownUser
            )}
          </Box>
          <Text className='ui-caption'>
            {ADMIN_STRINGS.submittedAt}:{' '}
            {convertDateToClientLocale(flag.created_at)}
          </Text>
        </Box>
        <Badge colorPalette={STATUS_PALETTE[flag.status]}>
          {ADMIN_STRINGS.statusNames[flag.status]}
        </Badge>
      </Box>

      <Text className='ui-body'>{flag.reason}</Text>

      {flag.status !== 'dismissed' && (
        <Box className='ui-cluster gap-2'>
          {flag.status === 'pending' && (
            <Button
              onClick={() => onChangeStatus('reviewed')}
              isLoading={busy}
              className='button button-sm success'
            >
              {ADMIN_STRINGS.markReviewed}
            </Button>
          )}
          <Button
            onClick={() => onChangeStatus('dismissed')}
            isLoading={busy}
            className='button button-sm danger'
          >
            {ADMIN_STRINGS.dismissFlag}
          </Button>
          {canRestrict && (
            <Button
              onClick={onRestrict}
              isLoading={restrictLoading}
              className='button button-sm warning'
            >
              {ADMIN_STRINGS.restrictAuthor}
            </Button>
          )}
        </Box>
      )}
    </Box>
  )
}
