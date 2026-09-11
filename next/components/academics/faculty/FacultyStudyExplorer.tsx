'use client'

import { Box } from '@/components/common/Box'
import { Text } from '@/components/typography/Text'
import { Title } from '@/components/typography/Title'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import type { StudyDetail } from '@/types/academics/study.types'

type FacultyStudy = Omit<StudyDetail, '_type'>

type FacultySubjectsExplorerProps = {
  studies: Array<FacultyStudy>
}

export const FacultyStudyExplorer = ({
  studies,
}: FacultySubjectsExplorerProps) => {
  {
    /* TODO: Move strings from here to shared string file */
  }
  return (
    <Card className='p-6 ui-stack gap-4'>
      <Box className='ui-cluster justify-between items-center'>
        <Box className='ui-cluster gap-2 items-center'>
          <Title as='h2' className='ui-title font-bold'>
            Studies
          </Title>

          <Badge className='cp-brand'>{studies.length}</Badge>
        </Box>
      </Box>

      {studies.length > 0 ? (
        <Box className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          {studies.map((study) => (
            // TODO: Create a new component for generic cards if possible, to be used for universities, faculties and studies
            // <SubjectCard key={subject._id} {...subject} />
            <>{study.name}</>
          ))}
        </Box>
      ) : (
        <Text className='ui-caption text-grey-500'>
          No studies match those filters.
        </Text>
      )}
    </Card>
  )
}
