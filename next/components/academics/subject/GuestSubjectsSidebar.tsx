'use client'

import { UI_STRINGS } from '@shared/config/strings'
import { useGuestAcademicData } from '@/hooks/onboarding/useGuestAcademicData'
import {
  EMPTY_ONBOARDING_CATALOG,
  useOnboardingCatalog,
} from '@/providers/onboarding/OnboardingProvider'
import type { StudyTipData } from '@/types/components/StudyTipCard.types'
import { SubjectsSidebar } from './SubjectsSidebar'

export const GuestSubjectsSidebar = ({
  studyTip,
}: {
  studyTip?: StudyTipData
}) => {
  const { data } = useGuestAcademicData()
  const catalog =
    useOnboardingCatalog(Boolean(data.studyId)) ?? EMPTY_ONBOARDING_CATALOG
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
      studyTip={studyTip}
      emptyMessage={
        selectedStudy
          ? UI_STRINGS.subjects.guestNoIncompleteSubjects
          : UI_STRINGS.subjects.guestStudyPrompt
      }
    />
  )
}
