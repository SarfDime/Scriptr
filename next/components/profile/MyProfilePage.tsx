'use client'

import { useEffect } from 'react'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { PageLayout } from '@/components/layout/PageLayout'
import { ProfilePage } from '@/components/profile/ProfilePage'
import { Text } from '@/components/typography/Text'
import { useProfileStats } from '@/hooks/useProfileStats'
import { buildProfileAcademics } from '@/lib/profile-academic-links'
import { useLocale } from '@/providers/locale/LocaleProvider'
import { useUIStrings } from '@/providers/locale/use-strings'
import { useMyProfile, useMyProfileActions } from '@/providers/ProfileProvider'
import type { MyProfilePageViewModel } from '@/types/components/ProfilePage.types'

/**
 * `/user`: the signed-in user's profile. Reads the shared profile state (so
 * edits show up in place) and handles its loading and error states, then hands
 * the loaded profile to the shared `ProfilePage`, with the affiliations'
 * names and links resolved from the server-read catalog.
 */
export function MyProfilePage({ catalog, subjects }: MyProfilePageViewModel) {
  const ui = useUIStrings()
  const { locale } = useLocale()
  const profileState = useMyProfile()
  const { refresh, reload } = useMyProfileActions()
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
              : ui.profile.loadingLabel}
          </Text>
          {profileState.status === 'error' && (
            <Button className='button button-sm subtle' onClick={refresh}>
              {ui.profile.retryLabel}
            </Button>
          )}
        </Box>
      </PageLayout>
    )
  }

  const { profile } = profileState
  // A failed catalog read costs the affiliation links and leaves the names,
  // which come from the profile rows themselves.
  const academics = catalog
    ? buildProfileAcademics(
        catalog,
        profile.selected_faculties,
        profile.selected_studies,
        locale
      )
    : { universities: [], faculties: [], studies: [] }

  return (
    <ProfilePage
      profile={profile}
      academics={academics}
      subjects={subjects}
      authoredCount={profile.scripts.length}
      commentCount={
        statsState.status === 'loaded' ? statsState.stats.comments_made : 0
      }
      isOwner
    />
  )
}
