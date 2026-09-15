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
import type { PageDataProps, Script } from '@/types/components/Scripts.types'

const authoredScripts: Array<Script> = [
  {
    title: 'Cellular Respiration Notes',
    subject: 'Biology',
    professor: 'Dr. Elena Park',
    year: '2nd year',
    likes: 28,
    comments: 5,
    id: 'script-7',
    liked: false,
    saved: false,
    color: 'cp-rose',
  },
  {
    title: 'Linear Algebra Essentials',
    subject: 'Linear Algebra',
    professor: 'Prof. Adrian Cole',
    year: '1st year',
    likes: 19,
    comments: 4,
    id: 'script-8',
    liked: false,
    saved: false,
    color: 'cp-blue',
  },
]
const favoriteScripts: Array<Script> = [
  {
    id: 'script-9',
    title: 'The Cell Cycle',
    subject: 'Biology',
    professor: 'Dr. Elena Park',
    year: '2nd year',
    likes: 38,
    comments: 6,
    liked: true,
    saved: true,
    color: 'cp-rose',
  },
  {
    title: 'Organic Chemistry Reactions',
    subject: 'Organic Chemistry',
    professor: 'Prof. Marcus Bell',
    year: '2nd year',
    likes: 24,
    comments: 3,
    id: 'script-6',
    liked: true,
    saved: true,
    color: 'cp-amber',
  },
]

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
    scripts: authoredScripts,
    favorites: favoriteScripts,
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
