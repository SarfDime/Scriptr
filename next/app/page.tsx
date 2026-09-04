'use client'

import { useState } from 'react'
import { ActivityStats } from '@/components/common/ActivityStats'
import { Box } from '@/components/common/Box'
import { SubjectsSidebar } from '@/components/Subjects/SubjectsSidebar'
import type { SortOption } from '@/components/scripts/ScriptFilters'
import { ScriptsSection } from '@/components/scripts/ScriptSection'
import { SearchHeader } from '@/components/scripts/SearchHeader'
import type { Script, Subject } from '@/types/components/Scripts.types'

interface PageDataProps {
  scripts: Array<Script>
  subjects: Array<Subject>
  greeting?: string
  authoredCount?: number
  commentCount?: number
}

const scripts: Array<Script> = [
  {
    id: 1,
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
    id: 2,
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
    id: 3,
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
    id: 4,
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
    id: 5,
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
}: PageDataProps) => {
  const [query, setQuery] = useState('')
  const [subject, setSubject] = useState('All subjects')
  const [sort, setSort] = useState<SortOption>('Recently updated')
  const [saved, setSaved] = useState<Array<number>>(
    scripts.filter((script) => script.saved).map((script) => script.id)
  )
  const [liked, setLiked] = useState<Array<number>>(
    scripts.filter((script) => script.liked).map((script) => script.id)
  )

  const subjectOptions = Array.from(
    new Set(scripts.map((script) => script.subject))
  )

  const filteredScripts = scripts
    .filter((script) => {
      const matchesQuery =
        `${script.title} ${script.subject} ${script.professor} ${script.author}`
          .toLowerCase()
          .includes(query.toLowerCase())
      const matchesSubject =
        subject === 'All subjects' || script.subject === subject
      return matchesQuery && matchesSubject
    })
    .sort((a, b) =>
      sort === 'Title A-Z' ? a.title.localeCompare(b.title) : a.id - b.id
    )

  const toggleSaved = (id: number) =>
    setSaved((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    )

  const toggleLiked = (id: number) =>
    setLiked((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    )

  return (
    <>
      {/* <Box
      as='main'
      className='mx-auto max-w-360 ui-stack gap-10 px-5 py-8 lg:px-10 lg:py-12'
    > */}
      <SearchHeader
        greeting={greeting}
        query={query}
        onQueryChange={setQuery}
      />

      <Box className='grid gap-10 xl:grid-cols-[minmax(0,1fr)_340px]'>
        <ScriptsSection
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
        <SubjectsSidebar subjects={subjects} />
      </Box>

      <ActivityStats
        savedCount={saved.length}
        authoredCount={authoredCount}
        commentCount={commentCount}
      />
      {/* </Box> */}
    </>
  )
}

export default Page
