import { BackLink } from '@/components/common/BackLink'
import { Box } from '@/components/common/Box'
import { EntityCard } from '@/components/common/EntityCard'
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
import { compactStats } from '@/lib/common-utils'
import {
  universityDetailQuery,
  universityStaticParamsQuery,
} from '@/sanity/queries/academics/university.queries'
import type {
  AcademicDetailPageProps,
  UniversityRouteParams,
} from '@/types/academics/academics.types'
import type { UniversityDetail } from '@/types/academics/university.types'

export const dynamicParams = false

export const generateStaticParams =
  createAcademicStaticParams<UniversityRouteParams>(
    universityStaticParamsQuery,
    'universities-static-params'
  )

export const generateMetadata = createAcademicMetadata<
  UniversityDetail,
  UniversityRouteParams
>({
  query: universityDetailQuery,
  pageDomain: 'universities',
  entityLabel: 'University',
  fetchOriginPrefix: 'university',
  getOwnSlug: (p) => p.universitySlug,
  getDescription: (university) => university.description,
  descriptionFallback: (university) =>
    `Explore faculties, departments, and academic programs at ${university.name}.`,
})

export default async function UniversityDetailPage({
  params,
}: AcademicDetailPageProps<UniversityRouteParams>) {
  const routeParams = await params

  const university = await fetchAcademicDetailOrNotFound<UniversityDetail>({
    query: universityDetailQuery,
    params: routeParams,
    fetchOrigin: `university-detail-${routeParams.universitySlug}`,
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
          <BackLink
            href='/universities'
            label='← All Universities'
            variant='plain'
          />
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
              <EntityCard
                key={faculty._id}
                href={getAcademicPath({
                  type: 'faculty',
                  universitySlug: routeParams.universitySlug,
                  facultySlug: faculty.slug ?? faculty._id,
                })}
                title={faculty.name}
                stats={compactStats({
                  Studies: faculty.studyCount,
                  Professors: faculty.professorCount,
                })}
              />
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
