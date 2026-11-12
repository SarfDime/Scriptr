import CheckmarkIcon from '@sanity/icons/Checkmark'
import CheckmarkCircle from '@sanity/icons/CheckmarkCircle'
import { UI_STRINGS } from '@shared/config/strings'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { SectionHeader } from '@/components/common/SectionHeader'
import { Text } from '@/components/typography/Text'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/common-utils'
import type { OnboardingSubject } from '@/types/onboarding.types'
import { Divider } from '../ui/Divider'

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

  // Electives sit in their own column, so their membership is the column's
  // label rather than a badge on every button.
  const renderSubjectButtons = (subjects: Array<OnboardingSubject>) => (
    <Box className='ui-cluster gap-1.5'>
      {subjects.map((subject) => {
        const isSubjectComplete = completedSubjectIds.includes(subject._id)
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
              'button button-md gap-1 py-1 px-2 items-start justify-start',
              isSubjectComplete ? 'solid' : 'subtle'
            )}
          >
            {subject.name}
          </Button>
        )
      })}
    </Box>
  )

  return (
    <Box className='ui-stack gap-3'>
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
            const requiredSubjects = subjects.filter(
              (subject) => !subject.elective
            )
            const electiveSubjects = subjects.filter(
              (subject) => subject.elective
            )

            return (
              <Box key={year} className='ui-stack ui-above-inside gap-2 p-3'>
                <Box className='ui-cluster justify-between'>
                  <Box className='ui-cluster gap-2'>
                    <Text className='ui-body-strong'>
                      {UI_STRINGS.general.year(year)}
                    </Text>
                    <Badge
                      colorPalette={isYearComplete ? 'cp-brand-nb' : 'cp-gray'}
                    >
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
                    isActive={isYearComplete}
                    className={cn(
                      'button button-sm gap-1.5 px-3 py-1.5 rounded-full',
                      isYearComplete ? 'subtle' : 'hollow'
                    )}
                  >
                    {isYearComplete ? <CheckmarkCircle /> : <CheckmarkIcon />}
                    {isYearComplete
                      ? UI_STRINGS.onboarding.yearCompleted
                      : UI_STRINGS.onboarding.markYearComplete}
                  </Button>
                </Box>
                <Divider />
                <Box
                  className={cn(
                    'grid items-start gap-3 ',
                    electiveSubjects.length > 0 && 'md:grid-cols-2'
                  )}
                >
                  <Box className='ui-stack gap-1.5'>
                    {electiveSubjects.length > 0 && (
                      <Badge
                        className='ui-small-label'
                        colorPalette='cp-rose-nb'
                      >
                        {UI_STRINGS.onboarding.requiredSubjects}
                      </Badge>
                    )}
                    {renderSubjectButtons(requiredSubjects)}
                  </Box>
                  {electiveSubjects.length > 0 && (
                    <Box className='ui-stack gap-1.5'>
                      <Badge
                        className='ui-small-label'
                        colorPalette='cp-warning-nb'
                      >
                        {UI_STRINGS.onboarding.electiveSubjects}
                      </Badge>
                      {renderSubjectButtons(electiveSubjects)}
                    </Box>
                  )}
                </Box>
              </Box>
            )
          })}
        </Box>
      )}
    </Box>
  )
}
