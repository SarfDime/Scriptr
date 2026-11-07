'use client'

import {
  ANNOUNCEMENT_BODY_MAX_LENGTH,
  ANNOUNCEMENT_TITLE_MAX_LENGTH,
} from '@shared/config/shared-constants'
import { ADMIN_STRINGS } from '@shared/strings/admin-strings'
import { type SubmitEvent, useState } from 'react'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { FormContainer } from '@/components/typography/FormContainer'
import { InputWrapper } from '@/components/typography/InputWrapper'
import { Text } from '@/components/typography/Text'
import { TextArea } from '@/components/typography/TextArea'
import { Dialog } from '@/components/ui/Dialog'
import { DialogFooter } from '@/components/ui/DialogFooter'
import { useAdminErrorToast } from '@/hooks/admin/useAdminErrorToast'
import { getFieldFeedback } from '@/hooks/auth/useTouchedFields'
import { broadcastAnnouncement } from '@/lib/api/notifications-api'
import { useToast } from '@/providers/toaster/ToasterProvider'

/** Writes one `announcement` notification per profile. The confirmation step
 * is not decoration: there is no way to recall a broadcast. */
export const AnnouncementPanel = () => {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [touched, setTouched] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [sending, setSending] = useState(false)
  const reportError = useAdminErrorToast()
  const { addToast } = useToast()

  const titleError =
    title.trim() === '' || title.trim().length > ANNOUNCEMENT_TITLE_MAX_LENGTH
      ? ADMIN_STRINGS.announcementTitleValidation
      : null
  const bodyError =
    body.trim().length > ANNOUNCEMENT_BODY_MAX_LENGTH
      ? ADMIN_STRINGS.announcementBodyValidation
      : null
  const canSubmit = !sending && titleError === null && bodyError === null

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    setTouched(true)
    if (!canSubmit) return
    setConfirming(true)
  }

  const send = () => {
    setSending(true)
    broadcastAnnouncement({
      title: title.trim(),
      body: body.trim() || undefined,
    })
      .then((result) => {
        addToast({
          type: 'success',
          title: ADMIN_STRINGS.announcementSent(result.recipients),
        })
        setTitle('')
        setBody('')
        setTouched(false)
        setConfirming(false)
      })
      .catch((error: unknown) => reportError(undefined, error))
      .finally(() => setSending(false))
  }

  return (
    <>
      <Box className='ui-stack ui-above gap-4'>
        <Text>{ADMIN_STRINGS.announcementIntro}</Text>
        <FormContainer onSubmit={handleSubmit} className='ui-stack gap-4'>
          <InputWrapper
            label={ADMIN_STRINGS.announcementTitleLabel}
            labelProps={{ htmlFor: 'announcement-title' }}
            inputProps={{
              id: 'announcement-title',
              autoComplete: 'off',
              required: true,
              disabled: sending,
              maxLength: ANNOUNCEMENT_TITLE_MAX_LENGTH,
            }}
            inputVal={title}
            inputOnChange={(event) => setTitle(event.target.value)}
            {...getFieldFeedback(titleError, touched)}
          />
          <TextArea
            value={body}
            inputOnChange={(event) => setBody(event.target.value)}
            onBlur={() => setTouched(true)}
            rows={5}
            maxLength={ANNOUNCEMENT_BODY_MAX_LENGTH}
            disabled={sending}
            fieldProps={{
              label: ADMIN_STRINGS.announcementBodyLabel,
              ...getFieldFeedback(bodyError, touched),
            }}
          />
          <Button
            type='submit'
            disabled={!canSubmit}
            className='button solid w-fit'
          >
            {ADMIN_STRINGS.announcementSend}
          </Button>
        </FormContainer>
      </Box>

      {confirming && (
        <Dialog
          title={ADMIN_STRINGS.announcementConfirmTitle}
          hideTrigger
          isOpen
          onClose={() => setConfirming(false)}
          dialogProps={{ className: 'md:min-w-md' }}
        >
          <Box className='ui-stack gap-4 p-5'>
            <Text className='ui-body'>
              {ADMIN_STRINGS.announcementConfirm(title.trim())}
            </Text>
            <DialogFooter
              size='sm'
              secondaryLabel={ADMIN_STRINGS.cancel}
              onSecondary={() => setConfirming(false)}
              primaryLabel={ADMIN_STRINGS.announcementSend}
              primaryType='button'
              onPrimary={send}
              primaryLoading={sending}
            />
          </Box>
        </Dialog>
      )}
    </>
  )
}
