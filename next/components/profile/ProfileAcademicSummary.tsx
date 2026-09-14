import { Box } from '@/components/common/Box'
import { Text } from '@/components/typography/Text'
import { Title } from '@/components/typography/Title'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import type {
  GuestAcademicData,
  OnboardingCatalog,
} from '@/types/onboarding.types'

type ProfileAcademicSummaryProps = {
  catalog: OnboardingCatalog
  data: GuestAcademicData
}

/** Groups the person's academic selections into a university → faculty →
 * study → year/subjects summary. */
export const ProfileAcademicSummary = ({
  catalog,
  data,
}: ProfileAcademicSummaryProps) => {
  const university = catalog.universities.find(
    (u) => u._id === data.universityId
  )
  const faculty = catalog.faculties.find((f) => f._id === data.facultyId)
  const study = catalog.studies.find((s) => s._id === data.studyId)
  const subjects = catalog.subjects.filter((s) => s.studyId === data.studyId)

  const subjectsByYear = new Map<number, typeof subjects>()
  for (const subject of subjects) {
    subjectsByYear.set(subject.year, [
      ...(subjectsByYear.get(subject.year) ?? []),
      subject,
    ])
  }

  if (!university && !faculty && !study) {
    return (
      <Card className='p-6'>
        <Text className='ui-caption text-grey-500'>
          No academic profile set up yet.
        </Text>
      </Card>
    )
  }

  return (
    <Card className='p-6 ui-stack gap-5'>
      <Box className='ui-stack gap-1'>
        {university && (
          <Text className='ui-caption text-grey-500'>{university.name}</Text>
        )}
        {faculty && (
          <Title as='h2' className='ui-title font-bold'>
            {faculty.name}
          </Title>
        )}
        {study && <Text className='ui-body text-grey-500'>{study.name}</Text>}
      </Box>

      <Box className='ui-stack gap-3'>
        {[...subjectsByYear.entries()]
          .sort(([a], [b]) => a - b)
          .map(([year, yearSubjects]) => {
            const isYearComplete = data.completedYears.includes(year)
            return (
              <Box
                key={year}
                className='ui-stack gap-2 rounded-lg border border-grey-200 p-4'
              >
                <Box className='ui-cluster items-center gap-2'>
                  <Text className='ui-body font-medium'>Year {year}</Text>
                  <Badge
                    className={
                      isYearComplete
                        ? 'cp-success'
                        : 'cp-unstyled border border-grey-200'
                    }
                  >
                    {isYearComplete ? 'Completed' : 'In progress'}
                  </Badge>
                </Box>
                <Box className='ui-cluster gap-2'>
                  {yearSubjects.map((subject) => (
                    <Badge
                      key={subject._id}
                      className={
                        data.completedSubjectIds.includes(subject._id)
                          ? 'cp-brand'
                          : 'cp-unstyled border border-grey-200'
                      }
                    >
                      {subject.name}
                    </Badge>
                  ))}
                </Box>
              </Box>
            )
          })}
      </Box>
    </Card>
  )
}
