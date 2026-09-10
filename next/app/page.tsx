'use client'

import { useState } from 'react'
import { ScriptsSection } from '@/components/academics/scripts/ScriptSection'
import { SearchHeader } from '@/components/academics/scripts/SearchHeader'
import { ActivityStats } from '@/components/common/ActivityStats'
import { Box } from '@/components/common/Box'
import { PageLayout } from '@/components/layout/PageLayout'
import { SubjectsSidebar } from '@/components/Subjects/SubjectsSidebar'
import { DEFAULT_ACTIVITY_CONTENT } from '@/config/content'
import { FAKE_SCRIPTS } from '@/lib/fake-scripts-data'
import type { SubjectDetail } from '@/types/academics/subject.types'
import type { PortableTextType } from '@/types/components/PortableText.types'
import type { PageDataProps } from '@/types/components/Scripts.types'

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
    faculty: {
      _id: 'faculty-1',
      name: 'Science',
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
    faculty: {
      _id: 'faculty-1',
      name: 'Science',
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
    faculty: {
      _id: 'faculty-1',
      name: 'Science',
    },
    syllabus: 'math221-syllabus.pdf',
  },
]

const Page = ({
  greeting = 'Good morning, Nora',
  authoredCount = 8,
  commentCount = 14,
  activityContent = DEFAULT_ACTIVITY_CONTENT,
  subjects: pageSubjects = subjects,
}: PageDataProps) => {
  const [query, setQuery] = useState('')

  return (
    <PageLayout>
      <SearchHeader
        greeting={greeting}
        query={query}
        onQueryChange={setQuery}
      />

      <Box className='grid gap-10 xl:grid-cols-[minmax(0,1fr)_340px]'>
        <ScriptsSection scripts={FAKE_SCRIPTS} />
        <SubjectsSidebar subjects={pageSubjects} content={subjectsContent} />
      </Box>

      <ActivityStats // TODO: Replace hardcoded savedCount with actual data
        savedCount={4}
        authoredCount={authoredCount}
        commentCount={commentCount}
        content={activityContent}
      />
    </PageLayout>
  )
}

export default Page
