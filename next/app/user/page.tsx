'use client'

import { UI_STRINGS } from '@shared/config/strings'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
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

// `subjects`/`subjectsContent` still feed SubjectsSidebar with fake data —
// out of scope here (see this task's summary): making that dynamic means
// resolving profile.subjects' subject_ids against Sanity, a separate
// fetch this change doesn't add. Only the FAKE_SCRIPTS import is dropped.
import { subjects, subjectsContent } from '@/lib/fake-scripts-data'
import {
  getDisplayName,
  getFacultyName,
  getUniversityName,
} from '@/lib/profile-display'
import { toScriptDetails } from '@/lib/script-display'
import { useMyProfile } from '@/providers/ProfileProvider'
import { useSession } from '@/providers/SessionProvider'

export default function Page() {
  const router = useRouter()
  const { session } = useSession()
  const profileState = useMyProfile()
  const statsState = useProfileStats(
    profileState.status === 'loaded' ? profileState.profile.id : null
  )

  useEffect(() => {
    if (session.status === 'unauthenticated') {
      router.replace('/auth')
    }
  }, [session.status, router])

  if (session.status !== 'authenticated' || profileState.status !== 'loaded') {
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
          <SubjectsSidebar
            subjects={subjects}
            content={subjectsContent}
            className='grow'
          />
        </>
      }
    >
      <Box className='ui-cluster items-stretch'>
        <ProfileCard
          name={displayName}
          role={profile.role}
          location=''
          bio=''
          // TODO: Add bio to profile or remove it from card and types, same with location
          // TODO: Make university study and faculty links instead of just names
          university={getUniversityName(profile)}
          faculty={getFacultyName(profile)}
          picture={profile.avatar_url ? { src: profile.avatar_url } : undefined}
          className='grow'
        />
      </Box>
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
