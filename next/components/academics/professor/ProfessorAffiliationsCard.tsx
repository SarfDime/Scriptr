import { UI_STRINGS_PACK } from '@shared/config/strings'
import { Box } from '@/components/common/Box'
import { NextLink } from '@/components/common/NextLink'
import { SectionHeader } from '@/components/common/SectionHeader'
import { Text } from '@/components/typography/Text'
import { Card } from '@/components/ui/Card'
import { getAcademicPath } from '@/lib/academic-routes'
import { getServerLocale, getServerStrings } from '@/lib/server-strings'
import type { ProfessorDetail } from '@/types/academics/professor.types'

type ProfessorAffiliationsCardProps = Pick<ProfessorDetail, 'faculties'>

export const ProfessorAffiliationsCard = async ({
  faculties,
}: ProfessorAffiliationsCardProps) => {
  const locale = await getServerLocale()
  const ui = await getServerStrings(UI_STRINGS_PACK)
  if (!faculties?.length) return null

  return (
    <Card className='ui-stack gap-4 ui-above'>
      <SectionHeader
        as='h3'
        title={ui.academics.professor.affiliatedFaculties}
      />
      <Box className='ui-stack gap-2'>
        {faculties.map((faculty) => {
          const universitySlug = faculty.university?.slug
          if (!universitySlug || !faculty.slug) return null

          return (
            <Box key={faculty._id} className='ui-stack gap-0.5 ui-above-inside'>
              <NextLink
                href={getAcademicPath(
                  {
                    type: 'faculty',
                    universitySlug,
                    facultySlug: faculty.slug,
                  },
                  locale
                )}
                className='ui-body-strong text-brand hover:underline'
              >
                {faculty.name}
              </NextLink>
              {faculty.university && (
                <Text className='ui-caption'>{faculty.university.name}</Text>
              )}
            </Box>
          )
        })}
      </Box>
    </Card>
  )
}
