'use client'

import { Box } from '@/components/common/Box'
import { EntityCard } from '@/components/common/EntityCard'
import { Text } from '@/components/typography/Text'
import { Title } from '@/components/typography/Title'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { getAcademicPath } from '@/lib/academic-routes'
import { compactStats } from '@/lib/common-utils'
import type { MinimalStudy } from '@/types/academics/study.types'

type FacultySubjectsExplorerProps = {
  studies: Array<MinimalStudy>
}

// TODO: Move strings from here to shared string file
export const FacultyStudyExplorer = ({
  studies,
}: FacultySubjectsExplorerProps) => {
  return (
    <Card className='p-0 border-0 ui-stack gap-4'>
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
          {studies.map((study) => {
            const universitySlug =
              study.faculty?.university?.slug ?? study.faculty?.university?._id
            const facultySlug = study.faculty?.slug ?? study.faculty?._id

            if (!universitySlug || !facultySlug) return null

            return (
              <EntityCard
                key={study._id}
                href={getAcademicPath({
                  type: 'study',
                  universitySlug,
                  facultySlug,
                  studySlug: study.slug ?? study._id,
                })}
                title={study.name}
                stats={compactStats({
                  Subjects: study.subjectCount,
                  Professors: study.professorCount,
                })}
              />
            )
          })}
        </Box>
      ) : (
        <Text className='ui-caption text-grey-500'>
          No studies match those filters.
        </Text>
      )}
    </Card>
  )
}
