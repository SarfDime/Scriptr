import { UI_STRINGS_PACK } from '@shared/config/strings'
import { Box } from '@/components/common/Box'
import { SectionHeader } from '@/components/common/SectionHeader'
import { AdministratorList } from '@/components/ui/AdministratorList'
import { getAcademicPath } from '@/lib/academic-routes'
import { cn, createPersonSummaries } from '@/lib/common-utils'
import { getServerLocale, getServerStrings } from '@/lib/server-strings'
import { catalogUrl } from '@/lib/study-origin'
import type { SubjectDetail } from '@/types/academics/subject.types'
import type { ComponentColorPalettes } from '@/types/components/ColorPalettes.types'

export const SubjectAdministrationCard = async ({
  color,
  study,
  professors,
}: Pick<SubjectDetail, 'study' | 'professors'> & {
  color: ComponentColorPalettes
}) => {
  const locale = await getServerLocale()
  const ui = await getServerStrings(UI_STRINGS_PACK)

  const faculty = study?.faculty
  const university = faculty?.university
  const universitySlug = university?.slug ?? university?._id ?? ''
  const facultySlug = faculty?.slug ?? faculty?._id ?? ''
  const studySlug = study?.slug ?? study?._id ?? ''

  const institutionAdministrators = createPersonSummaries(
    {
      target: study,
      title: ui.academics.entity.study,
      getHref: () =>
        getAcademicPath(
          {
            type: 'study',
            siteSlug: study?.siteSlug,
            universitySlug,
            facultySlug,
            studySlug,
          },
          locale
        ),
    },
    {
      target: faculty,
      title: ui.academics.entity.faculty,
      getHref: () =>
        catalogUrl(
          getAcademicPath(
            { type: 'faculty', universitySlug, facultySlug },
            locale
          ),
          locale
        ),
    },
    {
      target: university,
      title: ui.academics.entity.university,
      getHref: () =>
        catalogUrl(
          getAcademicPath({ type: 'university', universitySlug }, locale),
          locale
        ),
    }
  )
  const professorAdministrators = createPersonSummaries({
    target: professors,
    title: ui.academics.entity.professor,
    getHref: (professor) =>
      catalogUrl(
        getAcademicPath(
          {
            type: 'professor',
            professorSlug: professor.slug ?? professor._id,
          },
          locale
        ),
        locale
      ),
  })
  const administrators = [
    ...institutionAdministrators,
    ...professorAdministrators,
  ]

  return (
    <Box className='ui-stack'>
      <SectionHeader
        title={ui.academics.administration}
        titleVariant='modern'
      />

      <AdministratorList
        administrators={administrators}
        layout='detailLink'
        dividerAfter={institutionAdministrators.length - 1}
        dividerProps={{
          className: cn('cp-divider', color),
        }}
        detailLinkProps={{
          className: color,
        }}
      />
    </Box>
  )
}
