'use client'

import { ADMIN_STRINGS } from '@shared/strings/admin-strings'
import type { SortDirection } from '@shared/utils/array-utils/sort'
import { Fragment, type ReactNode, type SubmitEvent, useState } from 'react'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { SectionHeader } from '@/components/common/SectionHeader'
import { FormContainer } from '@/components/typography/FormContainer'
import { InputWrapper } from '@/components/typography/InputWrapper'
import { Text } from '@/components/typography/Text'
import { Field } from '@/components/ui/field/Field'
import { Select } from '@/components/ui/select/Select'
import type { DownloadReviewListState } from '@/hooks/admin/useDownloadReviewList'
import type { SelectOptionType } from '@/types/components/Select.types'
import { AdminListStatus } from './AdminListStatus'

type DownloadReviewSectionProps<TItem, TSort extends string> = {
  title: string
  searchLabel: string
  searchPlaceholder: string
  sortOptions: Array<SelectOptionType<TSort>>
  state: DownloadReviewListState<TItem, TSort>
  errorText: string
  emptyText: string
  itemKey: (item: TItem) => string
  renderItem: (item: TItem) => ReactNode
}

const ORDER_OPTIONS: Array<SelectOptionType<SortDirection>> = (
  ['desc', 'asc'] as const
).map((order) => ({
  id: order,
  value: order,
  label: ADMIN_STRINGS.usersOrderNames[order],
}))

/** One of the two review lists: a search box, a sort column and direction, the
 * page itself and the pager. Accounts and scripts differ only in the item card
 * and the sort labels, so both use this. */
export function DownloadReviewSection<TItem, TSort extends string>({
  title,
  searchLabel,
  searchPlaceholder,
  sortOptions,
  state,
  errorText,
  emptyText,
  itemKey,
  renderItem,
}: DownloadReviewSectionProps<TItem, TSort>) {
  const { page, query, loading, loadError, changeQuery, changePage, retry } =
    state
  const [searchDraft, setSearchDraft] = useState(query.search ?? '')

  const submitSearch = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    changeQuery({ search: searchDraft.trim() || undefined })
  }

  const items = page?.items ?? []
  const total = page?.total ?? 0
  const offset = page?.offset ?? 0
  const showSearchEmpty = total === 0 && Boolean(query.search)
  const hasPrevious = offset > 0
  const hasNext = offset + items.length < total

  return (
    <Box as='section' className='ui-stack gap-3'>
      <SectionHeader title={title} count={total} />

      <Box className='ui-cluster items-end gap-2'>
        <FormContainer
          onSubmit={submitSearch}
          className='ui-cluster items-end gap-2'
        >
          <InputWrapper
            className='min-w-48 grow'
            label={searchLabel}
            inputProps={{
              autoComplete: 'off',
              placeholder: searchPlaceholder,
              disabled: loading,
            }}
            inputVal={searchDraft}
            inputOnChange={(event) => setSearchDraft(event.target.value)}
          />
          <Button
            type='submit'
            isLoading={loading}
            className='button button-sm solid w-fit'
          >
            {ADMIN_STRINGS.downloadReviewSearchSubmit}
          </Button>
        </FormContainer>

        <Field label={ADMIN_STRINGS.downloadReviewSortLabel} className='w-40'>
          <Select<TSort>
            options={sortOptions}
            defaultOption={sortOptions.find(
              (option) => option.value === query.sort
            )}
            setSelectedValue={(sort) => changeQuery({ sort })}
            disabled={loading}
            triggerProps={{
              'aria-label': ADMIN_STRINGS.downloadReviewSortLabel,
            }}
          />
        </Field>

        <Field label={ADMIN_STRINGS.downloadReviewOrderLabel} className='w-40'>
          <Select<SortDirection>
            options={ORDER_OPTIONS}
            defaultOption={ORDER_OPTIONS.find(
              (option) => option.value === query.order
            )}
            setSelectedValue={(order) => changeQuery({ order })}
            disabled={loading}
            triggerProps={{
              'aria-label': ADMIN_STRINGS.downloadReviewOrderLabel,
            }}
          />
        </Field>
      </Box>

      <AdminListStatus
        loading={loading}
        loadError={loadError}
        errorText={errorText}
        onRetry={retry}
        isEmpty={items.length === 0}
        emptyText={
          showSearchEmpty ? ADMIN_STRINGS.downloadReviewNoMatches : emptyText
        }
      >
        <Box className='ui-card-grid-fill [--grid-min:20rem]'>
          {items.map((item) => (
            <Fragment key={itemKey(item)}>{renderItem(item)}</Fragment>
          ))}
        </Box>

        <Box className='ui-cluster items-center justify-between gap-2'>
          <Text className='ui-caption'>
            {ADMIN_STRINGS.usersPageRange(
              offset + 1,
              offset + items.length,
              total
            )}
          </Text>
          <Box className='ui-cluster gap-2'>
            <Button
              onClick={() => changePage(Math.max(offset - query.limit, 0))}
              disabled={!hasPrevious || loading}
              className='button button-sm subtle'
            >
              {ADMIN_STRINGS.usersPreviousPage}
            </Button>
            <Button
              onClick={() => changePage(offset + query.limit)}
              disabled={!hasNext || loading}
              className='button button-sm subtle'
            >
              {ADMIN_STRINGS.usersNextPage}
            </Button>
          </Box>
        </Box>
      </AdminListStatus>
    </Box>
  )
}
