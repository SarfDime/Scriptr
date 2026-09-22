'use client'

import { ScriptsSection } from '@/components/academics/scripts/ScriptSection'
import { ActivityStats } from '@/components/common/ActivityStats'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { PageLayout } from '@/components/layout/PageLayout'
import { ProfileCard } from '@/components/profile/ProfileCard'
import { SubjectsSidebar } from '@/components/Subjects/SubjectsSidebar'
import { Divider } from '@/components/ui/Divider'
import { DEFAULT_ACTIVITY_CONTENT } from '@/config/content'
import {
  FAKE_SCRIPTS,
  subjects,
  subjectsContent,
} from '@/lib/fake-scripts-data'
import type { PageDataProps } from '@/types/components/Scripts.types'

export default function Page({
  authoredCount = 8,
  commentCount = 14,
  activityContent = DEFAULT_ACTIVITY_CONTENT,
  subjects: pageSubjects = subjects,
}: PageDataProps) {
  const profile = {
    //TODO: Data should come from the server or user context
    name: 'Nora Collins',
    role: 'Student',
    initials: 'NC',
    bio: 'Biology and mathematics student building a calmer, more useful study library with the Scriptr community.',
    university: 'Northbridge University',
    faculty: 'Faculty of Science',
    location: 'BSc Biology and Mathematics',
    subjects: ['Biology', 'Organic Chemistry', 'Linear Algebra'],
    completed: 4,
    scripts: FAKE_SCRIPTS,
    favorites: FAKE_SCRIPTS,
    accent: 'blue' as const,
  }

  return (
    <PageLayout
      header={{
        greeting: `Profile`,
        title: profile.name,
        subtitle: profile.role,
        actions: (
          <Button className='button subtle ui-caption'>Edit profile</Button>
        ),
        // Edit profile should come from shared text
      }}
      sidebar={
        <>
          <ActivityStats
            savedCount={4}
            authoredCount={authoredCount}
            commentCount={commentCount}
            content={activityContent}
          />
          <Divider />
          <SubjectsSidebar
            subjects={pageSubjects}
            content={subjectsContent}
            className='grow'
          />
        </>
      }
    >
      <Box className='ui-cluster items-stretch'>
        <ProfileCard
          name={profile.name}
          role={profile.role}
          bio={profile.bio}
          university={profile.university}
          faculty={profile.faculty}
          location={profile.location}
          className='grow'
        />
      </Box>
      <Box className='ui-stack'>
        <Box className='ui-cluster items-start'>
          <ScriptsSection scripts={FAKE_SCRIPTS} className='grow' />
        </Box>
      </Box>
    </PageLayout>
  )
}
