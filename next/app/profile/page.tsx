import { ProfilePageClient } from '@/components/profile/ProfilePageClient'
import { fetchSanityData } from '@/sanity/lib/utils'
import { onboardingCatalogQuery } from '@/sanity/queries/onboarding.queries'
import type { OnboardingCatalog } from '@/types/onboarding.types'

export default async function ProfilePage() {
  const catalog = await fetchSanityData<OnboardingCatalog>({
    query: onboardingCatalogQuery,
    fetchOrigin: 'onboardingCatalog(profile)',
  })
  return <ProfilePageClient catalog={catalog} />
}
