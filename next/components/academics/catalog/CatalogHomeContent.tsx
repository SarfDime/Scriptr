import { UI_STRINGS } from '@shared/config/strings'
import { Box } from '@/components/common/Box'
import { NextImage } from '@/components/common/NextImage'
import { SectionHeader } from '@/components/common/SectionHeader'
import { Text } from '@/components/typography/Text'
import { getAcademicPath } from '@/lib/academic-routes'
import { IMAGE_SIZES } from '@/styles/style'
import type { CatalogHomeContentProps } from '@/types/academics/catalog.types'
import { CatalogCard } from './CatalogCard'

/**
 * The root page as a directory: the universities, and the studies that each
 * lead to their own site. It deliberately shows no subjects, professors or
 * scripts — those belong to a study, and a study is a site of its own.
 *
 * Each list is a wrapped row of the same fixed-size card, so a section reads as
 * one row of tiles under its heading rather than stretched columns.
 *
 * A failed catalog read leaves the lists empty and says so, rather than
 * taking the page down: the navigation and the study picker still work.
 */
export const CatalogHomeContent = ({ catalog }: CatalogHomeContentProps) => {
  // A missing slug has no page, so it is dropped rather than linked to `/`.
  const universities = catalog.universities.flatMap((university) =>
    university.slug ? [{ ...university, slug: university.slug }] : []
  )
  const faculties = catalog.faculties.flatMap((faculty) =>
    faculty.slug && faculty.university.slug
      ? [
          {
            ...faculty,
            slug: faculty.slug,
            universitySlug: faculty.university.slug,
          },
        ]
      : []
  )
  // A study is reachable only through its site handle (its slug tuple is kept
  // for the fallback path, which cannot be used here).
  const studies = catalog.studies.flatMap((study) => {
    const universitySlug = study.faculty.university.slug
    const facultySlug = study.faculty.slug
    return study.siteSlug && universitySlug && facultySlug
      ? [
          {
            ...study,
            siteSlug: study.siteSlug,
            universitySlug,
            facultySlug,
            // The study's own slug is unused while it has a site, but the path
            // builder still takes it; a draft has only its id.
            studySlug: study.slug ?? study._id,
          },
        ]
      : []
  })

  return (
    <Box className='ui-cluster'>
      <Box as='section' className='ui-stack gap-5 grow'>
        <SectionHeader
          title={UI_STRINGS.home.universitiesTitle}
          titleVariant='heading'
          count={universities.length}
        />
        {universities.length > 0 ? (
          <Box className='ui-cluster gap-4'>
            {universities.map((university) => (
              <CatalogCard
                key={university._id}
                href={getAcademicPath({
                  type: 'university',
                  universitySlug: university.slug,
                })}
                eyebrow={UI_STRINGS.academics.entity.university}
                title={university.name}
                caption={UI_STRINGS.home.facultyCount(university.facultyCount)}
                picture={
                  university.picture && (
                    <NextImage
                      {...university.picture}
                      alt={university.name}
                      fillProp
                      sizes={IMAGE_SIZES.CATALOG_CARD}
                      className='absolute inset-0 h-full w-full'
                      objectFitProp='cover'
                    />
                  )
                }
                logo={
                  university.logo && (
                    <NextImage
                      {...university.logo}
                      alt={university.name}
                      fillProp
                      sizes={IMAGE_SIZES.AVATAR}
                      className='h-6 w-6 rounded-md'
                      objectFitProp='contain'
                    />
                  )
                }
              />
            ))}
          </Box>
        ) : (
          <Text className='ui-caption'>{UI_STRINGS.home.noUniversities}</Text>
        )}
      </Box>

      <Box as='section' className='ui-stack gap-5 grow'>
        <SectionHeader
          title={UI_STRINGS.home.facultiesTitle}
          count={faculties.length}
          titleVariant='heading'
        />
        {faculties.length > 0 ? (
          <Box className='flex w-full flex-wrap gap-4'>
            {faculties.map((faculty) => (
              <CatalogCard
                key={faculty._id}
                href={getAcademicPath({
                  type: 'faculty',
                  universitySlug: faculty.universitySlug,
                  facultySlug: faculty.slug,
                })}
                eyebrow={UI_STRINGS.academics.entity.faculty}
                title={faculty.name}
                subtitle={UI_STRINGS.home.facultySummary(
                  faculty.studyCount,
                  faculty.professorCount
                )}
                caption={faculty.university.name}
                picture={
                  faculty.picture && (
                    <NextImage
                      {...faculty.picture}
                      alt={faculty.name}
                      fillProp
                      sizes={IMAGE_SIZES.CATALOG_CARD}
                      className='absolute inset-0 h-full w-full'
                      objectFitProp='cover'
                    />
                  )
                }
                logo={
                  faculty.logo && (
                    <NextImage
                      {...faculty.logo}
                      alt={faculty.name}
                      fillProp
                      sizes={IMAGE_SIZES.AVATAR}
                      className='h-6 w-6 rounded-md'
                      objectFitProp='contain'
                    />
                  )
                }
              />
            ))}
          </Box>
        ) : (
          <Text className='ui-caption'>{UI_STRINGS.home.noFaculties}</Text>
        )}
      </Box>

      <Box as='section' className='ui-stack gap-5 grow'>
        <SectionHeader
          title={UI_STRINGS.home.studiesTitle}
          count={studies.length}
          titleVariant='heading'
        />
        {studies.length > 0 ? (
          <Box className='flex w-full flex-wrap gap-4'>
            {studies.map((study) => (
              <CatalogCard
                key={study._id}
                href={getAcademicPath({
                  type: 'study',
                  siteSlug: study.siteSlug,
                  universitySlug: study.universitySlug,
                  facultySlug: study.facultySlug,
                  studySlug: study.studySlug,
                })}
                eyebrow={UI_STRINGS.academics.entity.study}
                title={study.name}
                subtitle={UI_STRINGS.academics.studySummary(
                  study.subjectCount,
                  study.professorCount
                )}
                caption={UI_STRINGS.home.studyPath(
                  study.faculty.name,
                  study.faculty.university.name
                )}
                picture={
                  study.picture && (
                    <NextImage
                      {...study.picture}
                      alt={study.name}
                      fillProp
                      sizes={IMAGE_SIZES.CATALOG_CARD}
                      className='absolute inset-0 h-full w-full'
                      objectFitProp='cover'
                    />
                  )
                }
                logo={
                  study.logo && (
                    <NextImage
                      {...study.logo}
                      alt={study.name}
                      fillProp
                      sizes={IMAGE_SIZES.AVATAR}
                      className='h-6 w-6 rounded-md'
                      objectFitProp='contain'
                    />
                  )
                }
              />
            ))}
          </Box>
        ) : (
          <Text className='ui-caption'>{UI_STRINGS.home.noStudies}</Text>
        )}
      </Box>
    </Box>
  )
}
