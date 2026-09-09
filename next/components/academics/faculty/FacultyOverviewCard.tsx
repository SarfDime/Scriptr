import Component from '@sanity/icons/Component'
import EarthGlobe from '@sanity/icons/EarthGlobe'
import Envelope from '@sanity/icons/Envelope'
import Marker from '@sanity/icons/Marker'
import User from '@sanity/icons/User'
import { Box, type BoxProps } from '@/components/common/Box'
import { NextImage } from '@/components/common/NextImage'
import { NextLink } from '@/components/common/NextLink'
import { PortableTextContent } from '@/components/typography/PortableTextContent'
import { Text } from '@/components/typography/Text'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Divider } from '@/components/ui/Divider'
import { Person } from '@/components/ui/Person'
import { cn } from '@/lib/common-utils'
import type { FacultyDetail } from '@/types/academics/faculty.types'

type FacultyOverviewCardProps = {
  faculty: FacultyDetail
} & BoxProps

export const FacultyOverviewCard = ({
  faculty,
  className,
  ...boxProps
}: FacultyOverviewCardProps) => {
  const hasAdministration =
    faculty.dean ||
    (faculty.viceDeans && faculty.viceDeans.length > 0) ||
    faculty.secretary

  return (
    <Card
      className={cn(
        'grid lg:grid-cols-[1.08fr_0.92fr] overflow-hidden p-0',
        className
      )}
      {...boxProps}
    >
      {/* Left Column: Background Image & Title Overlay */}
      <Card.Header className='relative min-h-80 overflow-hidden border-b-0 px-5 py-5 lg:border-r border-grey-300/20'>
        {faculty.picture && (
          <NextImage
            {...faculty.picture}
            alt={faculty.name || 'Faculty image'}
            className='absolute inset-0 h-full w-full object-cover'
            fillProp
          />
        )}

        {/* Pure dark gradient overlay so text stays crisp over any photo */}
        <Box className='absolute inset-0 bg-linear-to-tr from-background-100/85 via-background-100/35 to-background-100/10' />

        <Box className='relative z-10 justify-end h-full ui-stack gap-2'>
          {hasAdministration && (
            <Box className='ui-cluster px-2 py-0'>
              {faculty.dean && (
                <Person
                  title={faculty.dean.title}
                  name={faculty.dean.name}
                  descriptionProps={{ className: 'text-white/70' }}
                  nameProps={{ className: 'text-white' }}
                  titleProps={{ className: 'text-white/70' }}
                />
              )}

              <Divider
                orientation='vertical'
                className='border-background-600'
              />

              {faculty.viceDeans?.map((vd) => (
                <Person
                  key={vd._id}
                  title={vd.title}
                  name={vd.name}
                  descriptionProps={{ className: 'text-white/70' }}
                  nameProps={{ className: 'text-white' }}
                  titleProps={{ className: 'text-white/70' }}
                />
              ))}

              {faculty.secretary && (
                <Person
                  title={faculty.secretary.title}
                  name={faculty.secretary.name}
                  descriptionProps={{ className: 'text-white/70' }}
                  nameProps={{ className: 'text-white' }}
                  titleProps={{ className: 'text-white/70' }}
                />
              )}
            </Box>
          )}
        </Box>
      </Card.Header>

      {/* Right Column: Faculty Information */}
      <Card.Body className='flex flex-col justify-between p-6 ui-stack gap-6'>
        {/* Top Section: About Header & Description */}
        <Box className='ui-stack gap-3'>
          <Box className='flex items-center justify-between gap-4'>
            <Text className='ui-caption uppercase tracking-[0.16em] font-bold text-grey-500'>
              About the faculty
            </Text>
            <Component className='shrink-0 w-5 h-5 text-golden-yellow' />
          </Box>

          {faculty.description && (
            <PortableTextContent className='ui-body text-fg-400'>
              {faculty.description}
            </PortableTextContent>
          )}
        </Box>

        <Divider className='mt-auto' />

        {/* Bottom Section: Location, Contact & Actions */}
        <Box className='ui-cluster'>
          {faculty.website && (
            <NextLink
              href={faculty.website}
              className='ui-badge-fixed grow cp-brand'
            >
              <EarthGlobe /> Visit website
            </NextLink>
          )}
          {faculty.studentCount && (
            <Badge colorPalette='cp-green' className='ui-badge-fixed grow'>
              <User />
              {faculty.studentCount.toLocaleString()} students
            </Badge>
          )}
          {faculty.streetAddress && (
            <NextLink
              href={faculty.streetAddress}
              className='ui-badge-fixed cp-rose ui-caption grow'
            >
              <Marker />
              Location
            </NextLink>
          )}

          {faculty.email && (
            <NextLink
              href={`mailto:${faculty.email}`}
              className='ui-badge-fixed cp-amber ui-caption grow'
              hideExternalIcon
            >
              <Envelope />
              {faculty.email}
            </NextLink>
          )}
        </Box>
      </Card.Body>
    </Card>
  )
}
