'use client'

import {
  ANNOUNCEMENT_BODY_MAX_LENGTH,
  ANNOUNCEMENT_TITLE_MAX_LENGTH,
} from '@shared/config/shared-constants'
import { ADMIN_STRINGS } from '@shared/strings/admin-strings'
import type { AdminStudyOption } from '@shared/types/admin.types'
import { type SubmitEvent, useEffect, useState } from 'react'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { FormContainer } from '@/components/typography/FormContainer'
import { InputWrapper } from '@/components/typography/InputWrapper'
import { Text } from '@/components/typography/Text'
import { TextArea } from '@/components/typography/TextArea'
import { Dialog } from '@/components/ui/Dialog'
import { DialogFooter } from '@/components/ui/DialogFooter'
import { Field } from '@/components/ui/field/Field'
import { Select } from '@/components/ui/select/Select'
import { useAdminErrorToast } from '@/hooks/admin/useAdminErrorToast'
import { getFieldFeedback } from '@/hooks/auth/useTouchedFields'
import { getAdminStudyOptions } from '@/lib/api/admin-study-roles-api'
import { broadcastAnnouncement } from '@/lib/api/notifications-api'
import { useSession } from '@/providers/SessionProvider'
import { useToast } from '@/providers/toaster/ToasterProvider'
import type { SelectOptionType } from '@/types/components/Select.types'

/** An announcement goes to everyone, or to one study's people. */
const EVERYONE = ''

/** Writes one `announcement` notification per recipient — every profile, or one
 * study's students, staff and owners. The confirmation step is not decoration:
 * there is no way to recall a broadcast. */
export const AnnouncementPanel = () => {
  // A failed read only costs the study options; a platform-wide announcement
  // does not need them.
  const [studies, setStudies] = useState<Array<AdminStudyOption>>([])
  const [studyId, setStudyId] = useState(EVERYONE)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [touched, setTouched] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [sending, setSending] = useState(false)
  const reportError = useAdminErrorToast()
  const { addToast } = useToast()
  const { session } = useSession()
  const isOwner =
    session.status === 'authenticated' && session.user.role === 'owner'
  const sessionReady = session.status !== 'loading'

  useEffect(() => {
    // Waiting for the session keeps an owner's default on "everyone": running
    // the default-scope step while the role is still unknown would pick a study.
    if (!sessionReady) return
    let active = true
    getAdminStudyOptions()
      .then((result) => {
        if (!active) return
        const options = result?.studies ?? []
        setStudies(options)
        // Everyone is an owner's audience only, so a study admin starts on the
        // study they administer rather than on an option they cannot use.
        setStudyId((current) =>
          current === EVERYONE && !isOwner
            ? (options[0]?.id ?? EVERYONE)
            : current
        )
      })
      .catch(() => {
        if (active) setStudies([])
      })
    return () => {
      active = false
    }
  }, [isOwner, sessionReady])

  const audienceOptions: Array<SelectOptionType<string>> = [
    ...(isOwner
      ? [
          {
            id: 'everyone',
            value: EVERYONE,
            label: ADMIN_STRINGS.announcementScopeEveryone,
          },
        ]
      : []),
    ...studies.map((study) => ({
      id: study.id,
      value: study.id,
      label: study.name,
    })),
  ]
  const audienceName = studyId
    ? (studies.find((study) => study.id === studyId)?.name ??
      ADMIN_STRINGS.announcementScopeEveryone)
    : ADMIN_STRINGS.announcementScopeEveryone
  const audienceHint = studyId
    ? ADMIN_STRINGS.announcementScopeStudyHint
    : ADMIN_STRINGS.announcementScopeEveryoneHint

  const titleError =
    title.trim() === '' || title.trim().length > ANNOUNCEMENT_TITLE_MAX_LENGTH
      ? ADMIN_STRINGS.announcementTitleValidation
      : null
  const bodyError =
    body.trim().length > ANNOUNCEMENT_BODY_MAX_LENGTH
      ? ADMIN_STRINGS.announcementBodyValidation
      : null
  // A study admin with no study to announce to has nothing to send.
  const canSubmit =
    !sending &&
    titleError === null &&
    bodyError === null &&
    (isOwner || Boolean(studyId))

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
      studyId: studyId || null,
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
          <Field label={ADMIN_STRINGS.announcementScope}>
            <Select<string>
              defaultOption={
                audienceOptions.find((option) => option.value === studyId) ??
                audienceOptions[0]
              }
              options={audienceOptions}
              setSelectedValue={setStudyId}
              disabled={sending}
              triggerProps={{ 'aria-label': ADMIN_STRINGS.announcementScope }}
            />
            <Text className='ui-caption'>{audienceHint}</Text>
          </Field>
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
              {ADMIN_STRINGS.announcementConfirm(title.trim(), audienceName)}
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
