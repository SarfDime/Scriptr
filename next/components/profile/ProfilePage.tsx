import BookIcon from '@sanity/icons/Book'
import { UI_STRINGS } from '@shared/config/strings'
import { ScriptsSection } from '@/components/academics/scripts/ScriptSection'
import { ActivityStats } from '@/components/common/ActivityStats'
import { Box } from '@/components/common/Box'
import { NextLink } from '@/components/common/NextLink'
import { PageLayout } from '@/components/layout/PageLayout'
import { AchievementBadges } from '@/components/profile/AchievementBadges'
import { EditProfileButton } from '@/components/profile/EditProfileDialog'
import { PreferencesButton } from '@/components/profile/PreferencesDialog'
import { ProfileCard } from '@/components/profile/ProfileCard'
import { ProfileSubjectsSidebar } from '@/components/profile/ProfileSubjectsSidebar'
import { Divider } from '@/components/ui/Divider'
import { FlagReportButton } from '@/components/ui/FlagReportButton'
import { sortAchievements } from '@/lib/achievement-display'
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
 * The subject list is optional: the catalog profile page omits it (identity,
 * affiliations and activity only), while the study site's profile page passes
 * that study's subjects.
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
  const username = profile.username
  const reportButton =
    profile.role === 'owner' ? undefined : (
      <FlagReportButton
        targetType='user'
        targetId={profile.id}
        triggerClassName='button button-sm cp-warning-int gap-1.5'
      />
    )

  return (
    <PageLayout
      header={{
        greeting: UI_STRINGS.profile.greeting,
        title: displayName,
        subtitle: username,
        actions: isOwner ? (
          <Box className='ui-cluster gap-2 ui-above p-2.5 rounded-2xl'>
            <PreferencesButton />
            <Divider orientation='vertical' className='h-4' />
            <EditProfileButton profile={profile} />
            <NextLink
              href='/start'
              className='button button-sm subtle ui-cluster gap-1.5'
            >
              <BookIcon />
              {UI_STRINGS.profile.academics.editLabel}
            </NextLink>
          </Box>
        ) : (
          reportButton
        ),
      }}
      sidebar={
        <>
          {subjects && (
            <ProfileSubjectsSidebar
              completed={subjects.completed}
              currentlyTaking={subjects.currentlyTaking}
              title={isOwner ? undefined : UI_STRINGS.subjects.title}
              studyTip={studyTip}
            />
          )}
          {authoredCount !== undefined && commentCount !== undefined && (
            <>
              <Divider />

              <ActivityStats
                savedCount={profile.favorite_scripts.length}
                authoredCount={authoredCount}
                commentCount={commentCount}
              />
            </>
          )}
        </>
      }
    >
      <ProfileCard
        name={displayName}
        academics={academics}
        picture={profile.avatar_url ? { src: profile.avatar_url } : undefined}
        badges={
          <AchievementBadges
            achievements={sortAchievements(profile.achievements)}
          />
        }
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
