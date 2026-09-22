'use client'

import type { FlagTargetType } from '@shared/types/api.types'
import { useState } from 'react'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { Text } from '@/components/typography/Text'
import { useProtectedAction } from '@/hooks/useProtectedAction'
import { submitFlag } from '@/lib/api/common-api'
import { Dialog } from './Dialog'

export type FlagReportButtonProps = {
  targetType: FlagTargetType
  targetId: string
  triggerLabel?: string
}

const MIN_REASON_LENGTH = 10

/**
 * Reuses the shared Dialog for modal chrome. Flag creation is
 * restriction-checked (ARCHITECTURE.md §4); withdrawing an own flag via
 * DELETE apiRoutes.flags.byId is not — this component only ever creates, so
 * useProtectedAction is the right (and only) wrapper needed here.
 */
export function FlagReportButton({
  targetType,
  targetId,
  triggerLabel = 'Report',
}: FlagReportButtonProps) {
  const [reason, setReason] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const { state, run, reset } = useProtectedAction(submitFlag)

  const isReasonValid = reason.trim().length >= MIN_REASON_LENGTH

  const handleSubmit = async () => {
    if (!isReasonValid) return
    const result = await run(targetType, targetId, reason.trim())
    if (result.ok) setSubmitted(true)
  }

  const handleClose = () => {
    setReason('')
    setSubmitted(false)
    reset()
  }

  return (
    <Dialog
      title='Report content'
      triggerButtonProps={{ children: triggerLabel, className: 'button basic' }}
      onClose={handleClose}
    >
      <Box className='ui-stack gap-3 p-4'>
        {submitted ? (
          <Text className='ui-body'>
            Thanks — this has been reported for review.
          </Text>
        ) : (
          <>
            <Text className='ui-subtitle'>
              Let us know what&apos;s wrong with this {targetType}. Reports are
              reviewed by admins.
            </Text>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder='Describe the issue (min. 10 characters)'
              className='ui-card p-2 w-full'
              rows={4}
              aria-label='Report reason'
            />
            {(state.status === 'restricted' || state.status === 'error') && (
              <Text className='ui-caption text-danger-600'>
                {state.message}
              </Text>
            )}
            <div className='ui-cluster gap-2 justify-end'>
              <Button
                onClick={handleSubmit}
                disabled={!isReasonValid || state.status === 'pending'}
                className='button solid'
              >
                Submit report
              </Button>
            </div>
          </>
        )}
      </Box>
    </Dialog>
  )
}
