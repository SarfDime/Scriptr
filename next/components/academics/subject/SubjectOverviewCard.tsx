import Book from '@sanity/icons/Book'
import { UI_STRINGS_PACK } from '@shared/config/strings'
import { Box } from '@/components/common/Box'
import { PortableTextContent } from '@/components/typography/PortableTextContent'
import { Text } from '@/components/typography/Text'
import { AdministratorList } from '@/components/ui/AdministratorList'
import { Card } from '@/components/ui/Card'
import { Divider } from '@/components/ui/Divider'
import { getAcademicPath } from '@/lib/academic-routes'
import { getColorPalette } from '@/lib/color-pallette-gen'
import { cn, createPersonSummaries } from '@/lib/common-utils'
import { getServerLocale, getServerStrings } from '@/lib/server-strings'
import { catalogUrl } from '@/lib/study-origin'
import type { SubjectDetail } from '@/types/academics/subject.types'

export const SubjectOverviewCard = async ({
  _id,
  description,
  study,
  professors,
}: SubjectDetail) => {
  const locale = await getServerLocale()
  const ui = await getServerStrings(UI_STRINGS_PACK)
  const color = getColorPalette({ type: 'seed', value: _id, variant: 'nb' })
  const colorBorder = getColorPalette({ type: 'seed', value: _id })

  const faculty = study?.faculty
  const university = faculty?.university
  const universitySlug = university?.slug ?? university?._id ?? ''
  const facultySlug = faculty?.slug ?? faculty?._id ?? ''
  const studySlug = study?.slug ?? study?._id ?? ''

  const administrators = createPersonSummaries(
    {
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
    },
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

  return (
    <Card className='ui-stack ui-above'>
      <Box className='ui-cluster items-start justify-between gap-5'>
        <Box className='ui-stack gap-2'>
          <Text className='ui-label-modern'>
            {ui.academics.subject.overview}
          </Text>
          {description && (
            <PortableTextContent>{description}</PortableTextContent>
          )}
        </Box>
        <Box
          className={cn(
            colorBorder,
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl'
          )}
        >
          <Book />
        </Box>
      </Box>

      <Divider className={cn('mt-auto cp-divider', colorBorder)} />

      <AdministratorList
        administrators={administrators}
        layout='detailLink'
        className='px-0'
        detailLinkProps={{
          className: color,
        }}
      />
    </Card>
  )
}
