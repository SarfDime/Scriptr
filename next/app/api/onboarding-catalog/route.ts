import { NextResponse } from 'next/server'
import { ACADEMIC_CATALOG_TAGS } from '@/lib/sanity-tags'
import { fetchSanityData } from '@/sanity/lib/utils'
import { onboardingCatalogQuery } from '@/sanity/queries/onboarding.queries'
import type { OnboardingCatalog } from '@/types/onboarding.types'

/**
 * The setup wizard's catalog, read when the wizard opens instead of on every
 * page. The root layout used to fetch it for all pages and hand it to a client
 * provider, so every prerendered page carried a copy of the whole catalog in its
 * RSC payload — the single largest build-size cost, and one that grows with
 * subjects.
 *
 * Static with an hourly refresh: the catalog changes when an editor publishes,
 * and only the components that render it fetch this route. The publish webhook
 * revalidates the Sanity reads behind it, so the next regeneration picks the
 * change up without a redeploy.
 *
 * A failed read throws: at build that fails the deployment loudly, and on a
 * later regeneration Next keeps serving the last good copy instead of caching an
 * error for an hour.
 */
export const dynamic = 'force-static'
export const revalidate = 3600

// biome-ignore lint/style/useNamingConvention: Next.js route handlers must be named POST/GET/etc.
export async function GET() {
  const catalog = await fetchSanityData<OnboardingCatalog>({
    query: onboardingCatalogQuery,
    fetchOrigin: 'onboarding-catalog',
    tags: ACADEMIC_CATALOG_TAGS,
  })

  return NextResponse.json(catalog)
}
