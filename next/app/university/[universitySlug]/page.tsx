import { Box } from '@/components/common/Box'
import { EntityCard } from '@/components/common/EntityCard'
import { NextImage } from '@/components/common/NextImage'
import { SectionHeader } from '@/components/common/SectionHeader'
import { PageLayout } from '@/components/layout/PageLayout'
import { PortableTextContent } from '@/components/typography/PortableTextContent'
import { Text } from '@/components/typography/Text'
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
      }}
      sidebar={
        <>
          {(university.streetAddress ||
            university.telephone ||
            university.email ||
            university.website) && (
            <Card className='p-6 ui-stack gap-3'>
              <SectionHeader as='h3' title='Contact & Location' />
              {university.streetAddress && (
                <Box className='ui-stack gap-0.5'>
                  <Text className='ui-label'>Address</Text>
                  <Text className='ui-body'>{university.streetAddress}</Text>
                </Box>
              )}
              {university.telephone && (
                <Box className='ui-stack gap-0.5'>
                  <Text className='ui-label'>Phone</Text>
                  <Text className='ui-body'>{university.telephone}</Text>
                </Box>
              )}
              {university.email && (
                <Box className='ui-stack gap-0.5'>
                  <Text className='ui-label'>Email</Text>
                  <Text className='ui-body'>{university.email}</Text>
                </Box>
              )}
              {university.website && (
                <Box className='ui-stack gap-0.5'>
                  <Text className='ui-label'>Website</Text>
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
              <SectionHeader as='h3' title='Administration' />
              {university.rector && (
                <Box className='ui-stack gap-0.5'>
                  <Text className='ui-label'>Rector</Text>
                  <Text className='ui-body-strong'>
                    {university.rector.name}
                  </Text>
                  {university.rector.title && (
                    <Text className='ui-caption'>
                      {university.rector.title}
                    </Text>
                  )}
                </Box>
              )}
              {university.viceRectors && university.viceRectors.length > 0 && (
                <Box className='ui-stack gap-2'>
                  <Text className='ui-label'>Vice Rectors</Text>
                  {university.viceRectors.map((vr) => (
                    <Box key={vr._id} className='ui-stack gap-0.5'>
                      <Text className='ui-body-strong'>{vr.name}</Text>
                      {vr.title && (
                        <Text className='ui-caption'>{vr.title}</Text>
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
          <SectionHeader title={`About ${university.name}`} />
          <PortableTextContent>{university.description}</PortableTextContent>
        </Card>
      )}

      <Card className='p-0 border-0 ui-stack gap-4'>
        <SectionHeader
          title='Faculties'
          count={`${university.faculties?.length ?? 0} Faculties`}
        />

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
                subtitle={faculty.studies.map((study) => study.name).join(', ')}
                media={
                  faculty.picture ? (
                    <NextImage
                      {...faculty.picture}
                      alt={`${faculty.name} Logo`}
                      fillProp
                      sizes='(min-width: 640px) 50vw, 100vw'
                      className='h-10 w-10 rounded-full'
                      objectFitProp='cover'
                    />
                  ) : undefined
                }
              />
            ))}
          </Box>
        ) : (
          <Text className='ui-caption'>
            No faculties listed for this university.
          </Text>
        )}
      </Card>
    </PageLayout>
  )
}
