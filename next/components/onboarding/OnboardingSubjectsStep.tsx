import CheckmarkIcon from '@sanity/icons/Checkmark'
import { UI_STRINGS } from '@shared/config/strings'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { SectionHeader } from '@/components/common/SectionHeader'
import { Text } from '@/components/typography/Text'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/common-utils'
import type { OnboardingSubject } from '@/types/onboarding.types'

type OnboardingSubjectsStepProps = {
  subjectsByYear: Map<number, Array<OnboardingSubject>>
  completedYears: Array<number>
  completedSubjectIds: Array<string>
  onCompleteYear: (year: number) => void
  onUncompleteYear: (year: number) => void
  onCompleteSubject: (subjectId: string) => void
  onUncompleteSubject: (subjectId: string) => void
  disabledReason?: string
}

/** Lets the person mark whole academic years done in one click, or check
 * off individual subjects when they've only finished some of a year. */
export const OnboardingSubjectsStep = ({
  subjectsByYear,
  completedYears,
  completedSubjectIds,
  onCompleteYear,
  onUncompleteYear,
  onCompleteSubject,
  onUncompleteSubject,
  disabledReason,
}: OnboardingSubjectsStepProps) => {
  const placeholder =
    disabledReason ??
    (subjectsByYear.size === 0 ? UI_STRINGS.onboarding.noSubjects : null)

  return (
    <Box className='ui-stack gap-4'>
      <SectionHeader
        title={UI_STRINGS.onboarding.subjectsTitle}
        subtitle={UI_STRINGS.onboarding.subjectsSubtitle}
      />

      {placeholder ? (
        <Text className='ui-caption'>{placeholder}</Text>
      ) : (
        <Box className='ui-stack gap-3'>
          {[...subjectsByYear.entries()].map(([year, subjects]) => {
            const isYearComplete = completedYears.includes(year)
            const completedCount = subjects.filter((s) =>
              completedSubjectIds.includes(s._id)
            ).length

            return (
              <Box
                key={year}
                className='ui-stack gap-2 rounded-lg p-2 shadow-md bg-background-300'
              >
                <Box className='ui-cluster items-center justify-between'>
                  <Box className='ui-cluster items-center gap-2'>
                    <Text className='ui-body-strong'>
                      {UI_STRINGS.general.year(year)}
                    </Text>
                    <Badge className='cp-unstyled border border-grey-200'>
                      {UI_STRINGS.onboarding.subjectCount(
                        completedCount,
                        subjects.length
                      )}
                    </Badge>
                  </Box>
                  <Button
                    onClick={() =>
                      isYearComplete
                        ? onUncompleteYear(year)
                        : onCompleteYear(year)
                    }
                    className={cn(
                      'button button-sm gap-1.5 px-3 py-1.5 rounded-full',
                      isYearComplete ? 'subtle' : 'outline'
                    )}
                  >
                    {isYearComplete && <CheckmarkIcon />}
                    {isYearComplete
                      ? UI_STRINGS.onboarding.yearCompleted
                      : UI_STRINGS.onboarding.markYearComplete}
                  </Button>
                </Box>
                <Box className='ui-cluster gap-1.5'>
                  {subjects.map((subject) => {
                    const isSubjectComplete = completedSubjectIds.includes(
                      subject._id
                    )
                    return (
                      <Button
                        key={subject._id}
                        onClick={() =>
                          isSubjectComplete
                            ? onUncompleteSubject(subject._id)
                            : onCompleteSubject(subject._id)
                        }
                        aria-pressed={isSubjectComplete}
                        className={cn(
                          'button gap-1',
                          isSubjectComplete ? 'solid' : 'subtle'
                        )}
                      >
                        {/* {isSubjectComplete && <CheckmarkIcon />} */}
                        {subject.name}
                      </Button>
                    )
                  })}
                </Box>
              </Box>
            )
          })}
        </Box>
      )}
    </Box>
  )
}
