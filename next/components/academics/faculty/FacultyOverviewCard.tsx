import Component from '@sanity/icons/Component'
import EarthGlobe from '@sanity/icons/EarthGlobe'
import Envelope from '@sanity/icons/Envelope'
import Marker from '@sanity/icons/Marker'
import User from '@sanity/icons/User'
import { UI_STRINGS_PACK } from '@shared/config/strings'
import { OverviewCard } from '@/components/layout/OverviewCard/OverviewCard'
import { getServerStrings } from '@/lib/server-strings'
import type { FacultyOverviewCardProps } from '@/types/academics/faculty.types'
import type { OverviewCardActionItem } from '@/types/components/OverviewCard.types'
import type { PersonSummary } from '@/types/components/Person.types'

export const FacultyOverviewCard = async ({
  faculty,
  ...boxProps
}: FacultyOverviewCardProps) => {
  const ui = await getServerStrings(UI_STRINGS_PACK)
  const administrators: Array<PersonSummary> = [
    ...(faculty.dean ? [faculty.dean] : []),
    ...(faculty.viceDeans ?? []),
    ...(faculty.secretary ? [faculty.secretary] : []),
  ]

  const actions: Array<OverviewCardActionItem> = [
    faculty.website && {
      key: 'website',
      icon: <EarthGlobe />,
      label: ui.academics.visitWebsite,
      href: faculty.website,
      colorPalette: 'cp-brand-int',
    },
    faculty.studentCount && {
      key: 'student-count',
      icon: <User />,
      label: ui.academics.studentCount(faculty.studentCount),
      colorPalette: 'cp-green',
    },
    faculty.streetAddress && {
      key: 'location',
      icon: <Marker />,
      label: ui.academics.location,
      href: faculty.streetAddress,
      colorPalette: 'cp-rose-int',
    },
    faculty.email && {
      key: 'email',
      icon: <Envelope />,
      label: faculty.email,
      href: `mailto:${faculty.email}`,
      colorPalette: 'cp-amber-int',
      hideExternalIcon: true,
    },
  ].filter(Boolean) as Array<OverviewCardActionItem>

  return (
    <OverviewCard
      picture={faculty.picture}
      imageAlt={faculty.name || ui.academics.facultyImageAlt}
      administrators={administrators}
      eyebrow={ui.academics.aboutFaculty}
      eyebrowIcon={<Component />}
      description={faculty.description}
      actions={actions}
      {...boxProps}
    />
  )
}
