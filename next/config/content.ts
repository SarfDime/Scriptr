import type { PortableTextType } from '@/types/components/PortableText.types'

export const DEFAULT_ACTIVITY_CONTENT: PortableTextType = [
  {
    _type: 'block',
    children: [
      { _type: 'span', text: 'Your activity' },
      { _type: 'span', text: 'A quick view of the work you have been making.' },
    ],
  },
]

export const DEFAULT_STUDY_TIP_CONTENT: PortableTextType = [
  {
    _type: 'block',
    children: [
      { _type: 'span', text: 'Study tip' },
      {
        _type: 'span',
        text: 'Try explaining one concept from memory before checking your notes. It makes review stick.',
      },
    ],
  },
]
