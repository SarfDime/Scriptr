import type { ScriptDetail } from '@/types/components/Scripts.types'

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000)

export const FAKE_SCRIPTS: Array<ScriptDetail> = [
  {
    id: 'script-1',
    title: 'The Cell Cycle',
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
    title: 'Mitosis and Meiosis',
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
    title: 'Membrane Transport',
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
    title: 'DNA Replication Overview',
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
