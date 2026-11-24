'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Box } from '@/components/common/Box'
import { Text } from '@/components/typography/Text'
import { Dialog } from '@/components/ui/Dialog'
import { DialogFooter } from '@/components/ui/DialogFooter'
import { addProfileStudy } from '@/lib/api/profile-api'
import { catalogUrl } from '@/lib/study-origin'
import { useLocale } from '@/providers/locale/LocaleProvider'
import { useUIStrings } from '@/providers/locale/use-strings'
import { useMyProfileActions } from '@/providers/ProfileProvider'
import { useSession } from '@/providers/SessionProvider'

/**
 * Asks a signed-in visitor to enroll before setting up a study they are not a
 * member of: the subjects setup writes belong to the study, so the account has
 * to hold it first. Declining leaves the study, because everything on this page
 * is about setting it up. The dialog cannot be dismissed without an answer.
 */
export const StudyEnrollPrompt = ({
  studyId,
  studyName,
  enrollmentRequired,
}: {
  studyId: string
  studyName: string
  /** The server's answer for the first paint: signed in and the account does
   * not hold this study. The client session can also raise the prompt when the
   * server read failed, and clears it once the enrollment lands. */
  enrollmentRequired: boolean
}) => {
  const { locale } = useLocale()
  const ui = useUIStrings()
  const router = useRouter()
  const { session, refresh } = useSession()
  const { reload: reloadProfile } = useMyProfileActions()
  const [isEnrolling, setIsEnrolling] = useState(false)
  const [hasError, setHasError] = useState(false)

  const isEnrolled =
    session.status === 'authenticated' &&
    session.user.selected_study_ids.includes(studyId)

  // The server decides the first paint; once the client session resolves it can
  // also raise the prompt, so a failed server read cannot hide it. Either signal
  // is cleared as soon as the session shows the enrollment. A guest sees
  // neither: there is no account to enroll.
  const shouldPrompt =
    !isEnrolled && (enrollmentRequired || session.status === 'authenticated')

  const enroll = async () => {
    setIsEnrolling(true)
    setHasError(false)
    try {
      await addProfileStudy(studyId)
      // The navbar's study list comes from the shared profile read, which does
      // not re-run while the session stays authenticated; the session and the
      // server-rendered parts carry the same enrollment.
      await Promise.all([refresh(), reloadProfile()])
      router.refresh()
    } catch {
      setHasError(true)
      setIsEnrolling(false)
    }
  }

  // The catalog root: on a study host `/` is the study's own overview, not the
  // homepage this dialog promises.
  const decline = () => router.replace(catalogUrl('/', locale))

  if (!shouldPrompt) return null

  return (
    <Dialog
      title={ui.onboarding.academicSetup.enrollTitle}
      hideTrigger
      isOpen
      hideCloseButton
      closeOnEsc={false}
      closeOnOutsideClick={false}
      dialogProps={{ className: 'md:min-w-md md:w-md' }}
    >
      <Box className='ui-stack gap-4 px-4 pt-4'>
        <Text className='ui-body'>
          {ui.onboarding.academicSetup.enrollBody(studyName)}
        </Text>
        {hasError && (
          <Text className='ui-caption' role='alert'>
            {ui.onboarding.academicSetup.enrollFailed}
          </Text>
        )}
        <DialogFooter
          size='md'
          secondaryLabel={ui.onboarding.academicSetup.enrollDecline}
          secondaryDisabled={isEnrolling}
          onSecondary={decline}
          primaryLabel={ui.onboarding.academicSetup.enrollConfirm}
          primaryType='button'
          primaryLoading={isEnrolling}
          onPrimary={enroll}
          className='py-4'
        />
      </Box>
    </Dialog>
  )
}
