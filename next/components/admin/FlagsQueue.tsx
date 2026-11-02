'use client'

import { ADMIN_STRINGS } from '@shared/strings/admin-strings'
import type { AdminFlag, FlagStatus } from '@shared/types/flags.types'
import type { RestrictionLookupResponse } from '@shared/types/restrictions.types'
import { useState } from 'react'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { NextLink } from '@/components/common/NextLink'
import { SectionHeader } from '@/components/common/SectionHeader'
import { Badge } from '@/components/ui/Badge'
import { ConfirmAction } from '@/components/ui/ConfirmAction'
import { Field } from '@/components/ui/field/Field'
import { Select } from '@/components/ui/select/Select'
import { useAdminErrorToast } from '@/hooks/admin/useAdminErrorToast'
import { useAdminList } from '@/hooks/admin/useAdminList'
import { deleteComment } from '@/lib/api/comments-api'
import { getAdminFlags, updateFlagStatus } from '@/lib/api/flags-api'
import { lookupRestriction } from '@/lib/api/restrictions-api'
import { deleteScript } from '@/lib/api/scripts-api'
import type { AdminFlagsViewModel } from '@/types/components/Admin.types'
import type { SelectOptionType } from '@/types/components/Select.types'
import { Divider } from '../ui/Divider'
import { AdminListStatus } from './AdminListStatus'
import { FlagItem } from './FlagItem'
import { RestrictionDialog } from './RestrictionDialog'

const STATUS_OPTIONS: Array<SelectOptionType<FlagStatus>> = (
  ['pending', 'reviewed', 'dismissed'] as const
).map((value) => ({
  id: value,
  value,
  label: ADMIN_STRINGS.statusNames[value],
}))

type FlagGroup = {
  key: string
  target: AdminFlag['target']
  flags: Array<AdminFlag>
}

const missingKind = (flag: AdminFlag | undefined) => {
  if (flag?.target_comment_id) return 'comment'
  if (flag?.target_user_id) return 'user'
  return 'script'
}

const groupFlagsByTarget = (flags: Array<AdminFlag>): Array<FlagGroup> => {
  const groups = new Map<string, FlagGroup>()
  for (const flag of flags) {
    const key = flag.target
      ? `${flag.target.kind}:${flag.target.id}`
      : `missing:${flag.target_script_id ?? flag.target_comment_id ?? flag.target_user_id ?? flag.id}`
    const group = groups.get(key)
    if (group) group.flags.push(flag)
    else groups.set(key, { key, target: flag.target, flags: [flag] })
  }
  return [...groups.values()]
}

