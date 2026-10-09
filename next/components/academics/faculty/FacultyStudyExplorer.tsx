'use client'

import { UI_STRINGS } from '@shared/config/strings'
import { Box } from '@/components/common/Box'
import { EntityCard } from '@/components/common/EntityCard'
import { SectionHeader } from '@/components/common/SectionHeader'
import { Text } from '@/components/typography/Text'
import { Card } from '@/components/ui/Card'
import { getAcademicPath } from '@/lib/academic-routes'
import { compactStats } from '@/lib/common-utils'
import type { MinimalStudy } from '@/types/academics/study.types'

type FacultySubjectsExplorerProps = {
  studies: Array<MinimalStudy>
}

export const FacultyStudyExplorer = ({
  studies,
}: FacultySubjectsExplorerProps) => {
  return (
    <Card className='p-0 border-0 ui-stack gap-4'>
      <SectionHeader
        title={UI_STRINGS.academics.studiesTitle}
        count={studies.length}
      />

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
        <Text className='ui-caption'>{UI_STRINGS.academics.noStudies}</Text>
      )}
    </Card>
  )
}
