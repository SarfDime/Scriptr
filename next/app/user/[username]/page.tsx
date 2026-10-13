import { UI_STRINGS } from '@shared/config/strings'
import { notFound } from 'next/navigation'
import { ScriptsSection } from '@/components/academics/scripts/ScriptSection'
import { ActivityStats } from '@/components/common/ActivityStats'
import { Box } from '@/components/common/Box'
import { PageLayout } from '@/components/layout/PageLayout'
import { ProfileCard } from '@/components/profile/ProfileCard'
import { ApiError } from '@/lib/api/next-api'
import {
  getProfileStats,
  getPublicProfileByUsername,
} from '@/lib/api/profile-api'
import { getDisplayName } from '@/lib/profile-display'
import { toScriptDetails } from '@/lib/script-display'

/**
 * Public profile view for any user by username — no auth required.
 * Server Component: the profile/stats reads are plain async fetches
 * (getPublicProfileByUsername/getProfileStats from profile-api.ts are
 * ordinary functions, not hooks — callable from server or client code
 * alike), no client-side loading state needed since everything resolves
 * before this renders.
 */
export default async function PublicUserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params

  let profile: Awaited<ReturnType<typeof getPublicProfileByUsername>>
  try {
    profile = await getPublicProfileByUsername(username)
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound()
    throw error
  }

  if (!profile) {
    notFound()
  }

  const stats = await getProfileStats(profile.id)
  const displayName = getDisplayName(profile)

  return (
    <PageLayout
      header={{
        greeting: 'Profile',
        title: displayName,
        subtitle: profile.role,
      }}
      sidebar={
        // Favoriting is a deliberate public product choice here (see
        // PROFILE_FAVORITE_SCRIPTS_SELECT's comment in profiles.ts), so
        // savedCount is included now — it's no longer private the way it
        // was before favorite_scripts existed on the public response.
        <ActivityStats
          savedCount={profile.favorite_scripts.length}
          authoredCount={stats.scripts_uploaded}
          commentCount={stats.comments_made}
        />
      }
    >
      <ProfileCard
        name={displayName}
        role={profile.role}
        selectedFaculties={profile.selected_faculties}
        selectedStudies={profile.selected_studies}
        picture={profile.avatar_url ? { src: profile.avatar_url } : undefined}
        className='grow'
      />
      <Box className='ui-cluster items-start'>
        <ScriptsSection
          scripts={toScriptDetails(profile.scripts)}
          title={UI_STRINGS.scripts.authoredSectionTitle}
          subtitle={UI_STRINGS.scripts.authoredSectionSubtitle}
          className='grow'
        />
      </Box>
      <Box className='ui-cluster items-start'>
        <ScriptsSection
          scripts={toScriptDetails(profile.favorite_scripts)}
          title={UI_STRINGS.scripts.favoritesSectionTitle}
          subtitle={UI_STRINGS.scripts.favoritesSectionSubtitle}
          className='grow'
        />
      </Box>
    </PageLayout>
  )
}
