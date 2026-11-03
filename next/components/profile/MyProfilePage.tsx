'use client'

import { UI_STRINGS } from '@shared/config/strings'
import { useEffect } from 'react'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { PageLayout } from '@/components/layout/PageLayout'
import { ProfilePage } from '@/components/profile/ProfilePage'
import { Text } from '@/components/typography/Text'
import { useProfileStats } from '@/hooks/useProfileStats'
import { buildProfileAcademics } from '@/lib/profile-academic-links'
import { useOnboarding } from '@/providers/onboarding/OnboardingProvider'
import { useMyProfile, useMyProfileActions } from '@/providers/ProfileProvider'
import type { MyProfilePageViewModel } from '@/types/components/ProfilePage.types'

/**
 * `/user`: the signed-in user's profile. Reads the shared profile state (so
 * edits show up in place) and handles its loading and error states, then
 * hands the loaded profile to the shared `ProfilePage`. The subjects are
 * resolved by the server page, which re-runs after an academics edit.
 */
export function MyProfilePage({ subjects, studyTip }: MyProfilePageViewModel) {
  const profileState = useMyProfile()
  const { refresh, reload } = useMyProfileActions()
  const { catalog } = useOnboarding()
  const statsState = useProfileStats(
    profileState.status === 'loaded' ? profileState.profile.id : null
  )

  // ProfileProvider fetches /me once per session, so achievements earned since
  // then (they are awarded as a side effect of other requests) would be missing.
  // Re-fetch quietly on mount: `reload` skips the loading state and keeps the
  // current profile if it fails.
  // biome-ignore lint/correctness/useExhaustiveDependencies: Mount-only. `reload` is not guaranteed a stable identity, and each reload re-renders the provider, so listing it could refetch in a loop.
  useEffect(() => {
    reload()
  }, [])

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

  return (
    <ProfilePage
      profile={profile}
      academics={buildProfileAcademics(
        catalog,
        profile.selected_faculties,
        profile.selected_studies
      )}
      subjects={subjects}
      studyTip={studyTip}
      authoredCount={profile.scripts.length}
      commentCount={
        statsState.status === 'loaded' ? statsState.stats.comments_made : 0
      }
      isOwner
    />
  )
}
