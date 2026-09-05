'use client'

import { useState } from 'react'
import { ActivityStats } from '@/components/common/ActivityStats'
import { Box } from '@/components/common/Box'
import { SubjectsSidebar } from '@/components/Subjects/SubjectsSidebar'
import { ScriptsSection } from '@/components/scripts/ScriptSection'
import { SearchHeader } from '@/components/scripts/SearchHeader'
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
    color: 'rose',
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
    color: 'amber',
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
    color: 'rose',
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
    color: 'blue',
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
    color: 'sky',
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
    color: 'rose',
    progress: 72,
  },
  {
    name: 'Organic Chemistry',
    code: 'CHEM 204',
    next: 'Quiz in 3 days',
    color: 'amber',
    progress: 48,
  },
  {
    name: 'Linear Algebra',
    code: 'MATH 221',
    next: 'Problem set due Monday',
    color: 'blue',
    progress: 64,
  },
]

const Page = ({
  greeting = 'Good morning, Nora',
  authoredCount = 8,
  commentCount = 14,
  activityContent = DEFAULT_ACTIVITY_CONTENT,
  scripts: pageScripts = scripts,
  subjects: pageSubjects = subjects,
}: PageDataProps) => {
  const [query, setQuery] = useState('')
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
    <>
      <SearchHeader
        greeting={greeting}
        query={query}
        onQueryChange={setQuery}
      />

      <Box className='grid gap-10 xl:grid-cols-[minmax(0,1fr)_340px]'>
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
        />
        <SubjectsSidebar subjects={pageSubjects} content={subjectsContent} />
      </Box>

      <ActivityStats
        savedCount={saved.length}
        authoredCount={authoredCount}
        commentCount={commentCount}
        content={activityContent}
      />
    </>
  )
}

export default Page
