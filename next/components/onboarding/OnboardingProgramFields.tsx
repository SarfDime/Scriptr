import { UI_STRINGS } from '@shared/config/strings'
import { Box } from '@/components/common/Box'
import type { OnboardingOption } from '@/types/onboarding.types'
import { OnboardingSelectStep } from './OnboardingSelectStep'

type OnboardingProgramFieldsProps = {
  universities: Array<OnboardingOption>
  faculties: Array<OnboardingOption>
  studies: Array<OnboardingOption>
  universityId: string | null
  facultyId: string | null
  studyId: string | null
  onSelectUniversity: (id: string) => void
  onSelectFaculty: (id: string) => void
  onSelectStudy: (id: string) => void
}

/** University → faculty → study, each a compact dropdown that unlocks once
 * the one above it is chosen. Shared by the onboarding wizard and the
 * profile's academics dialog. */
export const OnboardingProgramFields = ({
  universities,
  faculties,
  studies,
  universityId,
  facultyId,
  studyId,
  onSelectUniversity,
  onSelectFaculty,
  onSelectStudy,
}: OnboardingProgramFieldsProps) => (
  <Box className='ui-stack gap-3'>
    <OnboardingSelectStep
      title={UI_STRINGS.onboarding.universityTitle}
      options={universities}
      selectedId={universityId}
      onSelect={onSelectUniversity}
    />
    <OnboardingSelectStep
      title={UI_STRINGS.onboarding.facultyTitle}
      options={faculties}
      selectedId={facultyId}
      onSelect={onSelectFaculty}
      disabledReason={
        universityId ? undefined : UI_STRINGS.onboarding.selectUniversityFirst
      }
    />
    <OnboardingSelectStep
      title={UI_STRINGS.onboarding.studyTitle}
      options={studies}
      selectedId={studyId}
      onSelect={onSelectStudy}
      disabledReason={
        facultyId ? undefined : UI_STRINGS.onboarding.selectFacultyFirst
      }
    />
  </Box>
)
