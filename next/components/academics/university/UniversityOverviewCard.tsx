import Component from '@sanity/icons/Component'
import EarthGlobe from '@sanity/icons/EarthGlobe'
import Envelope from '@sanity/icons/Envelope'
import Marker from '@sanity/icons/Marker'
import MobileDevice from '@sanity/icons/MobileDevice'
import { UI_STRINGS_PACK } from '@shared/config/strings'
import { OverviewCard } from '@/components/layout/OverviewCard/OverviewCard'
import { getServerStrings } from '@/lib/server-strings'
import type { UniversityDetail } from '@/types/academics/university.types'
import type { OverviewCardActionItem } from '@/types/components/OverviewCard.types'
import type { PersonSummary } from '@/types/components/Person.types'

export const UniversityOverviewCard = async ({
  website,
  rector,
  streetAddress,
  email,
  telephone,
  viceRectors: _viceRectors,
  ...university
}: UniversityDetail) => {
  const ui = await getServerStrings(UI_STRINGS_PACK)
  const administrators: Array<PersonSummary> = [...(rector ? [rector] : [])]

  const actions: Array<OverviewCardActionItem> = [
    website && {
      key: 'website',
      icon: <EarthGlobe />,
      label: ui.academics.visitWebsite,
      href: website,
      colorPalette: 'cp-brand-int',
    },
    streetAddress && {
      key: 'location',
      icon: <Marker />,
      label: ui.academics.location,
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
      imageAlt={university.name || ui.academics.universityImageAlt}
      administrators={administrators}
      eyebrow={ui.academics.aboutUniversity}
      eyebrowIcon={<Component />}
      actions={actions}
      {...university}
    />
  )
}
