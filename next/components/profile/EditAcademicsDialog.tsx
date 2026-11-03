'use client'

import BookIcon from '@sanity/icons/Book'
import { UI_STRINGS } from '@shared/config/strings'
import type { MyProfileResponse } from '@shared/types/profile.types'
import { useState } from 'react'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { OnboardingProgramFields } from '@/components/onboarding/OnboardingProgramFields'
import { OnboardingSubjectsStep } from '@/components/onboarding/OnboardingSubjectsStep'
import { FormContainer } from '@/components/typography/FormContainer'
import { Text } from '@/components/typography/Text'
import { Card } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { DialogFooter } from '@/components/ui/DialogFooter'
import { useEditAcademicsForm } from '@/hooks/profile/useEditAcademicsForm'
import { useDeviceType } from '@/hooks/useDeviceType'
import { useOnboarding } from '@/providers/onboarding/OnboardingProvider'

/** Trigger plus the academics dialog. Mounted only while open, so every
 * opening is seeded from the saved profile. */
export function EditAcademicsButton({
  profile,
}: {
  profile: MyProfileResponse
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className='button button-sm subtle ui-cluster gap-1.5'
      >
        <BookIcon />
        {UI_STRINGS.profile.academics.editLabel}
      </Button>
      {isOpen && (
        <EditAcademicsDialog
          profile={profile}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  )
}

/** University → faculty → study plus completed subjects, using the
 * onboarding wizard's selection blocks and catalog. */
function EditAcademicsDialog({
  profile,
  onClose,
}: {
  profile: MyProfileResponse
  onClose: () => void
}) {
  const strings = UI_STRINGS.profile.academics
  const isMobile = useDeviceType() === 'mobile'
  const { catalog } = useOnboarding()
  const {
    data,
    selections,
    completedYears,
    isBusy,
    canSubmit,
    prepareError,
    handleSubmit,
  } = useEditAcademicsForm({ profile, onSaved: onClose })

  return (
    <Dialog
      title={strings.title}
      hideTrigger
      isOpen
      onClose={onClose}
      dialogProps={{
        className:
          'overflow-hidden md:top-0 md:bottom-0 md:my-auto md:max-h-[90vh] md:max-w-xl open:flex open:flex-col',
      }}
      closeOnOutsideClick={false}
      closeOnEsc={false}
      hideBackdrop={isMobile}
    >
      <FormContainer
        onSubmit={handleSubmit}
        className='flex min-h-0 flex-1 flex-col'
      >
        <Card.Body className='ui-stack min-h-0 flex-1 gap-4 overflow-y-auto p-5'>
          <OnboardingProgramFields
            universities={catalog.universities.map((university) => ({
              id: university._id,
              name: university.name,
            }))}
            faculties={selections.catalog.faculties.map((faculty) => ({
              id: faculty._id,
              name: faculty.name,
            }))}
            studies={selections.catalog.studies.map((study) => ({
              id: study._id,
              name: study.name,
            }))}
            universityId={data.universityId}
            facultyId={data.facultyId}
            studyId={data.studyId}
            onSelectUniversity={selections.selectUniversity}
            onSelectFaculty={selections.selectFaculty}
            onSelectStudy={selections.selectStudy}
          />

          <Box className='border-t border-grey-200 pt-4'>
            <OnboardingSubjectsStep
              subjectsByYear={selections.catalog.subjectsByYear}
              completedYears={completedYears}
              completedSubjectIds={data.completedSubjectIds}
              onCompleteYear={selections.completeYear}
              onUncompleteYear={selections.uncompleteYear}
              onCompleteSubject={selections.completeSubject}
              onUncompleteSubject={selections.uncompleteSubject}
              disabledReason={
                data.studyId
                  ? undefined
                  : UI_STRINGS.onboarding.selectStudyFirst
              }
            />
          </Box>
        </Card.Body>

        <DialogFooter
          className='ui-stack shrink-0 gap-3 border-grey-200 border-t px-5 py-4'
          size='sm'
          note={
            prepareError ? (
              <Text className='ui-caption cp-danger-nb'>{prepareError}</Text>
            ) : undefined
          }
          secondaryLabel={UI_STRINGS.profile.edit.cancel}
          onSecondary={onClose}
          secondaryDisabled={isBusy}
          primaryLabel={UI_STRINGS.profile.edit.save}
          primaryDisabled={!canSubmit}
        />
      </FormContainer>
    </Dialog>
  )
}
