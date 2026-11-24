import BookIcon from '@sanity/icons/Book'
import { UI_STRINGS_PACK } from '@shared/config/strings'
import { ScriptsSection } from '@/components/academics/scripts/ScriptsSection'
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
import { getStudySetupUrl } from '@/lib/academic-routes'
import { sortAchievements } from '@/lib/achievement-display'
import { getDisplayName } from '@/lib/profile-display'
import { toScriptDetails } from '@/lib/script-display'
import { getServerLocale, getServerStrings } from '@/lib/server-strings'
import { catalogUrl } from '@/lib/study-origin'
import { getScriptSubjectNames } from '@/lib/subject-ref'
import type { ProfilePageProps } from '@/types/components/ProfilePage.types'

/**
 * One profile layout for both the signed-in user's own page (`/user`) and
 * anyone's public page (`/user/[username]`). It is presentational: the pages
 * load the data and pass it in. `isOwner` adds the edit actions.
 *
 * The subject list is optional: the signed-in user's own page and the study
 * site's profile page pass it, while a public catalog profile
 * (`/user/[username]`) leaves it out — identity, affiliations and activity
 * only.
 *
 * A Server Component: every string here is resolved once, and the interactive
 * leaves (`AchievementBadges`, `ScriptsSection`, the dialogs) are the only
 * client components. The language comes from the route (`getServerLocale`), so
 * callers pass no locale.
 */
export const ProfilePage = async ({
  profile,
  academics,
  subjects,
  authoredCount,
  commentCount,
  isOwner = false,
}: ProfilePageProps) => {
  const locale = await getServerLocale()
  // One read of the subject names both script lists use; the row's own name is
  // frozen in Postgres and does not follow a language switch.
  const subjectNames = await getScriptSubjectNames(
    [...profile.scripts, ...profile.favorite_scripts].map(
      (script) => script.subject?.sanity_id
    )
  )
  const ui = await getServerStrings(UI_STRINGS_PACK, locale)
  const displayName = getDisplayName(profile)
  const username = profile.username

  // Editing academics happens in a study's own setup, and the account can hold
  // several: the newest one is the study the reader is currently in. With none
  // there is nothing to edit yet, so the catalog picker is the way in.
  const setupSiteSlug = [...profile.selected_studies]
    .sort((left, right) => right.created_at.localeCompare(left.created_at))
    .map(({ study }) => study?.site_slug)
    .find((siteSlug): siteSlug is string => Boolean(siteSlug))

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
        greeting: ui.profile.greeting,
        title: displayName,
        subtitle: username,
        actions: isOwner ? (
          <Box className='ui-cluster gap-2 ui-above p-2.5 rounded-2xl'>
            <PreferencesButton />
            <Divider orientation='vertical' />
            <EditProfileButton profile={profile} />
            <NextLink
              href={
                setupSiteSlug
                  ? getStudySetupUrl(setupSiteSlug, locale)
                  : catalogUrl('/start', locale)
              }
              className='button button-sm subtle ui-cluster gap-1.5'
            >
              <BookIcon />
              {ui.profile.academics.editLabel}
            </NextLink>
          </Box>
        ) : (
          reportButton
        ),
      }}
      sidebar={
        subjects && (
          <ProfileSubjectsSidebar
            completed={subjects.completed}
            currentlyTaking={subjects.currentlyTaking}
            title={isOwner ? undefined : ui.subjects.title}
          />
        )
      }
    >
      <ProfileCard
        name={displayName}
        academics={academics}
        authoredCount={authoredCount}
        commentCount={commentCount}
        favoriteCount={profile.favorite_scripts.length}
        picture={profile.avatar_url ? { src: profile.avatar_url } : undefined}
        badges={
          <AchievementBadges
            achievements={sortAchievements(profile.achievements)}
          />
        }
      />
      <ScriptsSection
        scripts={toScriptDetails(profile.scripts, locale, subjectNames)}
        title={ui.scripts.authoredSectionTitle}
        subtitle={ui.scripts.authoredSectionSubtitle}
        pageSize={2}
        initialPageSize={4}
      />
      <ScriptsSection
        scripts={toScriptDetails(
          profile.favorite_scripts,
          locale,
          subjectNames
        )}
        title={ui.scripts.favoritesSectionTitle}
        subtitle={ui.scripts.favoritesSectionSubtitle}
        pageSize={2}
        initialPageSize={4}
        id='favorites'
      />
    </PageLayout>
  )
}
