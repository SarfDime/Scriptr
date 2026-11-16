'use client'

import CheckmarkIcon from '@sanity/icons/Checkmark'
import CheckmarkCircle from '@sanity/icons/CheckmarkCircle'
import ChevronDownIcon from '@sanity/icons/ChevronDown'
import Circle from '@sanity/icons/Circle'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { SectionHeader } from '@/components/common/SectionHeader'
import { Text } from '@/components/typography/Text'
import { Badge } from '@/components/ui/Badge'
import { Collapsible } from '@/components/ui/collapse/Collapse'
import { cn } from '@/lib/common-utils'
import { useUIStrings } from '@/providers/locale/use-strings'
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
  const ui = useUIStrings()
  const placeholder =
    disabledReason ??
    (subjectsByYear.size === 0 ? ui.onboarding.noSubjects : null)

  // Electives sit in their own column, so their membership is the column's
  // label rather than a badge on every button.
  const renderSubjectButtons = (subjects: Array<OnboardingSubject>) => (
    <Box className='ui-cluster gap-1.5 max-md:flex-col max-md:items-stretch'>
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
            isActive={isSubjectComplete}
            className='button button-sm max-w-full items-center justify-start gap-1 pl-1 text-left subtle'
          >
            {isSubjectComplete ? (
              <CheckmarkCircle className='overwrite size-3' />
            ) : (
              <Circle className='overwrite size-3' />
            )}
            {subject.name}
          </Button>
        )
      })}
    </Box>
  )

  return (
    <Box className='ui-stack gap-3'>
      <SectionHeader
        title={ui.onboarding.subjectsTitle}
        titleVariant='subHeading'
        subtitle={ui.onboarding.subjectsSubtitle}
      />

      <Divider />

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
              <Collapsible
                key={year}
                rootProps={{ className: 'ui-above-inside p-2 md:p-3' }}
                contentProps={{ className: 'relative max-h-none' }}
                triggerProps={{
                  className:
                    'button button-md w-auto grow justify-start gap-2 px-0 py-2 min-h-11 md:min-h-0 md:py-1',
                  isActive: false,
                  children: (
                    <>
                      <Text as='span' className='ui-body-strong'>
                        {ui.general.year(year)}
                      </Text>
                      <Badge
                        colorPalette={
                          isYearComplete ? 'cp-brand-nb' : 'cp-gray'
                        }
                      >
                        <span className='sm:hidden'>
                          {ui.onboarding.subjectCountShort(
                            completedCount,
                            subjects.length
                          )}
                        </span>
                        <span className='hidden sm:inline'>
                          {ui.onboarding.subjectCount(
                            completedCount,
                            subjects.length
                          )}
                        </span>
                      </Badge>
                      <ChevronDownIcon className='overwrite size-5 shrink-0 transition-transform duration-200 group-aria-expanded/trigger:rotate-180' />
                    </>
                  ),
                }}
                triggerActions={
                  <Button
                    onClick={() =>
                      isYearComplete
                        ? onUncompleteYear(year)
                        : onCompleteYear(year)
                    }
                    isActive={isYearComplete}
                    aria-pressed={isYearComplete}
                    className={
                      'button button-sm subtle ml-auto shrink-0 rounded-full px-3 py-1.5 min-h-10 md:min-h-0'
                    }
                  >
                    {isYearComplete ? <CheckmarkCircle /> : <CheckmarkIcon />}
                    {ui.onboarding.yearCompleted}
                  </Button>
                }
              >
                <Box className='ui-stack gap-2 pt-2'>
                  <Divider />
                  <Box
                    className={cn(
                      'grid items-start gap-3',
                      electiveSubjects.length > 0 && 'md:grid-cols-2'
                    )}
                  >
                    <Box className='ui-stack gap-1.5'>
                      {electiveSubjects.length > 0 && (
                        <Badge
                          className='ui-small-label'
                          colorPalette='cp-rose-nb'
                        >
                          {ui.onboarding.requiredSubjects}
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
                          {ui.onboarding.electiveSubjects}
                        </Badge>
                        {renderSubjectButtons(electiveSubjects)}
                      </Box>
                    )}
                  </Box>
                </Box>
              </Collapsible>
            )
          })}
        </Box>
      )}
    </Box>
  )
}
