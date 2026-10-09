import { UI_STRINGS } from '@shared/config/strings'
import { BackLink } from '@/components/common/BackLink'
import { Box } from '@/components/common/Box'
import { NextLink } from '@/components/common/NextLink'
import { SectionHeader } from '@/components/common/SectionHeader'
import { PageLayout } from '@/components/layout/PageLayout'
import { PortableTextContent } from '@/components/typography/PortableTextContent'
import { Text } from '@/components/typography/Text'
import { Title } from '@/components/typography/Title'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import {
  createAcademicMetadata,
  createAcademicStaticParams,
  fetchAcademicDetailOrNotFound,
} from '@/lib/academic-detail-page'
import { getAcademicPath } from '@/lib/academic-routes'
import {
  professorDetailQuery,
  professorStaticParamsQuery,
} from '@/sanity/queries/academics/professor.queries'
import type {
  AcademicDetailPageProps,
  ProfessorRouteParams,
} from '@/types/academics/academics.types'
import type { ProfessorDetail } from '@/types/academics/professor.types'

export const dynamicParams = false

export const generateStaticParams =
  createAcademicStaticParams<ProfessorRouteParams>(
    professorStaticParamsQuery,
    'professors-static-params'
  )

export const generateMetadata = createAcademicMetadata<
  ProfessorDetail,
  ProfessorRouteParams
>({
  query: professorDetailQuery,
  pageDomain: 'professors',
  entityLabel: 'Professor',
  fetchOriginPrefix: 'professor',
  getOwnSlug: (p) => p.professorSlug,
  getDescription: (professor) => professor.bio,
  descriptionFallback: (professor) =>
    `Academic profile, courses taught, and contact details for ${professor.name}.`,
})

