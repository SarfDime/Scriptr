'use client'

import WarningIcon from '@sanity/icons/WarningOutline'
import { UI_STRINGS } from '@shared/config/strings'
import type { FlagRow, FlagTargetType } from '@shared/types/api.types'
import { useState } from 'react'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { useProtectedAction } from '@/hooks/useProtectedAction'
import { useRequireSignIn } from '@/hooks/useRequireSignIn'
import { getMyFlags, submitFlag } from '@/lib/api/common-api'
import { useToast } from '@/providers/toaster/ToasterProvider'
import { TextArea } from '../typography/TextArea'
import { Dialog } from './Dialog'

export type FlagReportButtonProps = {
  targetType: FlagTargetType
  targetId: string
  canReport?: boolean
  triggerLabel?: string
  /** Classes for the trigger button. Defaults to the attention-grabbing `button warning`; include `gap-1.5` in custom classes so the icon and label are spaced; pass something quieter where reports repeat (e.g. on every comment). */
  triggerClassName?: string
}

/**
 * Reuses the shared Dialog for modal chrome. Flag creation is
 * restriction-checked (docs/ARCHITECTURE-USERS-AUTH.md); withdrawing an own
 * flag via DELETE apiRoutes.flags.byId is not — this component only ever
 * creates, so useProtectedAction is the right (and only) wrapper needed here.
 * Failures (restricted, other) are toasted by the hook, not rendered inline.
 *
 * The dialog is controlled so a signed-out visitor gets the login modal when
 * they click Report, instead of writing a report that can't be submitted.
 */
export function FlagReportButton({
  targetType,
  targetId,
  canReport = true,
  triggerLabel = UI_STRINGS.flags.report,
  triggerClassName = 'button button-sm cp-warning-int',
}: FlagReportButtonProps) {
  const [reason, setReason] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [hasPendingFlag, setHasPendingFlag] = useState<boolean | null>(null)
  const [isCheckingFlag, setIsCheckingFlag] = useState(false)
  const requireSignIn = useRequireSignIn()
  const { addToast } = useToast()
  const { state, run, reset } = useProtectedAction(submitFlag, {
    errorTitle: UI_STRINGS.flags.submitError,
  })

  const isReasonValid =
    reason.trim().length >= UI_STRINGS.flags.minimumReasonLength

  const handleSubmit = async () => {
    if (!isReasonValid) return
    const result = await run(targetType, targetId, reason.trim())
    if (result.ok) {
      setHasPendingFlag(true)
      handleClose()
      addToast({
        type: 'success',
        title: UI_STRINGS.flags.reportSubmitted,
        description: UI_STRINGS.flags.submitted,
      })
    }
  }

  const flagMatchesTarget = (flag: FlagRow) => {
    if (flag.status !== 'pending') return false

    if (targetType === 'script') return flag.target_script_id === targetId
    if (targetType === 'comment') return flag.target_comment_id === targetId
    return flag.target_user_id === targetId
  }

  const handleOpen = async () => {
    if (!requireSignIn()) return

    if (hasPendingFlag) {
      addToast({
        type: 'info',
        title: UI_STRINGS.flags.alreadyReportedTitle,
        description: UI_STRINGS.flags.alreadyReportedDescription,
      })
      return
    }

    if (hasPendingFlag === false) {
      setIsOpen(true)
      return
    }

    setIsCheckingFlag(true)
    try {
      const flags = await getMyFlags()
      const alreadyReported = flags.some(flagMatchesTarget)
      setHasPendingFlag(alreadyReported)

      if (alreadyReported) {
        addToast({
          type: 'info',
          title: UI_STRINGS.flags.alreadyReportedTitle,
          description: UI_STRINGS.flags.alreadyReportedDescription,
        })
        return
      }

      setIsOpen(true)
    } catch {
      addToast({
        type: 'error',
        title: UI_STRINGS.flags.checkStatusError,
        description: UI_STRINGS.general.tryAgain,
      })
    } finally {
      setIsCheckingFlag(false)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setReason('')
    reset()
  }

  if (!canReport) return null

  return (
    <>
      <Button
        onClick={handleOpen}
        disabled={isCheckingFlag}
        className={triggerClassName}
      >
        <WarningIcon />
        {triggerLabel}
      </Button>
      {isOpen && (
        <Dialog
          title={UI_STRINGS.flags.reportContent}
          hideTrigger
          isOpen={isOpen}
          onClose={handleClose}
        >
          <Box className='ui-stack gap-3 p-5'>
            <p className='ui-subtitle'>
              {UI_STRINGS.flags.description(targetType)}
            </p>
            <TextArea
              value={reason}
              inputOnChange={(event) => setReason(event.target.value)}
              placeholder={UI_STRINGS.flags.reasonPlaceholder}
              className='ui-card p-2 w-full'
              rows={4}
              aria-label={UI_STRINGS.flags.reasonLabel}
            />
            <Box className='ui-cluster gap-2 justify-end'>
              <Button
                onClick={handleSubmit}
                disabled={!isReasonValid || state.status === 'pending'}
                className='button solid'
              >
                {UI_STRINGS.flags.submit}
              </Button>
            </Box>
          </Box>
        </Dialog>
      )}
    </>
  )
}
