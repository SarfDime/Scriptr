import CheckmarkIcon from '@sanity/icons/Checkmark'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
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
}: OnboardingSubjectsStepProps) => (
  <Box className='ui-stack gap-4'>
    <Box className='ui-stack gap-1'>
      <Text className='ui-title font-semibold'>
        Which years have you finished?
      </Text>
      <Text className='ui-caption text-grey-500'>
        Mark a whole year done at once, or check off individual subjects below —
        fine-tune this later from your profile too.
      </Text>
    </Box>

    {subjectsByYear.size === 0 ? (
      <Text className='ui-caption text-grey-500'>
        No subjects found for this study yet.
      </Text>
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
              className='ui-stack gap-2 rounded-lg border border-grey-200 p-4'
            >
              <Box className='ui-cluster items-center justify-between'>
                <Box className='ui-cluster items-center gap-2'>
                  <Text className='ui-body font-medium'>Year {year}</Text>
                  <Badge className='cp-unstyled border border-grey-200'>
                    {completedCount}/{subjects.length} subjects
                  </Badge>
                </Box>
                <Button
                  onClick={() =>
                    isYearComplete
                      ? onUncompleteYear(year)
                      : onCompleteYear(year)
                  }
                  className={cn(
                    'button ui-caption gap-1.5 px-3 py-1.5',
                    isYearComplete ? 'subtle' : 'outline'
                  )}
                >
                  {isYearComplete && <CheckmarkIcon />}
                  {isYearComplete ? 'Year completed' : 'Mark year complete'}
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
                        'button ui-caption gap-1 px-2 py-1',
                        isSubjectComplete ? 'subtle' : 'ghost'
                      )}
                    >
                      {isSubjectComplete && <CheckmarkIcon />}
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
