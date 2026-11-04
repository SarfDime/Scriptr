import Component from '@sanity/icons/Component'
import EarthGlobe from '@sanity/icons/EarthGlobe'
import Envelope from '@sanity/icons/Envelope'
import Marker from '@sanity/icons/Marker'
import MobileDevice from '@sanity/icons/MobileDevice'
import { UI_STRINGS } from '@shared/config/strings'
import { OverviewCard } from '@/components/layout/OverviewCard/OverviewCard'
import type { UniversityDetail } from '@/types/academics/university.types'
import type { OverviewCardActionItem } from '@/types/components/OverviewCard.types'
import type { PersonSummary } from '@/types/components/Person.types'

export const UniversityOverviewCard = ({
  website,
  rector,
  streetAddress,
  email,
  telephone,
  viceRectors: _viceRectors,
  ...university
}: UniversityDetail) => {
  const administrators: Array<PersonSummary> = [...(rector ? [rector] : [])]

  const actions: Array<OverviewCardActionItem> = [
    website && {
      key: 'website',
      icon: <EarthGlobe />,
      label: UI_STRINGS.academics.visitWebsite,
      href: website,
      colorPalette: 'cp-brand-int',
    },
    streetAddress && {
      key: 'location',
      icon: <Marker />,
      label: UI_STRINGS.academics.location,
      href: streetAddress,
      colorPalette: 'cp-rose-int',
    },
    email && {
      key: 'email',
      icon: <Envelope />,
      label: email,
      href: `mailto:${email}`,
      colorPalette: 'cp-amber-int',
      hideExternalIcon: true,
    },
    telephone && {
      key: 'telephone',
      icon: <MobileDevice />,
      label: telephone,
      href: `tel:${telephone}`,
      colorPalette: 'cp-amber-int',
      hideExternalIcon: true,
    },
  ].filter(Boolean) as Array<OverviewCardActionItem>

  return (
    <OverviewCard
      imageAlt={university.name || UI_STRINGS.academics.universityImageAlt}
      administrators={administrators}
      eyebrow={UI_STRINGS.academics.aboutUniversity}
      eyebrowIcon={<Component />}
      actions={actions}
      {...university}
    />
  )
}
