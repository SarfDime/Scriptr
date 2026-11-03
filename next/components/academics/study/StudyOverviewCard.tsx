import Component from '@sanity/icons/Component'
import EarthGlobe from '@sanity/icons/EarthGlobe'
import Envelope from '@sanity/icons/Envelope'
import Marker from '@sanity/icons/Marker'
import User from '@sanity/icons/User'
import { UI_STRINGS } from '@shared/config/strings'
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
  ]

  const actions: Array<OverviewCardActionItem> = [
    study.website && {
      key: 'website',
      icon: <EarthGlobe />,
      label: UI_STRINGS.academics.visitWebsite,
      href: study.website,
      colorPalette: 'cp-brand-int',
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
      label: UI_STRINGS.academics.location,
      href: study.streetAddress,
      colorPalette: 'cp-rose-int',
    },
    study.email && {
      key: 'email',
      icon: <Envelope />,
      label: study.email,
      href: `mailto:${study.email}`,
      colorPalette: 'cp-amber-int',
      hideExternalIcon: true,
    },
  ].filter(Boolean) as Array<OverviewCardActionItem>

  return (
    <OverviewCard
      picture={study.picture}
      imageAlt={study.name || UI_STRINGS.academics.studyImageAlt}
      administrators={administrators}
      eyebrow={UI_STRINGS.academics.studyAbout}
      eyebrowIcon={<Component />}
      description={study.description}
      actions={actions}
      {...boxProps}
    />
  )
}
