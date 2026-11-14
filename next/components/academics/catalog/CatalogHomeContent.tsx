import Book from '@sanity/icons/Book'
import Component from '@sanity/icons/Component'
import EarthGlobe from '@sanity/icons/EarthGlobe'
import { UI_STRINGS_PACK } from '@shared/config/strings'
import { Box } from '@/components/common/Box'
import { getAcademicPath } from '@/lib/academic-routes'
import { getServerLocale, getServerStrings } from '@/lib/server-strings'
import type {
  CatalogHomeContentProps,
  CatalogSectionProps,
} from '@/types/academics/catalog.types'
import { CatalogSection } from './CatalogSection'

/**
 * The root page as a directory: universities, their faculties, and the studies
 * that each lead to their own site. It deliberately shows no subjects,
 * professors or scripts — those belong to a study, and a study is a site of its
 * own.
 *
 * The three sections are columns of one surface, side by side once there is
 * room for them; each card fills its column, so the page keeps using the width
 * whether a section holds one entity or many.
 *
 * A failed catalog read leaves the lists empty and says so, rather than
 * taking the page down: the navigation and the study picker still work.
 */
export const CatalogHomeContent = async ({
  catalog,
}: CatalogHomeContentProps) => {
  const locale = await getServerLocale()
  const strings = await getServerStrings(UI_STRINGS_PACK, locale)
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

  const sections: Array<Omit<CatalogSectionProps, 'priority'>> = [
    {
      title: strings.home.universitiesTitle,
      subtitle: strings.home.universitiesSubtitle,
      empty: strings.home.noUniversities,
      icon: EarthGlobe,
      colorPalette: 'cp-rose',

      cards: universities.map((university) => ({
        key: university._id,
        href: getAcademicPath(
          {
            type: 'university',
            universitySlug: university.slug,
          },
          locale
        ),
        eyebrow: strings.academics.entity.university,
        title: university.name,
        caption: strings.home.facultyCount(university.facultyCount),
        picture: university.picture,
        logo: university.logo,
        colorPalette: 'cp-rose',
      })),
    },
    {
      title: strings.home.facultiesTitle,
      subtitle: strings.home.facultiesSubtitle,
      empty: strings.home.noFaculties,
      icon: Component,
      colorPalette: 'cp-brand',

      cards: faculties.map((faculty) => ({
        key: faculty._id,
        href: getAcademicPath(
          {
            type: 'faculty',
            universitySlug: faculty.universitySlug,
            facultySlug: faculty.slug,
          },
          locale
        ),
        eyebrow: strings.academics.entity.faculty,
        title: faculty.name,
        subtitle: strings.home.facultySummary(
          faculty.studyCount,
          faculty.professorCount
        ),
        caption: faculty.university.name,
        picture: faculty.picture,
        logo: faculty.logo,
        colorPalette: 'cp-brand',
      })),
    },
    {
      title: strings.home.studiesTitle,
      subtitle: strings.home.studiesSubtitle,
      empty: strings.home.noStudies,
      icon: Book,
      colorPalette: 'cp-amber',

      cards: studies.map((study) => ({
        key: study._id,
        href: getAcademicPath(
          {
            type: 'study',
            siteSlug: study.siteSlug,
            universitySlug: study.universitySlug,
            facultySlug: study.facultySlug,
            studySlug: study.studySlug,
          },
          locale
        ),
        eyebrow: strings.academics.entity.study,
        title: study.name,
        subtitle: strings.academics.studySummary(
          study.subjectCount,
          study.professorCount
        ),
        caption: strings.home.studyPath(
          study.faculty.name,
          study.faculty.university.name
        ),
        picture: study.picture,
        logo: study.logo,
        colorPalette: 'cp-amber',
      })),
    },
  ]

  // The first picture in the page is the likely LCP, so it loads eagerly.
  const firstFilledSection = sections.findIndex(
    (section) => section.cards.length > 0
  )

  return (
    <Box className='grid-single items-start gap-x-8 gap-y-10 md:grid-cols-2 lg:grid-cols-3 h-full'>
      {sections.map((section, index) => (
        <CatalogSection
          key={section.title}
          {...section}
          priority={index === firstFilledSection}
        />
      ))}
    </Box>
  )
}
