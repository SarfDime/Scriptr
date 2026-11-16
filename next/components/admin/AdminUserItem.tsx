'use client'

import { ADMIN_STRINGS } from '@shared/strings/admin-strings'
import type {
  AdminProfileListItem,
  UserRole,
} from '@shared/types/profile.types'
import { isUserRole } from '@shared/utils/api.utils'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { NextLink } from '@/components/common/NextLink'
import { Text } from '@/components/typography/Text'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { cn, convertDateToClientLocale } from '@/lib/common-utils'
import type { ComponentColorPalettes } from '@/types/components/ColorPalettes.types'

const ROLE_PALETTE: Record<UserRole, ComponentColorPalettes> = {
  student: 'cp-gray',
  owner: 'cp-warning',
}

const selectionNames = (names: Array<string | null>) =>
  names.filter((name): name is string => Boolean(name))

type AdminUserItemProps = {
  profile: AdminProfileListItem
  busy: boolean
  onView: () => void
  onEdit: () => void
  onDelete: () => void
  className?: string
}

/** One row of the admin user manager: who they are, what they selected, and
 * the three operations. The buttons only report intent; the panel owns the
 * dialogs and the request. */
export const AdminUserItem = ({
  profile,
  busy,
  onView,
  onEdit,
  onDelete,
  className,
}: AdminUserItemProps) => {
  const role = isUserRole(profile.role) ? profile.role : null
  const name = profile.full_name ?? profile.username
  const faculties = selectionNames(
    profile.faculties.map((row) => row.faculty?.name ?? null)
  )
  const studies = selectionNames(
    profile.studies.map((row) => row.study?.name ?? null)
  )

  return (
    <Box
      as='article'
      className={cn('ui-stack ui-above-inside h-full gap-3', className)}
    >
      <Box className='ui-cluster items-start justify-between gap-3'>
        <Box className='ui-cluster gap-2.5'>
          <Avatar
            name={name}
            picture={
              profile.avatar_url
                ? {
                    src: profile.avatar_url,
                    className: 'h-10 w-10 rounded-full',
                  }
                : undefined
            }
            initialsIconProps={{ className: 'h-10 w-10 rounded-full' }}
          />
          <Box className='ui-stack min-w-0 gap-0.5'>
            <NextLink
              className='button link truncate'
              href={`/user/${profile.username}`}
            >
              {name}
            </NextLink>
            <Text className='ui-caption'>@{profile.username}</Text>
          </Box>
        </Box>
        <Badge colorPalette={role ? ROLE_PALETTE[role] : 'cp-gray'}>
          {role ? ADMIN_STRINGS.usersRoleNames[role] : profile.role}
        </Badge>
      </Box>

      <Box className='ui-stack gap-1'>
        <Text className='ui-caption'>
          {ADMIN_STRINGS.usersJoined}:{' '}
          {convertDateToClientLocale(profile.created_at)}
        </Text>
        <Text className='ui-caption'>
          {ADMIN_STRINGS.usersUpdated}:{' '}
          {convertDateToClientLocale(profile.updated_at)}
        </Text>
        {faculties.length > 0 && (
          <Text className='ui-caption truncate'>
            {ADMIN_STRINGS.usersDetailFaculties}: {faculties.join(', ')}
          </Text>
        )}
        {studies.length > 0 && (
          <Text className='ui-caption truncate'>
            {ADMIN_STRINGS.usersDetailStudies}: {studies.join(', ')}
          </Text>
        )}
      </Box>

      <Box className='ui-cluster mt-auto gap-2'>
        <Button onClick={onView} className='button button-sm subtle'>
          {ADMIN_STRINGS.usersView}
        </Button>
        <Button
          onClick={onEdit}
          disabled={busy}
          className='button button-sm solid'
        >
          {ADMIN_STRINGS.edit}
        </Button>
        <Button
          onClick={onDelete}
          disabled={busy}
          className='button button-sm danger'
        >
          {ADMIN_STRINGS.delete}
        </Button>
      </Box>
    </Box>
  )
}
