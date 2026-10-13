'use client'

import { UI_STRINGS } from '@shared/config/strings'
import { ScriptsSection } from '@/components/academics/scripts/ScriptSection'
import { SubjectsSidebar } from '@/components/academics/subject/SubjectsSidebar'
import { ActivityStats } from '@/components/common/ActivityStats'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { PageLayout } from '@/components/layout/PageLayout'
import { ProfileCard } from '@/components/profile/ProfileCard'
import { Text } from '@/components/typography/Text'
import { Divider } from '@/components/ui/Divider'
import { useProfileStats } from '@/hooks/useProfileStats'
import { getDisplayName } from '@/lib/profile-display'
import { toScriptDetails } from '@/lib/script-display'
import { useMyProfile, useMyProfileActions } from '@/providers/ProfileProvider'
import type { SubjectById } from '@/types/academics/subject.types'

type UserProfilePageProps = {
  subjects: Array<SubjectById>
}

export function UserProfilePage({ subjects }: UserProfilePageProps) {
  const profileState = useMyProfile()
  const { refresh } = useMyProfileActions()
  const statsState = useProfileStats(
    profileState.status === 'loaded' ? profileState.profile.id : null
  )

  if (profileState.status !== 'loaded') {
    return (
      <PageLayout>
        <Box className='ui-stack items-center gap-3'>
          <Text className='ui-body text-center'>
            {profileState.status === 'error'
              ? profileState.message
              : UI_STRINGS.profile.loadingLabel}
          </Text>
          {profileState.status === 'error' && (
            <Button className='button button-sm subtle' onClick={refresh}>
              {UI_STRINGS.profile.retryLabel}
            </Button>
          )}
        </Box>
      </PageLayout>
    )
  }

  const { profile } = profileState
  const displayName = getDisplayName(profile)

  return (
    <PageLayout
      header={{
        greeting: `Profile`,
        title: displayName,
        subtitle: profile.role,
        actions: (
          <Button className='button button-sm subtle'>
            {UI_STRINGS.profile.editProfileLabel}
          </Button>
        ),
      }}
      sidebar={
        <>
          <ActivityStats
            savedCount={profile.favorite_scripts.length}
            authoredCount={profile.scripts.length}
            commentCount={
              statsState.status === 'loaded'
                ? statsState.stats.comments_made
                : 0
            }
          />
          <Divider />
          <SubjectsSidebar subjects={subjects} />
        </>
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
      <Box className='ui-stack'>
        <Box className='ui-cluster items-start'>
          <ScriptsSection
            scripts={toScriptDetails(profile.scripts)}
            title={UI_STRINGS.scripts.authoredSectionTitle}
            subtitle={UI_STRINGS.scripts.authoredSectionSubtitle}
            className='grow'
          />
        </Box>
      </Box>
      <Box className='ui-stack'>
        <Box className='ui-cluster items-start'>
          <ScriptsSection
            scripts={toScriptDetails(profile.favorite_scripts)}
            title={UI_STRINGS.scripts.favoritesSectionTitle}
            subtitle={UI_STRINGS.scripts.favoritesSectionSubtitle}
            className='grow'
          />
        </Box>
      </Box>
    </PageLayout>
  )
}
