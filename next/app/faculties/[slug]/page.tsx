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
import {
  getProfessorPath,
  getSubjectPath,
  getUniversityPath,
} from '@/lib/academic-routes'
import {
  facultyDetailQuery,
  facultyStaticParamsQuery,
} from '@/sanity/queries/academics/faculty.queries'
import type {
  AcademicDetailPageProps,
  FacultyDetail,
} from '@/types/academics.types'

export const dynamicParams = false

export const generateStaticParams = createAcademicStaticParams(
  facultyStaticParamsQuery,
  'faculties-static-params'
)

export const generateMetadata = createAcademicMetadata<FacultyDetail>({
  query: facultyDetailQuery,
  pageDomain: 'faculties',
  entityLabel: 'Faculty',
  fetchOriginPrefix: 'faculty',
  getDescription: (faculty) => faculty.description,
  descriptionFallback: (faculty) =>
    `Explore academic subjects, faculty administration, and professors at ${faculty.name}.`,
})

export default async function FacultyDetailPage({
  params,
}: AcademicDetailPageProps) {
  const { slug } = await params

  const faculty = await fetchAcademicDetailOrNotFound<FacultyDetail>({
    query: facultyDetailQuery,
    slug,
    fetchOrigin: `faculty-detail-${slug}`,
  })

  return (
    <PageLayout
      header={{
        greeting: faculty.university?.name ?? 'Faculty',
        title: faculty.name,
        subtitle: faculty.dbId ? `Database ID: ${faculty.dbId}` : undefined,
        actions: (
          <Box className='ui-cluster gap-2'>
            {faculty.university && (
              <NextLink href={getUniversityPath(faculty.university._id)}>
                <Badge className='cp-brand'>{faculty.university.name}</Badge>
              </NextLink>
            )}
            <NextLink href='/universities'>
              <Badge className='cp-unstyled border border-grey-300'>
                ← All Universities
              </Badge>
            </NextLink>
          </Box>
        ),
      }}
      sidebar={
        <>
          {(faculty.streetAddress ||
            faculty.telephone ||
            faculty.email ||
            faculty.website) && (
            <Card className='p-6 ui-stack gap-3'>
              <Title as='h3' className='ui-title font-semibold'>
                Contact & Location
              </Title>
              {faculty.streetAddress && (
                <Box className='ui-stack gap-0.5'>
                  <Text className='ui-caption font-bold text-grey-500'>
                    Address
                  </Text>
                  <Text className='ui-body'>{faculty.streetAddress}</Text>
                </Box>
              )}
              {faculty.telephone && (
                <Box className='ui-stack gap-0.5'>
                  <Text className='ui-caption font-bold text-grey-500'>
                    Phone
                  </Text>
                  <Text className='ui-body'>{faculty.telephone}</Text>
                </Box>
              )}
              {faculty.email && (
                <Box className='ui-stack gap-0.5'>
                  <Text className='ui-caption font-bold text-grey-500'>
                    Email
                  </Text>
                  <Text className='ui-body'>{faculty.email}</Text>
                </Box>
              )}
              {faculty.website && (
                <Box className='ui-stack gap-0.5'>
                  <Text className='ui-caption font-bold text-grey-500'>
                    Website
                  </Text>
                  <a
                    href={faculty.website}
                    target='_blank'
                    rel='noreferrer'
                    className='ui-body text-brand hover:underline break-all'
                  >
                    {faculty.website}
                  </a>
                </Box>
              )}
            </Card>
          )}

          {(faculty.dean ||
            (faculty.viceDeans && faculty.viceDeans.length > 0) ||
            faculty.secretary) && (
            <Card className='p-6 ui-stack gap-4'>
              <Title as='h3' className='ui-title font-semibold'>
                Administration
              </Title>
              {faculty.dean && (
                <Box className='ui-stack gap-0.5'>
                  <Text className='ui-caption font-bold text-grey-500'>
                    Dean
                  </Text>
                  <Text className='ui-body font-medium'>
                    {faculty.dean.name}
                  </Text>
                  {faculty.dean.title && (
                    <Text className='ui-caption text-grey-500'>
                      {faculty.dean.title}
                    </Text>
                  )}
                </Box>
              )}
              {faculty.viceDeans && faculty.viceDeans.length > 0 && (
                <Box className='ui-stack gap-2'>
                  <Text className='ui-caption font-bold text-grey-500'>
                    Vice Deans
                  </Text>
                  {faculty.viceDeans.map((vd) => (
                    <Box key={vd._id} className='ui-stack gap-0.5'>
                      <Text className='ui-body font-medium'>{vd.name}</Text>
                      {vd.title && (
                        <Text className='ui-caption text-grey-500'>
                          {vd.title}
                        </Text>
                      )}
                    </Box>
                  ))}
                </Box>
              )}
              {faculty.secretary && (
                <Box className='ui-stack gap-0.5'>
                  <Text className='ui-caption font-bold text-grey-500'>
                    Secretary
                  </Text>
                  <Text className='ui-body'>{faculty.secretary}</Text>
                </Box>
              )}
            </Card>
          )}
        </>
      }
    >
      {faculty.description && (
        <Card className='p-6 ui-stack gap-3'>
          <Title as='h2' className='ui-title font-bold'>
            About {faculty.name}
          </Title>
          <PortableTextContent>{faculty.description}</PortableTextContent>
        </Card>
      )}

      {/* Child Subjects Section */}
      <Card className='p-6 ui-stack gap-4'>
        <Box className='ui-cluster justify-between items-center'>
          <Title as='h2' className='ui-title font-bold'>
            Subjects
          </Title>
          <Badge className='cp-brand'>
            {faculty.subjects?.length ?? 0} Subjects
          </Badge>
        </Box>

        {faculty.subjects && faculty.subjects.length > 0 ? (
          <Box className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            {faculty.subjects.map((subject) => (
              <NextLink
                key={subject._id}
                href={getSubjectPath(subject._id)}
                className='group'
              >
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
                    {subject.examSession && (
                      <Text className='ui-caption capitalize'>
                        • {subject.examSession}
                      </Text>
                    )}
                  </Box>
                </Card>
              </NextLink>
            ))}
          </Box>
        ) : (
          <Text className='ui-caption text-grey-500'>
            No subjects registered under this faculty.
          </Text>
        )}
      </Card>

      {/* Child Professors Section */}
      <Card className='p-6 ui-stack gap-4'>
        <Box className='ui-cluster justify-between items-center'>
          <Title as='h2' className='ui-title font-bold'>
            Professors
          </Title>
          <Badge className='cp-brand'>
            {faculty.professors?.length ?? 0} Professors
          </Badge>
        </Box>

        {faculty.professors && faculty.professors.length > 0 ? (
          <Box className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            {faculty.professors.map((professor) => (
              <NextLink
                key={professor._id}
                href={getProfessorPath(professor._id)}
                className='group'
              >
                <Card className='p-4 h-full ui-stack gap-1 transition hover:border-brand-500 hover:shadow-sm'>
                  <Title
                    as='h3'
                    className='ui-body font-semibold group-hover:text-brand'
                  >
                    {professor.name}
                  </Title>
                  {professor.title && (
                    <Text className='ui-caption text-grey-500'>
                      {professor.title}
                    </Text>
                  )}
                  {professor.email && (
                    <Text className='ui-caption text-grey-400 mt-auto'>
                      {professor.email}
                    </Text>
                  )}
                </Card>
              </NextLink>
            ))}
          </Box>
        ) : (
          <Text className='ui-caption text-grey-500'>
            No professors assigned to this faculty.
          </Text>
        )}
      </Card>
    </PageLayout>
  )
}
