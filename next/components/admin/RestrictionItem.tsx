'use client'

import { ADMIN_STRINGS } from '@shared/strings/admin-strings'
import type {
  LiftedRestrictionItem,
  RestrictionListItem,
} from '@shared/types/restrictions.types'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { NextLink } from '@/components/common/NextLink'
import { Text } from '@/components/typography/Text'
import { Badge } from '@/components/ui/Badge'
import { ConfirmAction } from '@/components/ui/ConfirmAction'
import { convertDateToClientLocale } from '@/lib/common-utils'

type RestrictionItemProps = {
  restriction: RestrictionListItem | LiftedRestrictionItem
  lifting: boolean
  onLift?: () => void
}

export const RestrictionItem = ({
  restriction,
  lifting,
  onLift,
}: RestrictionItemProps) => {
  const { profile, restricted_by_profile: admin } = restriction
  const liftedAt =
    'lifted_early_at' in restriction ? restriction.lifted_early_at : null
  const isActive = 'active' in restriction && restriction.active
  let statusLabel: string = ADMIN_STRINGS.lapsed
  if (liftedAt) statusLabel = ADMIN_STRINGS.lifted
  else if (isActive) statusLabel = ADMIN_STRINGS.active
  const username = profile?.username ?? ADMIN_STRINGS.unknownUser
  const restrictedBy = admin?.full_name ?? admin?.username

  return (
    <Box as='article' className='ui-stack ui-above'>
      <Box className='ui-cluster items-start justify-between gap-3'>
        <Box className='ui-stack min-w-0 gap-1'>
          <Text className='ui-body-strong'>
            {profile?.username ? (
              <NextLink href={`/user/${profile.username}`}>
                {profile.full_name ?? username}
              </NextLink>
            ) : (
              username
            )}
          </Text>
          {profile?.username && (
            <Text className='ui-caption'>@{profile.username}</Text>
          )}
        </Box>
        <Badge colorPalette={isActive ? 'cp-danger' : 'cp-gray'}>
          {statusLabel}
        </Badge>
      </Box>

      <Text className='ui-body'>{restriction.reason}</Text>

      <Text className='ui-caption'>
        {ADMIN_STRINGS.restrictedBy}:{' '}
        {restrictedBy ?? ADMIN_STRINGS.unknownUser}
        {' · '}
        {ADMIN_STRINGS.expires}:{' '}
        {restriction.expires_at
          ? convertDateToClientLocale(restriction.expires_at)
          : ADMIN_STRINGS.permanent}
        {liftedAt && (
          <>
            {' · '}
            {ADMIN_STRINGS.liftedOn}: {convertDateToClientLocale(liftedAt)}
          </>
        )}
      </Text>

      {isActive && onLift && (
        <ConfirmAction
          title={ADMIN_STRINGS.confirmLiftTitle}
          description={ADMIN_STRINGS.confirmLift(username)}
          confirmLabel={ADMIN_STRINGS.liftRestriction}
          cancelLabel={ADMIN_STRINGS.cancel}
          destructive={false}
          onConfirm={onLift}
          trigger={(open) => (
            <Button
              onClick={open}
              isLoading={lifting}
              className='button button-sm subtle w-fit'
            >
              {ADMIN_STRINGS.liftRestriction}
            </Button>
          )}
        />
      )}
    </Box>
  )
}
