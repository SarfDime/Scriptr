'use client'

import WarningIcon from '@sanity/icons/WarningOutline'
import type { FlagRow, FlagTargetType } from '@shared/types/api.types'
import { useState } from 'react'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { useProtectedAction } from '@/hooks/useProtectedAction'
import { useRequireSignIn } from '@/hooks/useRequireSignIn'
import { getMyFlags, submitFlag } from '@/lib/api/common-api'
import { useUIStrings } from '@/providers/locale/use-strings'
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
  triggerLabel,
  triggerClassName = 'button button-sm cp-warning-int',
}: FlagReportButtonProps) {
  const strings = useUIStrings()
  const [reason, setReason] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [hasPendingFlag, setHasPendingFlag] = useState<boolean | null>(null)
  const [isCheckingFlag, setIsCheckingFlag] = useState(false)
  const requireSignIn = useRequireSignIn()
  const { addToast } = useToast()
  const { state, run, reset } = useProtectedAction(submitFlag, {
    errorTitle: strings.flags.submitError,
  })

  const isReasonValid =
    reason.trim().length >= strings.flags.minimumReasonLength

  const handleSubmit = async () => {
    if (!isReasonValid) return
    const result = await run(targetType, targetId, reason.trim())
    if (result.ok) {
      setHasPendingFlag(true)
      handleClose()
      addToast({
        type: 'success',
        title: strings.flags.reportSubmitted,
        description: strings.flags.submitted,
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
        title: strings.flags.alreadyReportedTitle,
        description: strings.flags.alreadyReportedDescription,
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
          title: strings.flags.alreadyReportedTitle,
          description: strings.flags.alreadyReportedDescription,
        })
        return
      }

      setIsOpen(true)
    } catch {
      addToast({
        type: 'error',
        title: strings.flags.checkStatusError,
        description: strings.general.tryAgain,
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
        {triggerLabel ?? strings.flags.report}
      </Button>
      {isOpen && (
        <Dialog
          title={strings.flags.reportContent}
          hideTrigger
          isOpen={isOpen}
          onClose={handleClose}
        >
          <Box className='ui-stack gap-3 p-5'>
            <p className='ui-subtitle'>
              {strings.flags.description(targetType)}
            </p>
            <TextArea
              value={reason}
              inputOnChange={(event) => setReason(event.target.value)}
              placeholder={strings.flags.reasonPlaceholder}
              className='ui-card p-2 w-full'
              rows={4}
              aria-label={strings.flags.reasonLabel}
            />
            <Box className='ui-cluster gap-2 justify-end'>
              <Button
                onClick={handleSubmit}
                disabled={!isReasonValid || state.status === 'pending'}
                className='button solid'
              >
                {strings.flags.submit}
              </Button>
            </Box>
          </Box>
        </Dialog>
      )}
    </>
  )
}
