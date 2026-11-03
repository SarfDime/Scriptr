import { Box } from '@/components/common/Box'
import { EntityCard } from '@/components/common/EntityCard'
import { NextImage } from '@/components/common/NextImage'
import { SectionHeader } from '@/components/common/SectionHeader'
import { Text } from '@/components/typography/Text'
import { Card } from '@/components/ui/Card'
import { getAcademicPath } from '@/lib/academic-routes'
import { compactStats } from '@/lib/common-utils'
import { IMAGE_SIZES } from '@/styles/style'
import type { UniversityDetail } from '@/types/academics/university.types'

type Faculty = NonNullable<UniversityDetail['faculties']>[number]

type UniversityFacultyExplorerProps = {
  faculties: Array<Faculty>
  universitySlug: string
  title: string
  emptyMessage: string
}

export const UniversityFacultyExplorer = ({
  faculties,
  universitySlug,
  title,
  emptyMessage,
}: UniversityFacultyExplorerProps) => (
  <Card className='ui-stack ui-above'>
    <SectionHeader title={title} count={`${faculties.length} Faculties`} />
    {faculties.length > 0 ? (
      <Box className='ui-grid-split'>
        {faculties
          .filter((faculty): faculty is Faculty & { slug: string } =>
            Boolean(faculty.slug)
          )
          .map((faculty) => (
            <EntityCard
              key={faculty._id}
              href={getAcademicPath({
                type: 'faculty',
                universitySlug,
                facultySlug: faculty.slug,
              })}
              className='ui-above-inside'
              title={faculty.name}
              stats={compactStats({
                Studies: faculty.studyCount,
                Professors: faculty.professorCount,
              })}
              subtitle={faculty.studies.map((study) => study.name).join(', ')}
              media={
                faculty.logo && (
                  <NextImage
                    {...faculty.logo}
                    alt={faculty.name}
                    fillProp
                    sizes={IMAGE_SIZES.AVATAR}
                    className='h-10 w-10 rounded-full'
                    objectFitProp='cover'
                  />
                )
              }
            />
          ))}
      </Box>
    ) : (
      <Text className='ui-caption'>{emptyMessage}</Text>
    )}
  </Card>
)
