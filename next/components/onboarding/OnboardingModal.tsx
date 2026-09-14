'use client'

import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { Dialog } from '@/components/ui/Dialog'
import { useOnboardingWizard } from '@/hooks/useOnboardingWizard'
import { useNotifications } from '@/providers/notification/NotificationProvider'
import { useOnboarding } from '@/providers/onboarding/OnboardingProvider'
import type { OnboardingCatalog } from '@/types/onboarding.types'
import { OnboardingAccountPrompt } from './OnboardingAccountPrompt'
import { OnboardingSelectStep } from './OnboardingSelectStep'
import { OnboardingSubjectsStep } from './OnboardingSubjectsStep'

type OnboardingModalProps = { catalog: OnboardingCatalog }

const RESUME_ONBOARDING_NOTIFICATION_ID = 'onboarding:resume-reminder'

export const OnboardingModal = ({ catalog }: OnboardingModalProps) => {
  const { push, dismiss } = useNotifications()
  const wizard = useOnboardingWizard(catalog)
  const { isOpen, close } = useOnboarding()

  const handleClose = (completed: boolean) => {
    close()

    if (completed) {
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

  // A step with exactly one option auto-selects (see OnboardingSelectStep),
  // but that selection lands via an effect one tick after render. Checking
  // option-list length here too — not just `wizard.data.xxxId` — means
  // Next doesn't stay disabled while waiting on that effect to catch up.
  const canGoNext =
    (wizard.step === 'university' &&
      (Boolean(wizard.data.universityId) ||
        catalog.universities.length === 1)) ||
    (wizard.step === 'faculty' &&
      (Boolean(wizard.data.facultyId) ||
        wizard.catalog.faculties.length === 1)) ||
    (wizard.step === 'study' &&
      (Boolean(wizard.data.studyId) || wizard.catalog.studies.length === 1)) ||
    wizard.step === 'subjects'

  // Belt-and-suspenders alongside the wizard's own auto-select effects:
  // guarantees the single-option value is actually written to `data`
  // before advancing, instead of depending on effect timing to have
  // already done it by the time Next is clicked.
  const handleNext = () => {
    if (
      wizard.step === 'university' &&
      !wizard.data.universityId &&
      catalog.universities.length === 1
    ) {
      wizard.update({ universityId: catalog?.universities?.[0]?._id })
    }
    if (
      wizard.step === 'faculty' &&
      !wizard.data.facultyId &&
      wizard.catalog.faculties.length === 1
    ) {
      wizard.update({ facultyId: wizard.catalog.faculties?.[0]?._id })
    }
    if (
      wizard.step === 'study' &&
      !wizard.data.studyId &&
      wizard.catalog.studies.length === 1
    ) {
      wizard.update({ studyId: wizard.catalog.studies?.[0]?._id })
    }
    wizard.goNext()
  }
  return (
    <Dialog
      isOpen={isOpen}
      title='Set up your studies'
      hideTrigger
      onClose={() => handleClose(false)}
      dialogProps={{ className: 'p-6 md:min-w-xl' }}
      headerProps={{
        className: 'ui-cluster justify-between',
      }}
    >
      <Box className='ui-stack gap-6 pt-4'>
        {wizard.step === 'university' && (
          <OnboardingSelectStep
            title='Which university do you attend?'
            description="We'll use this to tailor everything else to your program."
            options={catalog.universities.map((u) => ({
              id: u._id,
              name: u.name,
            }))}
            selectedId={wizard.data.universityId}
            onSelect={(id) =>
              wizard.update({
                universityId: id,
                facultyId: null,
                studyId: null,
              })
            }
          />
        )}
        {wizard.step === 'faculty' && (
          <OnboardingSelectStep
            title='Which faculty?'
            description='Pick the faculty your study program belongs to.'
            options={wizard.catalog.faculties.map((f) => ({
              id: f._id,
              name: f.name,
            }))}
            selectedId={wizard.data.facultyId}
            onSelect={(id) => wizard.update({ facultyId: id, studyId: null })}
          />
        )}
        {wizard.step === 'study' && (
          <OnboardingSelectStep
            title='Which study program?'
            description='This determines which subjects show up next.'
            options={wizard.catalog.studies.map((s) => ({
              id: s._id,
              name: s.name,
            }))}
            selectedId={wizard.data.studyId}
            onSelect={(id) => wizard.update({ studyId: id })}
          />
        )}
        {wizard.step === 'subjects' && (
          <OnboardingSubjectsStep
            subjectsByYear={wizard.catalog.subjectsByYear}
            completedYears={wizard.data.completedYears}
            completedSubjectIds={wizard.data.completedSubjectIds}
            onCompleteYear={wizard.completeYear}
            onUncompleteYear={wizard.uncompleteYear}
            onCompleteSubject={wizard.completeSubject}
            onUncompleteSubject={wizard.uncompleteSubject}
          />
        )}
        {wizard.step === 'account' && (
          <OnboardingAccountPrompt onContinueAsGuest={handleFinish} />
        )}

        {wizard.step !== 'account' && (
          <Box className='ui-cluster items-center justify-between border-t border-grey-200 pt-4'>
            <Box className='ui-cluster gap-2'>
              {wizard.stepIndex > 0 && (
                <Button
                  onClick={wizard.goBack}
                  className='button subtle ui-caption px-3 py-1.5'
                >
                  Back
                </Button>
              )}
              <Button
                onClick={handleNext}
                disabled={!canGoNext}
                className='button solid ui-caption px-3 py-1.5'
              >
                {wizard.step === 'subjects' ? 'Continue' : 'Next'}
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </Dialog>
  )
}
