'use client'

import { ADMIN_STRINGS } from '@shared/strings/admin-strings'
import type { AdminStudyOption } from '@shared/types/admin.types'
import type { AdminProfileDetail, StudyRole } from '@shared/types/profile.types'
import { useEffect, useState } from 'react'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { NextLink } from '@/components/common/NextLink'
import { Text } from '@/components/typography/Text'
import { Card } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { Select } from '@/components/ui/select/Select'
import { Skeleton } from '@/components/ui/skeleton/Skeleton'
import {
  getAdminStudyOptions,
  grantStudyRole,
  revokeStudyRole,
} from '@/lib/api/admin-study-roles-api'
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
  const [refreshToken, setRefreshToken] = useState(0)
  const [studies, setStudies] = useState<Array<AdminStudyOption>>([])
  const [studyId, setStudyId] = useState<string | null>(null)
  const [role, setRole] = useState<StudyRole>('moderator')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // biome-ignore lint/correctness/useExhaustiveDependencies: refreshToken is the reload trigger.
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
  }, [profileId, refreshToken])

  useEffect(() => {
    let active = true
    getAdminStudyOptions()
      .then((result) => {
        if (active) setStudies(result?.studies ?? [])
      })
      .catch(() => {
        if (active) setStudies([])
      })
    return () => {
      active = false
    }
  }, [])

  const reload = () => setRefreshToken((token) => token + 1)

  const save = async (change: () => Promise<unknown>) => {
    setSaving(true)
    setSaveError(null)
    try {
      await change()
      reload()
    } catch {
      setSaveError(ADMIN_STRINGS.usersStudyRoleSaveFailed)
    } finally {
      setSaving(false)
    }
  }

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

        {detail && (
          <Box className='ui-stack gap-2 border-t border-grey-200 pt-3'>
            <Text className='ui-label'>
              {ADMIN_STRINGS.usersDetailStudyRoles}
            </Text>

            {detail.studyRoles.length === 0 && (
              <Text className='ui-caption'>
                {ADMIN_STRINGS.usersStudyRoleNone}
              </Text>
            )}

            {detail.studyRoles.map((assignment) => (
              <Box
                key={assignment.studyId}
                className='ui-cluster items-center justify-between gap-3'
              >
                <Text as='span' className='ui-body'>
                  {assignment.studyName} ·{' '}
                  {ADMIN_STRINGS.studyRoleNames[assignment.role]}
                </Text>
                <Button
                  className='button button-sm subtle'
                  disabled={saving}
                  onClick={() =>
                    save(() => revokeStudyRole(profileId, assignment.studyId))
                  }
                >
                  {ADMIN_STRINGS.usersStudyRoleRemove}
                </Button>
              </Box>
            ))}

            {studies.length > 0 && (
              <Box className='ui-stack gap-2 pt-1'>
                <Text className='ui-caption'>
                  {ADMIN_STRINGS.usersStudyRoleAdd}
                </Text>
                <Box className='ui-cluster items-center gap-2'>
                  <Select
                    options={studies.map((study) => ({
                      id: study.id,
                      value: study.id,
                      label: study.name,
                    }))}
                    defaultOption={undefined}
                    setSelectedValue={setStudyId}
                  />
                  <Select
                    options={[
                      {
                        id: 'moderator',
                        value: 'moderator' as const,
                        label: ADMIN_STRINGS.studyRoleNames.moderator,
                      },
                      {
                        id: 'admin',
                        value: 'admin' as const,
                        label: ADMIN_STRINGS.studyRoleNames.admin,
                      },
                    ]}
                    defaultOption={{
                      id: 'moderator',
                      value: 'moderator' as const,
                      label: ADMIN_STRINGS.studyRoleNames.moderator,
                    }}
                    setSelectedValue={setRole}
                  />
                  <Button
                    className='button button-sm solid'
                    disabled={saving || !studyId}
                    onClick={() => {
                      if (!studyId) return
                      save(async () => {
                        await grantStudyRole(profileId, studyId, role)
                        setStudyId(null)
                      })
                    }}
                  >
                    {ADMIN_STRINGS.usersStudyRoleAddAction}
                  </Button>
                </Box>
                {saveError && (
                  <Text role='alert' className='ui-caption cp-danger-nb'>
                    {saveError}
                  </Text>
                )}
              </Box>
            )}
          </Box>
        )}
      </Card.Body>
    </Dialog>
  )
}
