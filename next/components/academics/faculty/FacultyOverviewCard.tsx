import Component from '@sanity/icons/Component'
import EarthGlobe from '@sanity/icons/EarthGlobe'
import Envelope from '@sanity/icons/Envelope'
import Marker from '@sanity/icons/Marker'
import User from '@sanity/icons/User'
import { OverviewCard } from '@/components/layout/OverviewCard/OverviewCard'
import type { FacultyOverviewCardProps } from '@/types/academics/faculty.types'
import type { OverviewCardActionItem } from '@/types/components/OverviewCard.types'
import type { PersonSummary } from '@/types/components/Person.types'

export const FacultyOverviewCard = ({
  faculty,
  ...boxProps
}: FacultyOverviewCardProps) => {
  const administrators: Array<PersonSummary> = [
    ...(faculty.dean ? [faculty.dean] : []),
    ...(faculty.viceDeans ?? []),
    ...(faculty.secretary ? [faculty.secretary] : []),
  ]

  const actions: Array<OverviewCardActionItem> = [
    faculty.website && {
      key: 'website',
      icon: <EarthGlobe />,
      label: 'Visit website',
      href: faculty.website,
      colorPalette: 'cp-brand',
    },
    faculty.studentCount && {
      key: 'student-count',
      icon: <User />,
      label: `${faculty.studentCount.toLocaleString()} students`,
      colorPalette: 'cp-green',
    },
    faculty.streetAddress && {
      key: 'location',
      icon: <Marker />,
      label: 'Location',
      href: faculty.streetAddress,
      colorPalette: 'cp-rose',
    },
    faculty.email && {
      key: 'email',
      icon: <Envelope />,
      label: faculty.email,
      href: `mailto:${faculty.email}`,
      colorPalette: 'cp-amber',
      hideExternalIcon: true,
    },
  ].filter(Boolean) as Array<OverviewCardActionItem>

  return (
    <OverviewCard
      picture={faculty.picture}
      imageAlt={faculty.name || 'Faculty image'}
      administrators={administrators}
      eyebrow='About the faculty'
      eyebrowIcon={<Component />}
      description={faculty.description}
      actions={actions}
      {...boxProps}
    />
  )
}
