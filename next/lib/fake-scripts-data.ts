import type { PortableTextValue } from '@shared/types/portable-text.types'
import type { SubjectDetail } from '@/types/academics/subject.types'
import type { ScriptDetail } from '@/types/components/Scripts.types'

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000)

export const FAKE_SCRIPTS: Array<ScriptDetail> = [
  {
    id: 'script-1',
    title: [
      {
        _key: 'block-1',
        _type: 'block',
        children: [
          {
            _key: 'block-1-span-1',
            _type: 'span',
            text: 'The Cell Cycle',
          },
        ],
      },
    ],
    tag: 'Exam prep',
    subject: 'Cell Biology',
    professor: 'Dr. Elena Park',
    year: 1,
    author: 'Maya Chen',
    updatedAt: daysAgo(0),
    likes: 38,
    comments: 6,
  },
  {
    id: 'script-2',
    title: [
      {
        _key: 'block-1',
        _type: 'block',
        children: [
          {
            _key: 'block-1-span-1',
            _type: 'span',
            text: 'Mitosis and Meiosis',
          },
        ],
      },
    ],
    tag: 'Study guide',
    subject: 'Cell Biology',
    professor: 'Dr. Elena Park',
    year: 1,
    author: 'Leo Martins',
    updatedAt: daysAgo(1),
    likes: 24,
    comments: 3,
  },
  {
    id: 'script-3',
    title: [
      {
        _key: 'block-1',
        _type: 'block',
        children: [
          {
            _key: 'block-1-span-1',
            _type: 'span',
            text: 'Membrane Transport',
          },
        ],
      },
    ],
    tag: 'Reference',
    subject: 'Cell Biology',
    professor: 'Dr. Elena Park',
    year: 1,
    author: 'Noah Williams',
    updatedAt: daysAgo(2),
    likes: 51,
    comments: 11,
  },
  {
    id: 'script-4',
    title: [
      {
        _key: 'block-1',
        _type: 'block',
        children: [
          {
            _key: 'block-1-span-1',
            _type: 'span',
            text: 'DNA Replication Overview',
          },
        ],
      },
    ],
    tag: 'Study guide',
    subject: 'Genetics',
    professor: 'Dr. Elena Park',
    year: 1,
    author: 'Priya Nair',
    updatedAt: daysAgo(5),
    likes: 17,
    comments: 2,
  },
]

export const subjectsContent: PortableTextValue = [
  {
    _key: 'block-1',
    _type: 'block',
    children: [
      {
        _key: 'block-1-span-1',
        _type: 'span',
        text: 'Your subjects',
      },
    ],
  },
  {
    _key: 'block-2',
    _type: 'block',
    children: [
      {
        _key: 'block-2-span-1',
        _type: 'span',
        text: 'Keep an eye on what is next.',
      },
    ],
  },
]

export const subjects: Array<SubjectDetail> = [
  {
    name: 'Biology',
    code: 'BIO 201',
    professors: [
      {
        slug: 'elena-park',
        _id: 'professor-3',
        dbId: 'prof3',
        title: 'Associate Professor',
        picture: {
          _type: 'image',
          asset: {
            _ref: 'elena-park.jpg',
            _type: 'reference',
          },
        },
        email: 'elena.park@example.com',
        name: 'Dr. Elena Park',
      },
    ],
    year: 2,
    credits: 4,
    semester: 'summer',
    description: [
      {
        _key: 'block-1',
        _type: 'block',
        children: [
          {
            _key: 'span-1',
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
      dbId: 'bio201',
      _id: 'study-1',
      slug: 'biology',
      name: 'Biology',
      faculty: {
        _id: 'faculty-1',
        slug: 'science',
        name: 'Science',
        university: {
          _id: 'university-1',
          slug: 'ukim',
          name: 'Example University',
        },
      },
    },
    slug: 'bio201',
    faculty: {
      dbId: 'fac1',
      _id: 'faculty-1',
      slug: 'science',
      name: 'Science',
      university: {
        _id: 'university-1',
        slug: 'ukim',
        name: 'Example University',
      },
    },
    syllabus: 'bio201-syllabus.pdf',
  },
  {
    faculty: {
      dbId: 'fac1',
      _id: 'faculty-1',
      slug: 'science',
      name: 'Science',
      university: {
        _id: 'university-1',
        slug: 'ukim',
        name: 'Example University',
      },
    },
    slug: 'chem204',
    name: 'Organic Chemistry',
    code: 'CHEM 204',
    professors: [
      {
        slug: 'marcus-bell',
        dbId: 'prof2',
        email: 'marcus.bell@example.com',
        title: 'Associate Professor',
        picture: {
          _type: 'image',
          asset: {
            _ref: 'marcus-bell.jpg',
            _type: 'reference',
          },
        },
        _id: 'professor-2',
        name: 'Prof. Marcus Bell',
      },
    ],
    year: 2,
    credits: 4,
    semester: 'summer',
    description: [
      {
        _key: 'block-1',
        _type: 'block',
        children: [
          {
            _key: 'span-1',
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
      dbId: 'chem204',
      _id: 'study-2',
      slug: 'chemistry',
      name: 'Chemistry',
      faculty: {
        _id: 'faculty-1',
        slug: 'science',
        name: 'Science',
        university: {
          _id: 'university-1',
          slug: 'ukim',
          name: 'Example University',
        },
      },
    },
    syllabus: 'chem204-syllabus.pdf',
  },
  {
    slug: 'math221',
    faculty: {
      dbId: 'fac1',
      _id: 'faculty-1',
      slug: 'science',
      name: 'Science',
      university: {
        _id: 'university-1',
        slug: 'ukim',
        name: 'Example University',
      },
    },
    name: 'Linear Algebra',
    code: 'MATH 221',
    professors: [
      {
        slug: 'adrian-cole',
        dbId: 'prof1',
        email: 'adrian.cole@example.com',
        picture: {
          _type: 'image',
          asset: {
            _ref: 'adrian-cole.jpg',
            _type: 'reference',
          },
        },
        title: 'Professor',
        _id: 'professor-1',
        name: 'Prof. Adrian Cole',
      },
    ],
    year: 1,
    credits: 4,
    semester: 'summer',
    description: [
      {
        _key: 'block-1',
        _type: 'block',
        children: [
          {
            _key: 'span-1',
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
      dbId: 'math221',
      slug: 'mathematics',
      name: 'Mathematics',
      faculty: {
        _id: 'faculty-1',
        slug: 'science',
        name: 'Science',
        university: {
          _id: 'university-1',
          slug: 'ukim',
          name: 'Example University',
        },
      },
    },
    syllabus: 'math221-syllabus.pdf',
  },
]
