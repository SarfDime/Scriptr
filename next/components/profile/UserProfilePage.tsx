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
import { SUBJECTS_SIDEBAR_CONTENT } from '@/config/content'
import { useProfileStats } from '@/hooks/useProfileStats'
import {
  getDisplayName,
  getFacultyName,
  getUniversityName,
} from '@/lib/profile-display'
import { toScriptDetails } from '@/lib/script-display'
import { useMyProfile } from '@/providers/ProfileProvider'
import type { SubjectById } from '@/types/academics/subject.types'

type UserProfilePageProps = {
  subjects: Array<SubjectById>
}

export function UserProfilePage({ subjects }: UserProfilePageProps) {
  const profileState = useMyProfile()
  const statsState = useProfileStats(
    profileState.status === 'loaded' ? profileState.profile.id : null
  )

  if (profileState.status !== 'loaded') {
    return (
      <PageLayout>
        <Text className='ui-body text-center'>
          {profileState.status === 'error'
            ? profileState.message
            : UI_STRINGS.profile.loadingLabel}
        </Text>
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
          <Button className='button subtle ui-caption'>
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
          {subjects.length > 0 ? (
            <SubjectsSidebar
              subjects={subjects}
              content={SUBJECTS_SIDEBAR_CONTENT}
              className='grow'
            />
          ) : (
            <Box as='aside' className='ui-stack gap-3'>
              <Text className='ui-title'>Your subjects</Text>
              <Text className='ui-body text-grey-500'>
                Complete your study setup to see your current subjects here.
              </Text>
            </Box>
          )}
        </>
      }
    >
      <ProfileCard
        name={displayName}
        role={profile.role}
        location=''
        bio=''
        university={getUniversityName(profile)}
        faculty={getFacultyName(profile)}
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