export default async function ProfessorDetailPage({
  params,
}: AcademicDetailPageProps<ProfessorRouteParams>) {
  const routeParams = await params

  const professor = await fetchAcademicDetailOrNotFound<ProfessorDetail>({
    query: professorDetailQuery,
    params: routeParams,
    fetchOrigin: `professor-detail-${routeParams.professorSlug}`,
  })

  return (
    <PageLayout
      header={{
        greeting: professor.title ?? 'Academic Staff',
        title: professor.name,
        actions: (
          <>
            {professor.universities &&
              professor.universities.length > 0 &&
              professor.universities.map((uni) => (
                <BackLink
                  key={uni._id}
                  href={getAcademicPath({
                    type: 'university',
                    universitySlug: uni.slug ?? uni._id,
                  })}
                  label={uni.name}
                />
              ))}
          </>
        ),
      }}
      sidebar={
        <>
          {(professor.office ||
            professor.telephone ||
            professor.email ||
            professor.website) && (
            <Box className='ui-stack gap-3 ui-above rounded-xl border p-3'>
              <Card className='ui-stack gap-4 ui-above-inside rounded-lg border p-4'>
                <SectionHeader
                  as='h3'
                  title={UI_STRINGS.academics.professor.contactDetails}
                />
                {professor.office && (
                  <Box className='ui-stack gap-0.5'>
                    <Text className='ui-label'>
                      {UI_STRINGS.academics.professor.office}
                    </Text>
                    <Text className='ui-body'>{professor.office}</Text>
                  </Box>
                )}
                {professor.telephone && (
                  <Box className='ui-stack gap-0.5'>
                    <Text className='ui-label'>
                      {UI_STRINGS.academics.professor.phone}
                    </Text>
                    <Text className='ui-body'>{professor.telephone}</Text>
                  </Box>
                )}
                {professor.email && (
                  <Box className='ui-stack gap-0.5'>
                    <Text className='ui-label'>
                      {UI_STRINGS.academics.professor.email}
                    </Text>
                    <Text className='ui-body'>{professor.email}</Text>
                  </Box>
                )}
                {professor.website && (
                  <Box className='ui-stack gap-0.5'>
                    <Text className='ui-label'>
                      {UI_STRINGS.academics.professor.website}
                    </Text>
                    <a
                      href={professor.website}
                      target='_blank'
                      rel='noreferrer'
                      className='ui-body break-all text-brand hover:underline'
                    >
                      {professor.website}
                    </a>
                  </Box>
                )}
              </Card>
            </Box>
          )}

          {professor.faculties && professor.faculties.length > 0 && (
            <Box className='ui-stack gap-3 ui-above rounded-xl border p-3'>
              <Card className='ui-stack gap-4 ui-above-inside rounded-lg border p-4'>
                <SectionHeader
                  as='h3'
                  title={UI_STRINGS.academics.professor.affiliatedFaculties}
                />
                <Box className='ui-stack gap-2'>
                  {professor.faculties.map((fac) => (
                    <Box key={fac._id} className='ui-stack gap-0.5'>
                      <NextLink
                        href={getAcademicPath({
                          type: 'faculty',
                          universitySlug:
                            fac.university?.slug ?? fac.university?._id ?? '',
                          facultySlug: fac.slug ?? fac._id,
                        })}
                        className='ui-body-strong text-brand hover:underline'
                      >
                        {fac.name}
                      </NextLink>
                      {fac.university && (
                        <Text className='ui-caption'>
                          {fac.university.name}
                        </Text>
                      )}
                    </Box>
                  ))}
                </Box>
              </Card>
            </Box>
          )}
        </>
      }
    >
      {professor.bio && (
        <Box className='ui-stack gap-3 ui-above rounded-xl border p-3'>
          <Card className='ui-stack gap-4 ui-above-inside rounded-lg border p-4 md:p-6'>
            <SectionHeader title={UI_STRINGS.academics.professor.biography} />
            <PortableTextContent>{professor.bio}</PortableTextContent>
          </Card>
        </Box>
      )}

      <Box className='ui-stack gap-3 ui-above rounded-xl border p-3'>
        <Card className='ui-stack gap-4 ui-above-inside rounded-lg border p-4 md:p-6'>
          <SectionHeader
            title={UI_STRINGS.academics.professor.coursesTaught}
            count={UI_STRINGS.academics.professor.courseCount(
              professor.subjects?.length ?? 0
            )}
          />
          {professor.subjects && professor.subjects.length > 0 ? (
            <Box className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              {professor.subjects.map((subject) => {
                const universitySlug =
                  subject.study?.faculty?.university?.slug ??
                  subject.study?.faculty?.university?._id
                const facultySlug =
                  subject.study?.faculty?.slug ?? subject.study?.faculty?._id
                const studySlug = subject.study?.slug ?? subject.study?._id
                const href =
                  universitySlug && facultySlug && studySlug
                    ? getAcademicPath({
                        type: 'subject',
                        universitySlug,
                        facultySlug,
                        studySlug,
                        subjectSlug: subject.slug ?? subject._id,
                      })
                    : '#'

                return (
                  <NextLink key={subject._id} href={href} className='group'>
                    <Card className='ui-stack h-full gap-2 rounded-lg border p-4 transition hover:border-brand-500 hover:shadow-sm'>
                      <Box className='ui-cluster items-start justify-between gap-2'>
                        <Title
                          as='h3'
                          className='ui-body-strong group-hover:text-brand'
                        >
                          {subject.name}
                        </Title>
                        {subject.code && (
                          <Badge className='cp-unstyled border border-grey-200'>
                            {subject.code}
                          </Badge>
                        )}
                      </Box>
                      <Box className='ui-cluster mt-auto gap-2 text-grey-500'>
                        <Text className='ui-caption'>
                          {UI_STRINGS.academics.professor.year(subject.year)}
                        </Text>
                        {subject.credits !== undefined && (
                          <Text className='ui-caption'>
                            •{' '}
                            {UI_STRINGS.academics.professor.ects(
                              subject.credits
                            )}
                          </Text>
                        )}
                        {subject.study?.faculty && (
                          <Text className='ui-caption'>
                            • {subject.study.faculty.name}
                          </Text>
                        )}
                      </Box>
                    </Card>
                  </NextLink>
                )
              })}
            </Box>
          ) : (
            <Text className='ui-caption'>
              {UI_STRINGS.academics.noProfessorCourses}
            </Text>
          )}
        </Card>
      </Box>
    </PageLayout>
  )
}
