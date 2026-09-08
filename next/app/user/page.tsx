'use client'

import { useState } from 'react'
import { ActivityStats } from '@/components/common/ActivityStats'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { PageLayout } from '@/components/layout/PageLayout'
import { ProfileCard } from '@/components/profile/ProfileCard'
import { SubjectsSidebar } from '@/components/Subjects/SubjectsSidebar'
import { ScriptsSection } from '@/components/scripts/ScriptSection'
import { Divider } from '@/components/ui/Divider'
import { DEFAULT_ACTIVITY_CONTENT } from '@/config/content'
import type { PortableTextType } from '@/types/components/PortableText.types'
import type {
  PageDataProps,
  Script,
  ScriptId,
  SortOption,
} from '@/types/components/Scripts.types'
import type { Subject } from '@/types/components/Subjects.types'

const scriptSectionContent: PortableTextType = [
  {
    _type: 'block',
    children: [{ _type: 'span', text: 'Continue learning' }],
  },
  {
    _type: 'block',
    children: [
      { _type: 'span', text: 'Scripts from your subjects and community.' },
    ],
  },
]
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

const scripts: Array<Script> = [
  {
    id: 'script-1',
    title: 'The Cell Cycle',
    subject: 'Biology',
    professor: 'Dr. Elena Park',
    year: '2nd year',
    author: 'Maya Chen',
    updated: 'Today',
    likes: 38,
    comments: 6,
    color: 'cp-rose',
    saved: true,
    liked: true,
    tag: 'Exam prep',
  },
  {
    id: 'script-2',
    title: 'Organic Chemistry Reactions',
    subject: 'Chemistry',
    professor: 'Prof. Marcus Bell',
    year: '2nd year',
    author: 'Leo Martins',
    updated: 'Yesterday',
    likes: 24,
    comments: 3,
    color: 'cp-amber',
    tag: 'Study guide',
    liked: true,
    saved: false,
  },
  {
    id: 'script-3',
    title: 'Macbeth: Ambition & Guilt',
    subject: 'English',
    professor: 'Dr. Fiona Shaw',
    year: '1st year',
    author: 'Noah Williams',
    updated: '2 days ago',
    likes: 51,
    comments: 11,
    color: 'cp-rose',
    saved: true,
    tag: 'Literature',
    liked: true,
  },
  {
    id: 'script-4',
    title: 'Linear Algebra Essentials',
    subject: 'Mathematics',
    professor: 'Prof. Adrian Cole',
    year: '1st year',
    author: 'Ari Patel',
    updated: '4 days ago',
    likes: 19,
    comments: 4,
    color: 'cp-blue',
    tag: 'Reference',
    liked: false,
    saved: true,
  },
  {
    id: 'script-5',
    title: 'European History 1914-1945',
    subject: 'History',
    professor: 'Dr. Sofia Rossi',
    year: '3rd year',
    author: 'Sofia Rossi',
    updated: 'Last week',
    likes: 42,
    comments: 8,
    color: 'cp-sky',
    tag: 'Review',
    liked: false,
    saved: true,
  },
]

const subjects: Array<Subject> = [
  {
    name: 'Biology',
    code: 'BIO 201',
    next: 'Lab report due Friday',
    color: 'cp-rose',
    progress: 72,
  },
  {
    name: 'Organic Chemistry',
    code: 'CHEM 204',
    next: 'Quiz in 3 days',
    color: 'cp-amber',
    progress: 48,
  },
  {
    name: 'Linear Algebra',
    code: 'MATH 221',
    next: 'Problem set due Monday',
    color: 'cp-blue',
    progress: 64,
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
  scripts: pageScripts = scripts,
  subjects: pageSubjects = subjects,
}: PageDataProps) {
  // TODO: All logic here should be factored out, look at ScriptFilters
  const [showProfessor, setShowProfessor] = useState(false)
  const profile = showProfessor
    ? {
        name: 'Dr. Elena Park',
        role: 'Professor',
        initials: 'EP',
        bio: 'Biology lecturer focused on making complex systems easier to understand through clear, visual notes.',
        university: 'Northbridge University',
        faculty: 'Faculty of Life Sciences',
        location: 'Department of Biology',
        subjects: ['Cell Biology', 'Genetics', 'Human Physiology'],
        completed: 7,
        scripts: [
          {
            title: 'The Cell Cycle',
            subject: 'Biology',
            professor: 'Dr. Elena Park',
            year: '2nd year',
            likes: 38,
            comments: 6,
            color: 'cp-rose' as const,
          },
        ],
        favorites: [] as Array<Script>,
        accent: 'rose' as const,
      }
    : {
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

  const [query] = useState('')
  const [subject, setSubject] = useState('')
  const [sort, setSort] = useState<SortOption>('Recently updated')
  const [saved, setSaved] = useState<Array<ScriptId>>(
    pageScripts.filter((script) => script.saved).map((script) => script.id)
  )
  const [liked, setLiked] = useState<Array<ScriptId>>(
    pageScripts.filter((script) => script.liked).map((script) => script.id)
  )

  const subjectOptions = Array.from(
    new Set(pageScripts.map((script) => script.subject))
  )

  const filteredScripts = pageScripts
    .filter((script) => {
      const matchesQuery =
        `${script.title} ${script.subject} ${script.professor} ${script.author}`
          .toLowerCase()
          .includes(query.toLowerCase())
      const matchesSubject = subject === '' || script.subject === subject
      return matchesQuery && matchesSubject
    })
    .sort((a, b) => (sort === 'Title A-Z' ? a.title.localeCompare(b.title) : 0))

  const toggleSaved = (id: ScriptId) =>
    setSaved((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    )

  const toggleLiked = (id: ScriptId) =>
    setLiked((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    )
  return (
    <PageLayout
      header={{
        greeting: `Profile`,
        title: profile.name,
        subtitle: profile.role,
        actions: (
          <Button
            onClick={() => setShowProfessor(!showProfessor)}
            className='button subtle ui-caption'
          >
            Edit profile
          </Button>
        ),
      }}
      sidebar={
        <>
          <ActivityStats
            savedCount={saved.length}
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
          <ScriptsSection
            content={scriptSectionContent}
            scripts={filteredScripts}
            subjectOptions={subjectOptions}
            subject={subject}
            sort={sort}
            onSubjectChange={setSubject}
            onSortChange={setSort}
            savedIds={saved}
            likedIds={liked}
            onToggleSaved={toggleSaved}
            onToggleLiked={toggleLiked}
            className='grow'
          />
        </Box>
      </Box>
    </PageLayout>
  )
}
