import { Box } from '@/components/common/Box'
import { EntityCard } from '@/components/common/EntityCard'
import { SectionHeader } from '@/components/common/SectionHeader'
import { Text } from '@/components/typography/Text'
import { Card } from '@/components/ui/Card'
import { getAcademicPath } from '@/lib/academic-routes'
import { compactStats } from '@/lib/common-utils'
import type { MinimalStudy } from '@/types/academics/study.types'

type StudyExplorerProps = {
  studies: Array<MinimalStudy>
  title: string
  emptyMessage: string
}

export const StudyExplorer = ({
  studies,
  title,
  emptyMessage,
}: StudyExplorerProps) => {
  return (
    <Card className='ui-stack ui-above'>
      <SectionHeader title={title} count={studies.length} />

      {studies.length > 0 ? (
        <Box className='ui-grid-split'>
          {studies.map((study) => {
            const universitySlug = study.faculty?.university?.slug
            const facultySlug = study.faculty?.slug

            if (!universitySlug || !facultySlug || !study.slug) return null

            return (
              <EntityCard
                key={study._id}
                href={getAcademicPath({
                  type: 'study',
                  universitySlug,
                  facultySlug,
                  studySlug: study.slug,
                })}
                title={study.name}
                stats={compactStats({
                  Subjects: study.subjectCount,
                  Professors: study.professorCount,
                })}
                className='ui-above-inside'
              />
            )
          })}
        </Box>
      ) : (
        <Text className='ui-caption ui-above-inside'>{emptyMessage}</Text>
      )}
    </Card>
  )
}
