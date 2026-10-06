'use client'

import WarningIcon from '@sanity/icons/WarningOutline'
import type { FlagTargetType } from '@shared/types/api.types'
import { useState } from 'react'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { Text } from '@/components/typography/Text'
import { useProtectedAction } from '@/hooks/useProtectedAction'
import { useRequireSignIn } from '@/hooks/useRequireSignIn'
import { submitFlag } from '@/lib/api/common-api'
import { TextArea } from '../typography/TextArea'
import { Dialog } from './Dialog'

export type FlagReportButtonProps = {
  targetType: FlagTargetType
  targetId: string
  triggerLabel?: string
  /** Classes for the trigger button. Defaults to the attention-grabbing `button warning`; include `gap-1.5` in custom classes so the icon and label are spaced; pass something quieter where reports repeat (e.g. on every comment). */
  triggerClassName?: string
}

const MIN_REASON_LENGTH = 10

/**
 * Reuses the shared Dialog for modal chrome. Flag creation is
 * restriction-checked (ARCHITECTURE.md §4); withdrawing an own flag via
 * DELETE apiRoutes.flags.byId is not — this component only ever creates, so
 * useProtectedAction is the right (and only) wrapper needed here. Failures
 * (restricted, other) are toasted by the hook, not rendered inline.
 *
 * The dialog is controlled so a signed-out visitor gets the login modal when
 * they click Report, instead of writing a report that can't be submitted.
 */
export function FlagReportButton({
  targetType,
  targetId,
  triggerLabel = 'Report',
  triggerClassName = 'button warning gap-1.5',
}: FlagReportButtonProps) {
  const [reason, setReason] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const requireSignIn = useRequireSignIn()
  const { state, run, reset } = useProtectedAction(submitFlag, {
    errorTitle: 'Couldn’t submit report',
  })

  const isReasonValid = reason.trim().length >= MIN_REASON_LENGTH

  const handleSubmit = async () => {
    if (!isReasonValid) return
    const result = await run(targetType, targetId, reason.trim())
    if (result.ok) setSubmitted(true)
  }

  const handleOpen = () => {
    if (requireSignIn()) setIsOpen(true)
  }

  const handleClose = () => {
    setIsOpen(false)
    setReason('')
    setSubmitted(false)
    reset()
  }

  return (
    <>
      <Button onClick={handleOpen} className={triggerClassName}>
        <WarningIcon />
        {triggerLabel}
      </Button>
      <Dialog
        title='Report content'
        hideTrigger
        isOpen={isOpen}
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
                Let us know what&apos;s wrong with this {targetType}. Reports
                are reviewed by admins.
              </Text>
              <TextArea
                value={reason}
                inputOnChange={(event) => setReason(event.target.value)}
                placeholder='Describe the issue (min. 10 characters)'
                className='ui-card p-2 w-full'
                rows={4}
                aria-label='Report reason'
              />
              <Box className='ui-cluster gap-2 justify-end'>
                <Button
                  onClick={handleSubmit}
                  disabled={!isReasonValid || state.status === 'pending'}
                  className='button solid'
                >
                  Submit report
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Dialog>
    </>
  )
}
