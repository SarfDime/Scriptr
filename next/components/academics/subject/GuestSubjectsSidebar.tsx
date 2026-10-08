'use client'

import { UI_STRINGS } from '@shared/config/strings'
import { useGuestAcademicData } from '@/hooks/onboarding/useGuestAcademicData'
import { useOnboarding } from '@/providers/onboarding/OnboardingProvider'
import { SubjectsSidebar } from './SubjectsSidebar'

export const GuestSubjectsSidebar = () => {
  const { catalog } = useOnboarding()
  const { data } = useGuestAcademicData()
  const selectedStudy = catalog.studies.find(
    (study) => study._id === data.studyId
  )

  const completedSubjectIds = new Set(data.completedSubjectIds)
  const subjects = selectedStudy
    ? catalog.subjects.filter(
        (subject) =>
          subject.study._id === selectedStudy._id &&
          !completedSubjectIds.has(subject._id)
      )
    : []

  return (
    <SubjectsSidebar
      subjects={subjects.slice(0, 3)}
      emptyMessage={
        selectedStudy
          ? UI_STRINGS.subjects.guestNoIncompleteSubjects
          : UI_STRINGS.subjects.guestStudyPrompt
      }
    />
  )
}
