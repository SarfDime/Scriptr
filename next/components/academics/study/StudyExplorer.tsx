import { UI_STRINGS_PACK } from '@shared/config/strings'
import { Box } from '@/components/common/Box'
import { EntityCard } from '@/components/common/EntityCard'
import { NextImage } from '@/components/common/NextImage'
import { SectionHeader } from '@/components/common/SectionHeader'
import { Text } from '@/components/typography/Text'
import { getAcademicPath } from '@/lib/academic-routes'
import { getServerLocale, getServerStrings } from '@/lib/server-strings'
import { IMAGE_SIZES } from '@/styles/style'
import type { MinimalStudy } from '@/types/academics/study.types'

type StudyExplorerProps = {
  studies: Array<MinimalStudy>
  /** Defaults to the section's own heading and empty state. */
  title?: string
  emptyMessage?: string
}

export const StudyExplorer = async ({
  studies,
  title,
  emptyMessage,
}: StudyExplorerProps) => {
  const locale = await getServerLocale()
  const ui = await getServerStrings(UI_STRINGS_PACK)
  return (
    <Box className='ui-stack ui-above'>
      <SectionHeader
        title={title ?? ui.academics.studiesTitle}
        count={studies.length}
      />

      {studies.length > 0 ? (
        <Box className='ui-grid-split'>
          {studies.map((study) => {
            const universitySlug = study.faculty?.university?.slug
            const facultySlug = study.faculty?.slug

            if (!universitySlug || !facultySlug || !study.slug) return null

            return (
              <EntityCard
                key={study._id}
                href={getAcademicPath(
                  {
                    type: 'study',
                    siteSlug: study.siteSlug,
                    universitySlug,
                    facultySlug,
                    studySlug: study.slug,
                  },
                  locale
                )}
                media={
                  study.logo ? (
                    <NextImage
                      {...study.logo}
                      alt={study.name}
                      fillProp
                      sizes={IMAGE_SIZES.AVATAR}
                      className='h-10 w-10 rounded-full'
                      objectFitProp='cover'
                    />
                  ) : undefined
                }
                title={study.name}
                subtitle={ui.academics.studySummary(
                  study.subjectCount,
                  study.professorCount
                )}
                className='ui-above-inside'
              />
            )
          })}
        </Box>
      ) : (
        <Text className='ui-caption ui-above-inside'>
          {emptyMessage ?? ui.academics.noStudies}
        </Text>
      )}
    </Box>
  )
}
