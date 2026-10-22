'use client'

import { UI_STRINGS } from '@shared/config/strings'
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
      title: UI_STRINGS.onboarding.resumeReminder.title,
      body: UI_STRINGS.onboarding.resumeReminder.body,
      action: {
        label: UI_STRINGS.onboarding.resumeReminder.action,
        kind: 'open-onboarding',
      },
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
          : UI_STRINGS.onboarding.saveFailed
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
      title={UI_STRINGS.onboarding.title}
      hideTrigger
      onClose={() => handleClose(false)}
      dialogProps={{ className: 'md:min-w-xl' }}
    >
      <Box className='ui-stack gap-6 p-6'>
        {wizard.step === 'selection' && (
          <>
            <Box className='ui-stack gap-6'>
              <OnboardingSelectStep
                title={UI_STRINGS.onboarding.universityTitle}
                description={UI_STRINGS.onboarding.universityDescription}
                options={catalog.universities.map((u) => ({
                  id: u._id,
                  name: u.name,
                }))}
                selectedId={wizard.data.universityId}
                onSelect={wizard.selectUniversity}
              />
              <OnboardingSelectStep
                title={UI_STRINGS.onboarding.facultyTitle}
                description={UI_STRINGS.onboarding.facultyDescription}
                options={wizard.catalog.faculties.map((f) => ({
                  id: f._id,
                  name: f.name,
                }))}
                selectedId={wizard.data.facultyId}
                onSelect={wizard.selectFaculty}
                disabledReason={
                  wizard.data.universityId
                    ? undefined
                    : UI_STRINGS.onboarding.selectUniversityFirst
                }
              />
              <OnboardingSelectStep
                title={UI_STRINGS.onboarding.studyTitle}
                description={UI_STRINGS.onboarding.studyDescription}
                options={wizard.catalog.studies.map((s) => ({
                  id: s._id,
                  name: s.name,
                }))}
                selectedId={wizard.data.studyId}
                onSelect={wizard.selectStudy}
                disabledReason={
                  wizard.data.facultyId
                    ? undefined
                    : UI_STRINGS.onboarding.selectFacultyFirst
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
                    : UI_STRINGS.onboarding.selectStudyFirst
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
                className='button button-sm solid'
              >
                {isSaving
                  ? UI_STRINGS.onboarding.saving
                  : UI_STRINGS.onboarding.continue}
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </Dialog>
  )
}
