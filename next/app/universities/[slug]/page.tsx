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
import { getFacultyPath } from '@/lib/academic-routes'
import {
  universityDetailQuery,
  universityStaticParamsQuery,
} from '@/sanity/queries/academics/university.queries'
import type { AcademicDetailPageProps } from '@/types/academics/academics.types'
import type { UniversityDetail } from '@/types/academics/university.types'

export const dynamicParams = false

export const generateStaticParams = createAcademicStaticParams(
  universityStaticParamsQuery,
  'universities-static-params'
)

export const generateMetadata = createAcademicMetadata<UniversityDetail>({
  query: universityDetailQuery,
  pageDomain: 'universities',
  entityLabel: 'University',
  fetchOriginPrefix: 'university',
  getDescription: (university) => university.description,
  descriptionFallback: (university) =>
    `Explore faculties, departments, and academic programs at ${university.name}.`,
})

export default async function UniversityDetailPage({
  params,
}: AcademicDetailPageProps) {
  const { slug } = await params

  const university = await fetchAcademicDetailOrNotFound<UniversityDetail>({
    query: universityDetailQuery,
    slug,
    fetchOrigin: `university-detail-${slug}`,
  })

  return (
    <PageLayout
      header={{
        greeting: 'University',
        title: university.name,
        subtitle: university.dbId
          ? `Database ID: ${university.dbId}`
          : undefined,
        actions: (
          <NextLink href='/universities'>
            <Badge className='cp-unstyled border border-grey-300'>
              ← All Universities
            </Badge>
          </NextLink>
        ),
      }}
      sidebar={
        <>
          {(university.streetAddress ||
            university.telephone ||
            university.email ||
            university.website) && (
            <Card className='p-6 ui-stack gap-3'>
              <Title as='h3' className='ui-title font-semibold'>
                Contact & Location
              </Title>
              {university.streetAddress && (
                <Box className='ui-stack gap-0.5'>
                  <Text className='ui-caption font-bold text-grey-500'>
                    Address
                  </Text>
                  <Text className='ui-body'>{university.streetAddress}</Text>
                </Box>
              )}
              {university.telephone && (
                <Box className='ui-stack gap-0.5'>
                  <Text className='ui-caption font-bold text-grey-500'>
                    Phone
                  </Text>
                  <Text className='ui-body'>{university.telephone}</Text>
                </Box>
              )}
              {university.email && (
                <Box className='ui-stack gap-0.5'>
                  <Text className='ui-caption font-bold text-grey-500'>
                    Email
                  </Text>
                  <Text className='ui-body'>{university.email}</Text>
                </Box>
              )}
              {university.website && (
                <Box className='ui-stack gap-0.5'>
                  <Text className='ui-caption font-bold text-grey-500'>
                    Website
                  </Text>
                  <a
                    href={university.website}
                    target='_blank'
                    rel='noreferrer'
                    className='ui-body text-brand hover:underline break-all'
                  >
                    {university.website}
                  </a>
                </Box>
              )}
            </Card>
          )}

          {(university.rector ||
            (university.viceRectors && university.viceRectors.length > 0)) && (
            <Card className='p-6 ui-stack gap-4'>
              <Title as='h3' className='ui-title font-semibold'>
                Administration
              </Title>
              {university.rector && (
                <Box className='ui-stack gap-0.5'>
                  <Text className='ui-caption font-bold text-grey-500'>
                    Rector
                  </Text>
                  <Text className='ui-body font-medium'>
                    {university.rector.name}
                  </Text>
                  {university.rector.title && (
                    <Text className='ui-caption text-grey-500'>
                      {university.rector.title}
                    </Text>
                  )}
                </Box>
              )}
              {university.viceRectors && university.viceRectors.length > 0 && (
                <Box className='ui-stack gap-2'>
                  <Text className='ui-caption font-bold text-grey-500'>
                    Vice Rectors
                  </Text>
                  {university.viceRectors.map((vr) => (
                    <Box key={vr._id} className='ui-stack gap-0.5'>
                      <Text className='ui-body font-medium'>{vr.name}</Text>
                      {vr.title && (
                        <Text className='ui-caption text-grey-500'>
                          {vr.title}
                        </Text>
                      )}
                    </Box>
                  ))}
                </Box>
              )}
            </Card>
          )}
        </>
      }
    >
      {university.description && (
        <Card className='p-6 ui-stack gap-3'>
          <Title as='h2' className='ui-title font-bold'>
            About {university.name}
          </Title>
          <PortableTextContent>{university.description}</PortableTextContent>
        </Card>
      )}

      <Card className='p-6 ui-stack gap-4'>
        <Box className='ui-cluster justify-between items-center'>
          <Title as='h2' className='ui-title font-bold'>
            Faculties
          </Title>
          <Badge className='cp-brand'>
            {university.faculties?.length ?? 0} Faculties
          </Badge>
        </Box>

        {university.faculties && university.faculties.length > 0 ? (
          <Box className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            {university.faculties.map((faculty) => (
              <NextLink
                key={faculty._id}
                href={getFacultyPath(faculty._id)}
                className='group'
              >
                <Card className='p-4 h-full ui-stack gap-2 transition hover:border-brand-500 hover:shadow-sm'>
                  <Title
                    as='h3'
                    className='ui-body font-semibold group-hover:text-brand'
                  >
                    {faculty.name}
                  </Title>
                  <Box className='ui-cluster gap-2 mt-auto text-grey-500'>
                    {faculty.studyCount !== undefined && (
                      <Text className='ui-caption'>
                        {faculty.studyCount} Studies
                      </Text>
                    )}
                    {faculty.professorCount !== undefined && (
                      <Text className='ui-caption'>
                        • {faculty.professorCount} Professors
                      </Text>
                    )}
                  </Box>
                </Card>
              </NextLink>
            ))}
          </Box>
        ) : (
          <Text className='ui-caption text-grey-500'>
            No faculties listed for this university.
          </Text>
        )}
      </Card>
    </PageLayout>
  )
}
