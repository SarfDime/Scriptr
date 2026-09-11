import Component from '@sanity/icons/Component'
import EarthGlobe from '@sanity/icons/EarthGlobe'
import Envelope from '@sanity/icons/Envelope'
import Marker from '@sanity/icons/Marker'
import User from '@sanity/icons/User'
import { OverviewCard } from '@/components/layout/OverviewCard/OverviewCard'
import type { StudyOverviewCardProps } from '@/types/academics/study.types'
import type { OverviewCardActionItem } from '@/types/components/OverviewCard.types'
import type { PersonSummary } from '@/types/components/Person.types'

export const StudyOverviewCard = ({
  study,
  ...boxProps
}: StudyOverviewCardProps) => {
  const administrators: Array<PersonSummary> = [
    ...(study.assistant ? [study.assistant] : []),
  ] // TODO: See if need to add more, get more info on study

  const actions: Array<OverviewCardActionItem> = [
    study.website && {
      key: 'website',
      icon: <EarthGlobe />,
      label: 'Visit website',
      href: study.website,
      colorPalette: 'cp-brand',
    },
    study.studentCount && {
      key: 'student-count',
      icon: <User />,
      label: `${study.studentCount.toLocaleString()} students`,
      colorPalette: 'cp-green',
    },
    study.streetAddress && {
      key: 'location',
      icon: <Marker />,
      label: 'Location',
      href: study.streetAddress,
      colorPalette: 'cp-rose',
    },
    study.email && {
      key: 'email',
      icon: <Envelope />,
      label: study.email,
      href: `mailto:${study.email}`,
      colorPalette: 'cp-amber',
      hideExternalIcon: true,
    },
  ].filter(Boolean) as Array<OverviewCardActionItem>

  return (
    <OverviewCard
      picture={study.picture}
      imageAlt={study.name || 'Study image'} //TODO: Factor these out to shared strings
      administrators={administrators}
      eyebrow='About the Study'
      eyebrowIcon={<Component />}
      description={study.description}
      actions={actions}
      {...boxProps}
    />
  )
}
