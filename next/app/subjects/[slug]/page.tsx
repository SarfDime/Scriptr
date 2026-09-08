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
  getFacultyPath,
  getProfessorPath,
  getUniversityPath,
} from '@/lib/academic-routes'
import {
  subjectDetailQuery,
  subjectStaticParamsQuery,
} from '@/sanity/queries/academics/subject.queries'
import type {
  AcademicDetailPageProps,
  SubjectDetail,
} from '@/types/academics.types'

export const dynamicParams = false

export const generateStaticParams = createAcademicStaticParams(
  subjectStaticParamsQuery,
  'subjects-static-params'
)

export const generateMetadata = createAcademicMetadata<SubjectDetail>({
  query: subjectDetailQuery,
  pageDomain: 'subjects',
  entityLabel: 'Subject',
  fetchOriginPrefix: 'subject',
  getDescription: (subject) => subject.description,
  descriptionFallback: (subject) =>
    `Syllabus, academic year, exam sessions, and course details for ${subject.name}.`,
})

export default async function SubjectDetailPage({
  params,
}: AcademicDetailPageProps) {
  const { slug } = await params

  const subject = await fetchAcademicDetailOrNotFound<SubjectDetail>({
    query: subjectDetailQuery,
    slug,
    fetchOrigin: `subject-detail-${slug}`,
  })

  const faculty = subject.faculty
  const university = faculty?.university

  return (
    <PageLayout
      header={{
        greeting: faculty?.name ?? 'Subject',
        title: subject.name,
        subtitle: subject.dbId ? `Database ID: ${subject.dbId}` : undefined,
        actions: faculty && (
          <NextLink href={getFacultyPath(faculty._id)}>
            <Badge className='cp-unstyled border border-grey-300'>
              ← {faculty.name}
            </Badge>
          </NextLink>
        ),
      }}
      sidebar={
        <>
          <Card className='p-6 ui-stack gap-4'>
            <Title as='h3' className='ui-title font-semibold'>
              Curriculum Details
            </Title>
            <Box className='ui-stack gap-3'>
              <Box className='ui-cluster justify-between'>
                <Text className='ui-caption text-grey-500'>Academic Year</Text>
                <Badge className='cp-unstyled border border-grey-200'>
                  Year {subject.year}
                </Badge>
              </Box>

              {subject.code && (
                <Box className='ui-cluster justify-between'>
                  <Text className='ui-caption text-grey-500'>Course Code</Text>
                  <Text className='ui-body font-mono font-medium'>
                    {subject.code}
                  </Text>
                </Box>
              )}

              {subject.credits !== undefined && (
                <Box className='ui-cluster justify-between'>
                  <Text className='ui-caption text-grey-500'>Credits</Text>
                  <Badge className='cp-brand'>{subject.credits} ECTS</Badge>
                </Box>
              )}

              {subject.semester && (
                <Box className='ui-cluster justify-between'>
                  <Text className='ui-caption text-grey-500'>Semester</Text>
                  <Text className='ui-body capitalize'>{subject.semester}</Text>
                </Box>
              )}

              {subject.examSession && (
                <Box className='ui-cluster justify-between'>
                  <Text className='ui-caption text-grey-500'>Exam Session</Text>
                  <Text className='ui-body capitalize'>
                    {subject.examSession}
                  </Text>
                </Box>
              )}

              {subject.syllabus && (
                <Box className='ui-stack gap-1 pt-2 border-t border-grey-200'>
                  <Text className='ui-caption text-grey-500'>
                    Syllabus Link
                  </Text>
                  <a
                    href={subject.syllabus}
                    target='_blank'
                    rel='noreferrer'
                    className='ui-body text-brand hover:underline break-all'
                  >
                    View Syllabus Document ↗
                  </a>
                </Box>
              )}
            </Box>
          </Card>

          {(faculty || university) && (
            <Card className='p-6 ui-stack gap-3'>
              <Title as='h3' className='ui-title font-semibold'>
                Academic Hierarchy
              </Title>
              {university && (
                <Box className='ui-stack gap-0.5'>
                  <Text className='ui-caption font-bold text-grey-500'>
                    University
                  </Text>
                  <NextLink
                    href={getUniversityPath(university._id)}
                    className='ui-body text-brand hover:underline'
                  >
                    {university.name}
                  </NextLink>
                </Box>
              )}
              {faculty && (
                <Box className='ui-stack gap-0.5'>
                  <Text className='ui-caption font-bold text-grey-500'>
                    Faculty
                  </Text>
                  <NextLink
                    href={getFacultyPath(faculty._id)}
                    className='ui-body text-brand hover:underline'
                  >
                    {faculty.name}
                  </NextLink>
                </Box>
              )}
            </Card>
          )}
        </>
      }
    >
      {subject.description && (
        <Card className='p-6 ui-stack gap-3'>
          <Title as='h2' className='ui-title font-bold'>
            Course Overview
          </Title>
          <PortableTextContent>{subject.description}</PortableTextContent>
        </Card>
      )}

      {/* Assigned Professors */}
      <Card className='p-6 ui-stack gap-4'>
        <Box className='ui-cluster justify-between items-center'>
          <Title as='h2' className='ui-title font-bold'>
            Instructors
          </Title>
          <Badge className='cp-brand'>
            {subject.professors?.length ?? 0} Professors
          </Badge>
        </Box>

        {subject.professors && subject.professors.length > 0 ? (
          <Box className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            {subject.professors.map((prof) => (
              <NextLink
                key={prof._id}
                href={getProfessorPath(prof._id)}
                className='group'
              >
                <Card className='p-4 h-full ui-stack gap-1 transition hover:border-brand-500 hover:shadow-sm'>
                  <Title
                    as='h3'
                    className='ui-body font-semibold group-hover:text-brand'
                  >
                    {prof.name}
                  </Title>
                  {prof.title && (
                    <Text className='ui-caption text-grey-500'>
                      {prof.title}
                    </Text>
                  )}
                  {prof.email && (
                    <Text className='ui-caption text-grey-400 mt-auto'>
                      {prof.email}
                    </Text>
                  )}
                </Card>
              </NextLink>
            ))}
          </Box>
        ) : (
          <Text className='ui-caption text-grey-500'>
            No professors assigned to this course.
          </Text>
        )}
      </Card>
    </PageLayout>
  )
}
