import { BackLink } from '@/components/common/BackLink'
import { Box } from '@/components/common/Box'
import { NextLink } from '@/components/common/NextLink'
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
        subtitle: professor.dbId ? `Database ID: ${professor.dbId}` : undefined,
        actions: (
          <BackLink
            href='/universities'
            label='← Universities & Faculties'
            variant='plain'
          />
        ),
      }}
      sidebar={
        <>
          {(professor.office ||
            professor.telephone ||
            professor.email ||
            professor.website) && (
            <Card className='p-6 ui-stack gap-3'>
              <Title as='h3' className='ui-title font-semibold'>
                Contact Details
              </Title>
              {professor.office && (
                <Box className='ui-stack gap-0.5'>
                  <Text className='ui-caption font-bold text-grey-500'>
                    Office
                  </Text>
                  <Text className='ui-body'>{professor.office}</Text>
                </Box>
              )}
              {professor.telephone && (
                <Box className='ui-stack gap-0.5'>
                  <Text className='ui-caption font-bold text-grey-500'>
                    Phone
                  </Text>
                  <Text className='ui-body'>{professor.telephone}</Text>
                </Box>
              )}
              {professor.email && (
                <Box className='ui-stack gap-0.5'>
                  <Text className='ui-caption font-bold text-grey-500'>
                    Email
                  </Text>
                  <Text className='ui-body'>{professor.email}</Text>
                </Box>
              )}
              {professor.website && (
                <Box className='ui-stack gap-0.5'>
                  <Text className='ui-caption font-bold text-grey-500'>
                    Website
                  </Text>
                  <a
                    href={professor.website}
                    target='_blank'
                    rel='noreferrer'
                    className='ui-body text-brand hover:underline break-all'
                  >
                    {professor.website}
                  </a>
                </Box>
              )}
            </Card>
          )}

          {professor.faculties && professor.faculties.length > 0 && (
            <Card className='p-6 ui-stack gap-3'>
              <Title as='h3' className='ui-title font-semibold'>
                Affiliated Faculties
              </Title>
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
                      className='ui-body font-medium text-brand hover:underline'
                    >
                      {fac.name}
                    </NextLink>
                    {fac.university && (
                      <Text className='ui-caption text-grey-500'>
                        {fac.university.name}
                      </Text>
                    )}
                  </Box>
                ))}
              </Box>
            </Card>
          )}
        </>
      }
    >
      {professor.bio && (
        <Card className='p-6 ui-stack gap-3'>
          <Title as='h2' className='ui-title font-bold'>
            Biography
          </Title>
          <PortableTextContent>{professor.bio}</PortableTextContent>
        </Card>
      )}

      {/* Subjects Taught */}
      <Card className='p-6 ui-stack gap-4'>
        <Box className='ui-cluster justify-between items-center'>
          <Title as='h2' className='ui-title font-bold'>
            Courses Taught
          </Title>
          <Badge className='cp-brand'>
            {professor.subjects?.length ?? 0} Courses
          </Badge>
        </Box>

        {professor.subjects && professor.subjects.length > 0 ? (
          <Box className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
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
                  <Card className='p-4 h-full ui-stack gap-2 transition hover:border-brand-500 hover:shadow-sm'>
                    <Box className='ui-cluster justify-between items-start gap-2'>
                      <Title
                        as='h3'
                        className='ui-body font-semibold group-hover:text-brand'
                      >
                        {subject.name}
                      </Title>
                      {subject.code && (
                        <Badge className='cp-unstyled border border-grey-200'>
                          {subject.code}
                        </Badge>
                      )}
                    </Box>
                    <Box className='ui-cluster gap-2 mt-auto text-grey-500'>
                      <Text className='ui-caption'>Year {subject.year}</Text>
                      {subject.credits !== undefined && (
                        <Text className='ui-caption'>
                          • {subject.credits} ECTS
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
          <Text className='ui-caption text-grey-500'>
            No courses listed for this professor.
          </Text>
        )}
      </Card>
    </PageLayout>
  )
}
