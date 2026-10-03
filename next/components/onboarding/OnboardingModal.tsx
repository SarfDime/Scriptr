'use client'

import { useState } from 'react'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { Text } from '@/components/typography/Text'
import { Dialog } from '@/components/ui/Dialog'
import { useOnboardingWizard } from '@/hooks/onboarding/useOnboardingWizard'
import { saveAuthenticatedOnboarding } from '@/lib/profile-sync'
import { useNotifications } from '@/providers/notification/NotificationProvider'
import { useOnboarding } from '@/providers/onboarding/OnboardingProvider'
import { useSession } from '@/providers/SessionProvider'
import type { OnboardingCatalog } from '@/types/onboarding.types'
import { OnboardingAccountPrompt } from './OnboardingAccountPrompt'
import { OnboardingSelectStep } from './OnboardingSelectStep'
import { OnboardingSubjectsStep } from './OnboardingSubjectsStep'

type OnboardingModalProps = { catalog: OnboardingCatalog }

const RESUME_ONBOARDING_NOTIFICATION_ID = 'onboarding:resume-reminder'

export const OnboardingModal = ({ catalog }: OnboardingModalProps) => {
  const { push, dismiss } = useNotifications()
  const { session } = useSession()
  const wizard = useOnboardingWizard(catalog)
  const { isOpen, close } = useOnboarding()
  const isAuthenticated = session.status === 'authenticated'
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const handleClose = (completed: boolean) => {
    close()

    const onboardingCompleted =
      completed || Boolean(wizard.data.onboardingCompletedAt)
    if (onboardingCompleted) {
      dismiss(RESUME_ONBOARDING_NOTIFICATION_ID)
      return
    }

    wizard.update({ onboardingDismissedAt: new Date().toISOString() })
    push({
      id: RESUME_ONBOARDING_NOTIFICATION_ID,
      title: 'Finish setting up your studies',
      body: 'Pick up where you left off any time.',
      action: { label: 'Resume setup', kind: 'open-onboarding' },
      type: 'info',
    })
  }

  const handleFinish = () => {
    wizard.finish()
    handleClose(true)
  }

  const handleAuthenticatedFinish = async () => {
    setIsSaving(true)
    setSaveError(null)
    try {
      await saveAuthenticatedOnboarding(catalog, wizard.data)
      handleFinish()
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : 'We could not save your academic profile. Please try again.'
      )
    } finally {
      setIsSaving(false)
    }
  }

  // University/faculty/study are all visible at once now — auto-select
  // and cascading-clear both live in useOnboardingWizard, so this just
  // has to check the three values are actually filled in before letting
  // the person continue past the selection screen. Subjects aren't
  // required — matches the old subjects step, which had no restriction.
  const canContinue =
    Boolean(wizard.data.universityId) &&
    Boolean(wizard.data.facultyId) &&
    Boolean(wizard.data.studyId)

  const handleContinue = () => {
    // Authenticated users skip the account-creation step entirely — the
    // wizard hook's own goNext would otherwise advance into it, since
    // STEP_ORDER still ends in 'account' for guests.
    if (isAuthenticated) {
      handleAuthenticatedFinish()
      return
    }
    wizard.goNext()
  }

  return (
    <Dialog
      isOpen={isOpen}
      title='Set up your studies'
      hideTrigger
      onClose={() => handleClose(false)}
      dialogProps={{
        className: 'p-6 md:min-w-xl rounded-lg ui-above-light',
      }}
      headerProps={{
        className: 'ui-cluster justify-between',
      }}
    >
      <Box className='ui-stack gap-6 pt-4'>
        {wizard.step === 'selection' && (
          <>
            <Box className='ui-stack gap-6'>
              <OnboardingSelectStep
                title='Which university do you attend?'
                description="We'll use this to tailor everything else to your program."
                options={catalog.universities.map((u) => ({
                  id: u._id,
                  name: u.name,
                }))}
                selectedId={wizard.data.universityId}
                onSelect={wizard.selectUniversity}
              />
              <OnboardingSelectStep
                title='Which faculty?'
                description='Pick the faculty your study program belongs to.'
                options={wizard.catalog.faculties.map((f) => ({
                  id: f._id,
                  name: f.name,
                }))}
                selectedId={wizard.data.facultyId}
                onSelect={wizard.selectFaculty}
                disabledReason={
                  wizard.data.universityId
                    ? undefined
                    : 'Select a university first.'
                }
              />
              <OnboardingSelectStep
                title='Which study program?'
                description='This determines which subjects show up below.'
                options={wizard.catalog.studies.map((s) => ({
                  id: s._id,
                  name: s.name,
                }))}
                selectedId={wizard.data.studyId}
                onSelect={wizard.selectStudy}
                disabledReason={
                  wizard.data.facultyId ? undefined : 'Select a faculty first.'
                }
              />
            </Box>

            <Box className='border-t border-grey-200 pt-6'>
              <OnboardingSubjectsStep
                subjectsByYear={wizard.catalog.subjectsByYear}
                completedYears={wizard.data.completedYears}
                completedSubjectIds={wizard.data.completedSubjectIds}
                onCompleteYear={wizard.completeYear}
                onUncompleteYear={wizard.uncompleteYear}
                onCompleteSubject={wizard.completeSubject}
                onUncompleteSubject={wizard.uncompleteSubject}
                disabledReason={
                  wizard.data.studyId
                    ? undefined
                    : 'Select a study to see subjects.'
                }
              />
            </Box>
          </>
        )}

        {wizard.step === 'account' && (
          <OnboardingAccountPrompt
            onContinueAsGuest={handleFinish}
            onCreateAccount={handleFinish}
          />
        )}

        {wizard.step === 'selection' && (
          <Box className='ui-stack gap-3 border-t border-grey-200 pt-4'>
            {saveError && (
              <Text className='ui-caption text-danger-600'>{saveError}</Text>
            )}
            <Box className='ui-cluster items-center justify-end'>
              <Button
                onClick={handleContinue}
                disabled={!canContinue || isSaving}
                className='button solid text-xs'
              >
                {isSaving ? 'Saving…' : 'Continue'}
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </Dialog>
  )
}
