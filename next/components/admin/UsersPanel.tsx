'use client'

import {
  ADMIN_PROFILE_SORT_OPTIONS,
  ADMIN_PROFILES_PAGE_SIZE,
  type AdminProfileSortField,
} from '@shared/config/shared-constants'
import { ADMIN_STRINGS } from '@shared/strings/admin-strings'
import type {
  AdminProfileListItem,
  AdminProfilesListResponse,
  AdminProfilesQuery,
  UserRole,
} from '@shared/types/profile.types'
import type { SortDirection } from '@shared/utils/array-utils/sort'
import { type SubmitEvent, useState } from 'react'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { FormContainer } from '@/components/typography/FormContainer'
import { InputWrapper } from '@/components/typography/InputWrapper'
import { Text } from '@/components/typography/Text'
import { Dialog } from '@/components/ui/Dialog'
import { DialogFooter } from '@/components/ui/DialogFooter'
import { Field } from '@/components/ui/field/Field'
import { Select } from '@/components/ui/select/Select'
import { useAdminErrorToast } from '@/hooks/admin/useAdminErrorToast'
import { DEFAULT_ADMIN_USERS_QUERY } from '@/lib/admin-users-page'
import { ApiError } from '@/lib/api/next-api'
import { deleteProfileById, getAdminProfiles } from '@/lib/api/profile-api'
import { useToast } from '@/providers/toaster/ToasterProvider'
import type { AdminUsersViewModel } from '@/types/components/Admin.types'
import type { SelectOptionType } from '@/types/components/Select.types'
import { AdminListStatus } from './AdminListStatus'
import { AdminUserDetailDialog } from './AdminUserDetailDialog'
import { AdminUserEditDialog } from './AdminUserEditDialog'
import { AdminUserItem } from './AdminUserItem'

/** `all` is a filter value of its own, so the role select can clear the
 * filter without a separate button. */
type RoleFilter = 'all' | UserRole

const ROLE_FILTER_OPTIONS: Array<SelectOptionType<RoleFilter>> = [
  { id: 'all', value: 'all', label: ADMIN_STRINGS.usersAllRoles },
  ...(['student', 'moderator', 'admin'] as const).map((role) => ({
    id: role,
    value: role,
    label: ADMIN_STRINGS.usersRoleNames[role],
  })),
]

const SORT_OPTIONS: Array<SelectOptionType<AdminProfileSortField>> =
  ADMIN_PROFILE_SORT_OPTIONS.map((field) => ({
    id: field,
    value: field,
    label: ADMIN_STRINGS.usersSortNames[field],
  }))

const ORDER_OPTIONS: Array<SelectOptionType<SortDirection>> = (
  ['desc', 'asc'] as const
).map((order) => ({
  id: order,
  value: order,
  label: ADMIN_STRINGS.usersOrderNames[order],
}))

/** The admin user manager: a filtered, sorted, paginated listing with the
 * three operations per row. The first page is server-rendered; every change
 * of filter, sort or page re-reads it through the same endpoint. */
