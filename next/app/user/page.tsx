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
import { FAKE_SCRIPTS } from '@/lib/fake-scripts-data'
import type { SubjectDetail } from '@/types/academics/subject.types'
import type { PortableTextType } from '@/types/components/PortableText.types'
import type { PageDataProps, Script } from '@/types/components/Scripts.types'

const subjectsContent: PortableTextType = [
  {
    _type: 'block',
    children: [{ _type: 'span', text: 'Your subjects' }],
  },
  {
    _type: 'block',
    children: [{ _type: 'span', text: 'Keep an eye on what is next.' }],
  },
]

const subjects: Array<SubjectDetail> = [
  {
    name: 'Biology',
    code: 'BIO 201',
    professors: [
      {
        _id: 'professor-3',
        name: 'Dr. Elena Park',
      },
    ],
    year: 2,
    credits: 4,
    semester: 'summer',
    description: [
      {
        _type: 'block',
        children: [
          {
            _type: 'span',
            text: 'An in-depth study of cellular processes and laboratory techniques.',
          },
        ],
      },
    ],
    _id: 'subject-3',
    _type: 'subject',
    dbId: 'bio201',
    study: {
      _id: 'study-1',
      name: 'Biology',
      faculty: {
        _id: 'faculty-1',
        name: 'Science',
        university: {
          _id: 'university-1',
          name: 'Example University',
        },
      },
    },
    syllabus: 'bio201-syllabus.pdf',
  },
  {
    name: 'Organic Chemistry',
    code: 'CHEM 204',
    professors: [
      {
        _id: 'professor-2',
        name: 'Prof. Marcus Bell',
      },
    ],
    year: 2,
    credits: 4,
    semester: 'summer',
    description: [
      {
        _type: 'block',
        children: [
          {
            _type: 'span',
            text: 'A comprehensive study of organic reactions and mechanisms.',
          },
        ],
      },
    ],
    _id: 'subject-4',
    _type: 'subject',
    dbId: 'chem204',
    study: {
      _id: 'study-2',
      name: 'Chemistry',
      faculty: {
        _id: 'faculty-1',
        name: 'Science',
        university: {
          _id: 'university-1',
          name: 'Example University',
        },
      },
    },
    syllabus: 'chem204-syllabus.pdf',
  },
  {
    name: 'Linear Algebra',
    code: 'MATH 221',
    professors: [
      {
        _id: 'professor-1',
        name: 'Prof. Adrian Cole',
      },
    ],
    year: 1,
    credits: 4,
    semester: 'summer',
    description: [
      {
        _type: 'block',
        children: [
          {
            _type: 'span',
            text: 'An introduction to vector spaces, matrices, and linear transformations.',
          },
        ],
      },
    ],
    _id: 'subject-5',
    _type: 'subject',
    dbId: 'math221',
    study: {
      _id: 'study-3',
      name: 'Mathematics',
      faculty: {
        _id: 'faculty-1',
        name: 'Science',
        university: {
          _id: 'university-1',
          name: 'Example University',
        },
      },
    },
    syllabus: 'math221-syllabus.pdf',
  },
]

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
