'use client'

import { ADMIN_STRINGS } from '@shared/strings/admin-strings'
import type { ReactNode } from 'react'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { Text } from '@/components/typography/Text'
import { Skeleton } from '@/components/ui/skeleton/Skeleton'

type AdminListStatusProps = {
  loading: boolean
  loadError: boolean
  errorText: string
  onRetry: () => void
  isEmpty: boolean
  emptyText: string
  children: ReactNode
}

/** The loading, error and empty states of an admin list; `children` (the
 * rows) show only once there is something to list. */
export const AdminListStatus = ({
  loading,
  loadError,
  errorText,
  onRetry,
  isEmpty,
  emptyText,
  children,
}: AdminListStatusProps) => {
  if (loading) {
    return (
      <Box className='ui-stack gap-3' aria-busy='true'>
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={`admin-skeleton-${index}`} loading className='h-28' />
        ))}
      </Box>
    )
  }

  if (loadError) {
    return (
      <Box role='alert' className='ui-cluster gap-3'>
        <Text className='ui-subtitle'>{errorText}</Text>
        <Button className='button button-sm solid' onClick={onRetry}>
          {ADMIN_STRINGS.retry}
        </Button>
      </Box>
    )
  }

  if (isEmpty) return <Text className='ui-subtitle'>{emptyText}</Text>

  return <Box className='ui-stack gap-3'>{children}</Box>
}
