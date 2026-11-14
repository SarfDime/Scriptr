import Component from '@sanity/icons/Component'
import EarthGlobe from '@sanity/icons/EarthGlobe'
import Envelope from '@sanity/icons/Envelope'
import Marker from '@sanity/icons/Marker'
import User from '@sanity/icons/User'
import { UI_STRINGS_PACK } from '@shared/config/strings'
import { OverviewCard } from '@/components/layout/OverviewCard/OverviewCard'
import { getServerStrings } from '@/lib/server-strings'
import type { StudyOverviewCardProps } from '@/types/academics/study.types'
import type { OverviewCardActionItem } from '@/types/components/OverviewCard.types'
import type { PersonSummary } from '@/types/components/Person.types'

export const StudyOverviewCard = async ({
  study,
  ...boxProps
}: StudyOverviewCardProps) => {
  const ui = await getServerStrings(UI_STRINGS_PACK)
  const administrators: Array<PersonSummary> = [
    ...(study.assistant ? [study.assistant] : []),
  ]

  const actions: Array<OverviewCardActionItem> = [
    study.website && {
      key: 'website',
      icon: <EarthGlobe />,
      label: ui.academics.visitWebsite,
      href: study.website,
      colorPalette: 'cp-brand-int',
    },
    study.studentCount && {
      key: 'student-count',
      icon: <User />,
      label: ui.academics.studentCount(study.studentCount),
      colorPalette: 'cp-green',
    },
    study.streetAddress && {
      key: 'location',
      icon: <Marker />,
      label: ui.academics.location,
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
      imageAlt={study.name || ui.academics.studyImageAlt}
      administrators={administrators}
      eyebrow={ui.academics.studyAbout}
      eyebrowIcon={<Component />}
      description={study.description}
      actions={actions}
      {...boxProps}
    />
  )
}
