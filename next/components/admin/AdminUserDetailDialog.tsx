'use client'

import { ADMIN_STRINGS } from '@shared/strings/admin-strings'
import type { AdminProfileDetail } from '@shared/types/profile.types'
import { useEffect, useState } from 'react'
import { Box } from '@/components/common/Box'
import { NextLink } from '@/components/common/NextLink'
import { Text } from '@/components/typography/Text'
import { Card } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { Skeleton } from '@/components/ui/skeleton/Skeleton'
import { getAdminProfile } from '@/lib/api/profile-api'
import { convertDateToClientLocale } from '@/lib/common-utils'

/** Reads the admin projection of one profile when it opens, so the listing
 * itself stays one request. The counts are the reason for the extra call. */
export const AdminUserDetailDialog = ({
  profileId,
  username,
  onClose,
}: {
  profileId: string
  username: string
  onClose: () => void
}) => {
  const [detail, setDetail] = useState<AdminProfileDetail | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let active = true
    getAdminProfile(profileId)
      .then((result) => {
        if (active) setDetail(result)
      })
      .catch(() => {
        if (active) setFailed(true)
      })
    return () => {
      active = false
    }
  }, [profileId])

  const rows = detail
    ? [
        {
          label: ADMIN_STRINGS.usersJoined,
          value:
            convertDateToClientLocale(detail.profile.created_at) ??
            ADMIN_STRINGS.usersDetailNone,
        },
        {
          label: ADMIN_STRINGS.usersUpdated,
          value:
            convertDateToClientLocale(detail.profile.updated_at) ??
            ADMIN_STRINGS.usersDetailNone,
        },
        {
          label: ADMIN_STRINGS.usersDetailScripts,
          value: String(detail.counts.scripts),
        },
        {
          label: ADMIN_STRINGS.usersDetailComments,
          value: String(detail.counts.comments),
        },
        {
          label: ADMIN_STRINGS.usersDetailFaculties,
          value:
            detail.faculties.length > 0
              ? detail.faculties.map((faculty) => faculty.name).join(', ')
              : ADMIN_STRINGS.usersDetailNone,
        },
        {
          label: ADMIN_STRINGS.usersDetailStudies,
          value:
            detail.studies.length > 0
              ? detail.studies.map((study) => study.name).join(', ')
              : ADMIN_STRINGS.usersDetailNone,
        },
      ]
    : []

  return (
    <Dialog
      title={ADMIN_STRINGS.usersDetailTitle}
      hideTrigger
      isOpen
      onClose={onClose}
      dialogProps={{
        className: 'md:w-[min(28rem,calc(100vw-2rem))] md:min-w-0',
      }}
    >
      <Card.Body className='ui-stack gap-4 p-5'>
        <Box className='ui-stack gap-1'>
          <Text className='ui-body-strong'>
            <NextLink href={`/user/${username}`}>{username}</NextLink>
          </Text>
          {detail?.profile.full_name && (
            <Text className='ui-caption'>{detail.profile.full_name}</Text>
          )}
        </Box>

        {failed && (
          <Text role='alert' className='ui-subtitle'>
            {ADMIN_STRINGS.loadError}
          </Text>
        )}

        {!failed && !detail && (
          <Skeleton loading className='h-32' aria-busy='true' />
        )}

        {detail && (
          <Box className='ui-stack gap-2'>
            {rows.map(({ label, value }) => (
              <Box
                key={label}
                className='ui-cluster items-start justify-between gap-4'
              >
                <Text as='span' className='ui-caption'>
                  {label}
                </Text>
                <Text as='span' className='ui-body text-right'>
                  {value}
                </Text>
              </Box>
            ))}
          </Box>
        )}
      </Card.Body>
    </Dialog>
  )
}
