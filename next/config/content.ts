import type { PortableTextValue } from '@shared/types/portable-text.types'

export const DEFAULT_ACTIVITY_CONTENT: PortableTextValue = [
  {
    _type: 'block',
    _key: 'activity-block',
    children: [
      { _key: 'activity-title', _type: 'span', text: 'Your activity\n' },
      {
        _key: 'activity-text',
        _type: 'span',
        text: 'A quick view of the work you have been making.',
      },
    ],
  },
]

export const DEFAULT_STUDY_TIP_CONTENT: PortableTextValue = [
  {
    _key: 'study-tip-block',
    _type: 'block',
    children: [
      { _key: 'study-tip', _type: 'span', text: 'Study tip' },
      {
        _key: 'study-tip-text',
        _type: 'span',
        text: 'Try explaining one concept from memory before checking your notes. It makes review stick.',
      },
    ],
  },
]