export const UsersPanel = ({
  initialData,
}: {
  initialData: AdminUsersViewModel | null
}) => {
  const initialQuery = initialData?.query ?? DEFAULT_ADMIN_USERS_QUERY
  const [query, setQuery] = useState<AdminProfilesQuery>(initialQuery)
  const [page, setPage] = useState<AdminProfilesListResponse | null>(
    initialData?.page ?? null
  )
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState(initialData === null)
  const [searchDraft, setSearchDraft] = useState(initialQuery.search ?? '')
  const [viewing, setViewing] = useState<AdminProfileListItem | null>(null)
  const [editing, setEditing] = useState<AdminProfileListItem | null>(null)
  const [deleting, setDeleting] = useState<AdminProfileListItem | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const reportError = useAdminErrorToast()
  const { addToast } = useToast()

  const fetchPage = (next: AdminProfilesQuery) => {
    setQuery(next)
    setLoading(true)
    setLoadError(false)
    return getAdminProfiles(next)
      .then((result) => {
        setPage(result)
        setLoading(false)
      })
      .catch(() => {
        setLoadError(true)
        setLoading(false)
      })
  }

  /** Filter and sort changes restart at the first page: staying on page 4 of
   * a different ordering shows rows nobody asked for. */
  const changeQuery = (patch: Partial<AdminProfilesQuery>) =>
    fetchPage({ ...query, ...patch, offset: 0 })

  const submitSearch = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    changeQuery({ search: searchDraft.trim() || undefined })
  }

  const clearSearch = () => {
    setSearchDraft('')
    changeQuery({ search: undefined })
  }

  const profiles = page?.profiles ?? []
  const total = page?.total ?? 0
  const limit = query.limit ?? ADMIN_PROFILES_PAGE_SIZE
  const offset = query.offset ?? 0
  const from = total === 0 ? 0 : offset + 1
  const to = Math.min(offset + limit, total)

  const confirmDelete = (profile: AdminProfileListItem) => {
    setDeleteBusy(true)
    deleteProfileById(profile.id)
      .then((result) => {
        setDeleting(null)
        if (result.auth_user_deleted) {
          addToast({ type: 'success', title: ADMIN_STRINGS.usersDeleted })
        } else {
          addToast({
            type: 'warning',
            title: ADMIN_STRINGS.usersDeleteLoginWarning,
          })
        }

        // Deleting the only row on a later page would otherwise show an
        // empty page that is no longer reachable.
        const remaining = profiles.length - 1
        return fetchPage({
          ...query,
          offset:
            remaining <= 0 && offset > 0 ? Math.max(offset - limit, 0) : offset,
        })
      })
      .catch((error: unknown) => {
        if (error instanceof ApiError && error.status === 400) {
          reportError(ADMIN_STRINGS.usersDeleteSelf)
          return
        }
        reportError(undefined, error)
      })
      .finally(() => setDeleteBusy(false))
  }

  return (
    <>
      <Box className='ui-stack ui-above gap-3'>
        <FormContainer
          onSubmit={submitSearch}
          className='ui-cluster flex-wrap items-end gap-2'
        >
          <InputWrapper
            className='min-w-56 grow'
            label={ADMIN_STRINGS.usersSearchLabel}
            labelProps={{ htmlFor: 'admin-users-search' }}
            inputProps={{
              id: 'admin-users-search',
              autoComplete: 'off',
              disabled: loading,
              placeholder: ADMIN_STRINGS.usersSearchPlaceholder,
            }}
            inputVal={searchDraft}
            inputOnChange={(event) => setSearchDraft(event.target.value)}
            inputClearButton
            inputOnClear={clearSearch}
          />
          <Button type='submit' isLoading={loading} className='button solid'>
            {ADMIN_STRINGS.usersSearchSubmit}
          </Button>
        </FormContainer>

        <Box className='ui-cluster flex-wrap items-end gap-2'>
          <Field label={ADMIN_STRINGS.usersRoleFilter} className='min-w-40'>
            <Select<RoleFilter>
              disabled={loading}
              defaultOption={ROLE_FILTER_OPTIONS[0]}
              options={ROLE_FILTER_OPTIONS}
              setSelectedValue={(role) =>
                changeQuery({ role: role === 'all' ? undefined : role })
              }
              triggerProps={{ 'aria-label': ADMIN_STRINGS.usersRoleFilter }}
            />
          </Field>
          <Field label={ADMIN_STRINGS.usersSortLabel} className='min-w-40'>
            <Select<AdminProfileSortField>
              disabled={loading}
              defaultOption={SORT_OPTIONS.find(
                (option) => option.value === (query.sort ?? 'created_at')
              )}
              options={SORT_OPTIONS}
              setSelectedValue={(sort) => changeQuery({ sort })}
              triggerProps={{ 'aria-label': ADMIN_STRINGS.usersSortLabel }}
            />
          </Field>
          <Field label={ADMIN_STRINGS.usersOrderLabel} className='min-w-40'>
            <Select<SortDirection>
              disabled={loading}
              defaultOption={ORDER_OPTIONS.find(
                (option) => option.value === (query.order ?? 'desc')
              )}
              options={ORDER_OPTIONS}
              setSelectedValue={(order) => changeQuery({ order })}
              triggerProps={{ 'aria-label': ADMIN_STRINGS.usersOrderLabel }}
            />
          </Field>
        </Box>
      </Box>

      <AdminListStatus
        loading={loading}
        loadError={loadError}
        errorText={ADMIN_STRINGS.usersLoadError}
        onRetry={() => fetchPage(query)}
        isEmpty={profiles.length === 0}
        emptyText={ADMIN_STRINGS.usersEmpty}
      >
        <Box className='ui-card-grid-fill [--grid-min:22rem]'>
          {profiles.map((profile) => (
            <AdminUserItem
              key={profile.id}
              profile={profile}
              busy={deleteBusy && deleting?.id === profile.id}
              onView={() => setViewing(profile)}
              onEdit={() => setEditing(profile)}
              onDelete={() => setDeleting(profile)}
            />
          ))}
        </Box>
      </AdminListStatus>

      {total > 0 && (
        <Box className='ui-cluster items-center justify-between gap-3'>
          <Text className='ui-caption'>
            {ADMIN_STRINGS.usersPageRange(from, to, total)}
          </Text>
          <Box className='ui-cluster gap-2'>
            <Button
              onClick={() =>
                fetchPage({ ...query, offset: Math.max(offset - limit, 0) })
              }
              disabled={loading || offset === 0}
              className='button button-sm subtle'
            >
              {ADMIN_STRINGS.usersPreviousPage}
            </Button>
            <Button
              onClick={() => fetchPage({ ...query, offset: offset + limit })}
              disabled={loading || to >= total}
              className='button button-sm subtle'
            >
              {ADMIN_STRINGS.usersNextPage}
            </Button>
          </Box>
        </Box>
      )}

      {viewing && (
        <AdminUserDetailDialog
          key={viewing.id}
          profileId={viewing.id}
          username={viewing.username}
          onClose={() => setViewing(null)}
        />
      )}

      {editing && (
        <AdminUserEditDialog
          key={editing.id}
          profile={editing}
          onClose={() => setEditing(null)}
          onSaved={() => fetchPage(query)}
        />
      )}

      {deleting && (
        <Dialog
          key={deleting.id}
          title={ADMIN_STRINGS.usersDeleteTitle}
          hideTrigger
          isOpen
          onClose={() => setDeleting(null)}
          dialogProps={{ className: 'md:min-w-md' }}
        >
          <Box className='ui-stack gap-4 p-5'>
            <Text className='ui-body'>
              {ADMIN_STRINGS.usersDeleteConfirm(deleting.username)}
            </Text>
            <DialogFooter
              size='sm'
              secondaryLabel={ADMIN_STRINGS.cancel}
              onSecondary={() => setDeleting(null)}
              primaryLabel={ADMIN_STRINGS.delete}
              primaryType='button'
              onPrimary={() => confirmDelete(deleting)}
              primaryLoading={deleteBusy}
              destructive
            />
          </Box>
        </Dialog>
      )}
    </>
  )
}