export const FlagsQueue = ({
  initialData,
}: {
  initialData: AdminFlagsViewModel | null
}) => {
  const [status, setStatus] = useState<FlagStatus>(
    initialData?.status ?? 'pending'
  )
  const {
    items: flags,
    setItems: setFlags,
    loading,
    loadError,
    load,
  } = useAdminList<AdminFlag>(initialData?.flags ?? null)
  const [busyFlagId, setBusyFlagId] = useState<string | null>(null)
  const [busyGroupKey, setBusyGroupKey] = useState<string | null>(null)
  const [restrictingFlagId, setRestrictingFlagId] = useState<string | null>(
    null
  )
  const [restrictionLookup, setRestrictionLookup] =
    useState<RestrictionLookupResponse | null>(null)
  const reportError = useAdminErrorToast()

  const loadFlags = (nextStatus: FlagStatus) =>
    load(() => getAdminFlags(nextStatus))

  const changeFilter = (nextStatus: FlagStatus) => {
    setStatus(nextStatus)
    loadFlags(nextStatus)
  }

  const changeStatus = (flagId: string, nextStatus: FlagStatus) => {
    setBusyFlagId(flagId)
    updateFlagStatus(flagId, nextStatus)
      .then(({ flag }) =>
        setFlags((current) =>
          flag.status === status
            ? current.map((item) => (item.id === flag.id ? flag : item))
            : current.filter((item) => item.id !== flag.id)
        )
      )
      .catch(() => reportError())
      .finally(() => setBusyFlagId(null))
  }

  const changeGroupStatus = (group: FlagGroup, nextStatus: FlagStatus) => {
    setBusyGroupKey(group.key)
    Promise.allSettled(
      group.flags
        .filter((flag) => flag.status !== nextStatus)
        .map((flag) => updateFlagStatus(flag.id, nextStatus))
    )
      .then((results) => {
        if (results.some((result) => result.status === 'rejected')) {
          reportError()
        }
        return loadFlags(status)
      })
      .finally(() => setBusyGroupKey(null))
  }

  const deleteGroupTarget = (group: FlagGroup) => {
    const target = group.target
    if (!target || target.kind === 'user') return

    setBusyGroupKey(group.key)
    const deletion =
      target.kind === 'script'
        ? deleteScript(target.id)
        : deleteComment(target.id)
    deletion
      .then(() => loadFlags(status))
      .catch(() => reportError())
      .finally(() => setBusyGroupKey(null))
  }

  const restrictAuthor = (flag: AdminFlag) => {
    const authorId = flag.target?.author_id
    if (!authorId) return

    setRestrictingFlagId(flag.id)
    lookupRestriction({ profile_id: authorId })
      .then(setRestrictionLookup)
      .catch(() => reportError())
      .finally(() => setRestrictingFlagId(null))
  }

  const restrictGroupUser = (group: FlagGroup) => {
    const target = group.target
    if (target?.kind !== 'user') return

    setBusyGroupKey(group.key)
    lookupRestriction({ profile_id: target.id })
      .then(setRestrictionLookup)
      .catch(() => reportError())
      .finally(() => setBusyGroupKey(null))
  }

  return (
    <>
      <Box className='ui-above relative z-10'>
        <Field label={ADMIN_STRINGS.statusLabel}>
          <Select<FlagStatus>
            defaultOption={STATUS_OPTIONS.find(
              (option) => option.value === status
            )}
            options={STATUS_OPTIONS}
            setSelectedValue={changeFilter}
            triggerProps={{ 'aria-label': ADMIN_STRINGS.statusLabel }}
          />
        </Field>
      </Box>

      <AdminListStatus
        loading={loading}
        loadError={loadError}
        errorText={ADMIN_STRINGS.loadError}
        onRetry={() => loadFlags(status)}
        isEmpty={flags.length === 0}
        emptyText={ADMIN_STRINGS.emptyFlags}
      >
        {groupFlagsByTarget(flags).map((group) => {
          const { key, target, flags: groupFlags } = group
          const groupBusy = busyGroupKey === key
          return (
            <Box as='section' key={key} className='ui-stack ui-above'>
              <SectionHeader
                titleProps={{
                  className: 'ui-cluster gap-3',
                }}
                title={
                  target ? (
                    <>
                      <NextLink className='button link' href={target.href}>
                        {target.label}
                      </NextLink>
                      <Divider colorScheme='dark' orientation='vertical' />
                      <Badge colorPalette='cp-gray'>
                        {ADMIN_STRINGS.targetKindNames[target.kind]}
                      </Badge>
                    </>
                  ) : (
                    <>
                      {ADMIN_STRINGS.noTarget}
                      <Badge
                        colorPalette='cp-gray'
                        className='ml-2 align-middle'
                      >
                        {
                          ADMIN_STRINGS.targetKindNames[
                            missingKind(group.flags[0])
                          ]
                        }
                      </Badge>
                    </>
                  )
                }
                count={groupFlags.length}
                as='h3'
                actions={
                  <Box className='ui-cluster gap-2'>
                    {status !== 'reviewed' && status !== 'dismissed' && (
                      <Button
                        onClick={() => changeGroupStatus(group, 'reviewed')}
                        isLoading={groupBusy}
                        className='button button-sm success'
                      >
                        {ADMIN_STRINGS.markAllReviewed}
                      </Button>
                    )}
                    {status !== 'dismissed' && (
                      <Button
                        onClick={() => changeGroupStatus(group, 'dismissed')}
                        isLoading={groupBusy}
                        className='button button-sm warning'
                      >
                        {ADMIN_STRINGS.dismissAllFlags}
                      </Button>
                    )}
                    {target?.kind === 'user' && (
                      <Button
                        onClick={() => restrictGroupUser(group)}
                        isLoading={groupBusy}
                        className='button button-sm danger'
                      >
                        {ADMIN_STRINGS.restrictUser}
                      </Button>
                    )}
                    {target && target.kind !== 'user' && (
                      <ConfirmAction
                        title={ADMIN_STRINGS.confirmDeleteTargetTitle}
                        description={ADMIN_STRINGS.confirmDeleteTarget(
                          target.label
                        )}
                        confirmLabel={ADMIN_STRINGS.delete}
                        cancelLabel={ADMIN_STRINGS.cancel}
                        onConfirm={() => deleteGroupTarget(group)}
                        trigger={(open) => (
                          <Button
                            onClick={open}
                            isLoading={groupBusy}
                            className='button button-sm danger'
                          >
                            {ADMIN_STRINGS.deleteTarget}
                          </Button>
                        )}
                      />
                    )}
                  </Box>
                }
              />
              <Divider colorScheme='dark' />
              <Box className='ui-card-grid-fill [--grid-min:20rem]'>
                {groupFlags.map((flag) => (
                  <FlagItem
                    key={flag.id}
                    flag={flag}
                    busy={busyFlagId === flag.id}
                    restrictLoading={restrictingFlagId === flag.id}
                    onChangeStatus={(nextStatus) =>
                      changeStatus(flag.id, nextStatus)
                    }
                    onRestrict={() => restrictAuthor(flag)}
                  />
                ))}
              </Box>
            </Box>
          )
        })}
      </AdminListStatus>

      {restrictionLookup && (
        <RestrictionDialog
          key={restrictionLookup.profile.id}
          lookup={restrictionLookup}
          onClose={() => setRestrictionLookup(null)}
          onApplied={() => loadFlags(status)}
        />
      )}
    </>
  )
}
