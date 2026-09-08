import type { Metadata } from 'next'
import { Box } from '@/components/common/Box'
import { NextLink } from '@/components/common/NextLink'
import { PageLayout } from '@/components/layout/PageLayout'
import { Text } from '@/components/typography/Text'
import { Title } from '@/components/typography/Title'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { getFacultyPath, getUniversityPath } from '@/lib/academic-routes'
import { fetchSanityData } from '@/sanity/lib/utils'
import { universityGalleryQuery } from '@/sanity/queries/academics/university.queries'
import type { UniversityGalleryData } from '@/types/academics.types'

export const metadata: Metadata = {
  title: 'Universities & Faculties | Scriptr',
  description:
    'Browse universities and their academic faculties to find relevant courses and study materials.',
}

export default async function UniversitiesPage() {
  const universities = await fetchSanityData<UniversityGalleryData>({
    query: universityGalleryQuery,
    fetchOrigin: 'universities-gallery',
  })

  return (
    <PageLayout
      header={{
        greeting: 'Academic Institutions',
        title: 'Universities & Faculties',
        subtitle:
          'Browse universities and their academic faculties to find relevant courses and study materials.',
      }}
    >
      {(!universities || universities.length === 0) && (
        <Card className='p-8 text-center'>
          <Title as='h3' className='ui-title'>
            No universities found
          </Title>
          <Text className='ui-body text-grey-500 mt-2'>
            Academic entities will appear here once configured in the CMS.
          </Text>
        </Card>
      )}

      {universities?.map((university) => (
        <Card key={university._id} className='p-6 ui-stack gap-6'>
          <Box className='ui-cluster justify-between items-center border-b border-grey-200 pb-4'>
            <Box className='ui-stack gap-1'>
              <NextLink
                href={getUniversityPath(university._id)}
                className='hover:underline'
              >
                <Title as='h2' className='ui-title text-xl font-bold'>
                  {university.name}
                </Title>
              </NextLink>
              {university.dbId && (
                <Text className='ui-caption text-grey-500'>
                  DB ID: {university.dbId}
                </Text>
              )}
            </Box>
            <NextLink href={getUniversityPath(university._id)}>
              <Badge className='cp-brand'>View University →</Badge>
            </NextLink>
          </Box>

          <Box className='ui-stack gap-3'>
            <Text className='ui-label uppercase tracking-wider text-grey-500'>
              Faculties ({university.faculties?.length ?? 0})
            </Text>

            {university.faculties && university.faculties.length > 0 ? (
              <Box className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                {university.faculties.map((faculty) => (
                  <NextLink
                    key={faculty._id}
                    href={getFacultyPath(faculty._id)}
                    className='group'
                  >
                    <Card className='p-4 h-full transition hover:border-brand-500 hover:shadow-sm'>
                      <Title
                        as='h4'
                        className='ui-body font-semibold group-hover:text-brand'
                      >
                        {faculty.name}
                      </Title>
                      {faculty.dbId && (
                        <Text className='ui-caption text-grey-400 mt-1'>
                          Linked
                        </Text>
                      )}
                    </Card>
                  </NextLink>
                ))}
              </Box>
            ) : (
              <Text className='ui-caption text-grey-400 italic'>
                No faculties listed under this university.
              </Text>
            )}
          </Box>
        </Card>
      ))}
    </PageLayout>
  )
}
