import { UI_STRINGS } from '@shared/config/strings'
import { ScriptsSection } from '@/components/academics/scripts/ScriptSection'
import { ActivityStats } from '@/components/common/ActivityStats'
import { Box } from '@/components/common/Box'
import { PageLayout } from '@/components/layout/PageLayout'
import { EditAcademicsButton } from '@/components/profile/EditAcademicsDialog'
import { EditProfileButton } from '@/components/profile/EditProfileDialog'
import { ProfileCard } from '@/components/profile/ProfileCard'
import { ProfileSubjectsSidebar } from '@/components/profile/ProfileSubjectsSidebar'
import { Divider } from '@/components/ui/Divider'
import { getDisplayName } from '@/lib/profile-display'
import { toScriptDetails } from '@/lib/script-display'
import type { ProfilePageProps } from '@/types/components/ProfilePage.types'

/**
 * One profile layout for both the signed-in user's own page (`/user`) and
 * anyone's public page (`/user/[username]`). It is presentational: how the
 * data is loaded differs (the own page reads the shared profile state and
 * can be refreshed after edits; the public one is fetched on the server),
 * so the callers load it and pass it in. `isOwner` adds the edit actions.
 *
 * Favorites and subjects are public (the public profile endpoint returns
 * both), so the sidebar is the same for every viewer.
 */
export const ProfilePage = ({
  profile,
  academics,
  subjects,
  authoredCount,
  commentCount,
  isOwner = false,
  studyTip,
}: ProfilePageProps) => {
  const displayName = getDisplayName(profile)

  return (
    <PageLayout
      header={{
        greeting: UI_STRINGS.profile.greeting,
        title: displayName,
        subtitle: profile.role,
        actions: isOwner ? (
          <Box className='ui-cluster gap-2'>
            <EditProfileButton profile={profile} />
            <EditAcademicsButton profile={profile} />
          </Box>
        ) : undefined,
      }}
      sidebar={
        <>
          <ProfileSubjectsSidebar
            completed={subjects.completed}
            currentlyTaking={subjects.currentlyTaking}
            title={isOwner ? undefined : UI_STRINGS.subjects.title}
            studyTip={studyTip}
          />
          <Divider />

          <ActivityStats
            savedCount={profile.favorite_scripts.length}
            authoredCount={authoredCount}
            commentCount={commentCount}
          />
        </>
      }
    >
      <ProfileCard
        name={displayName}
        academics={academics}
        picture={profile.avatar_url ? { src: profile.avatar_url } : undefined}
      />
      <ScriptsSection
        scripts={toScriptDetails(profile.scripts)}
        title={UI_STRINGS.scripts.authoredSectionTitle}
        subtitle={UI_STRINGS.scripts.authoredSectionSubtitle}
        className='grow'
      />
      <ScriptsSection
        scripts={toScriptDetails(profile.favorite_scripts)}
        title={UI_STRINGS.scripts.favoritesSectionTitle}
        subtitle={UI_STRINGS.scripts.favoritesSectionSubtitle}
        className='grow'
      />
    </PageLayout>
  )
}
