import type { PortableTextBlock, PortableTextComponentProps } from 'next-sanity'
import { getBlockTextAlignment } from '@/lib/portable-text'

const Lists = {
  bullet: ({
    children,
    value,
  }: PortableTextComponentProps<PortableTextBlock>) => {
    return (
      <ul
        className='list-disc'
        style={{ textAlign: getBlockTextAlignment(value) }}
      >
        {children}
      </ul>
    )
  },
  number: ({
    children,
    value,
  }: PortableTextComponentProps<PortableTextBlock>) => {
    return (
      <ol
        className='list-decimal'
        style={{ textAlign: getBlockTextAlignment(value) }}
      >
        {children}
      </ol>
    )
  },
  checkmarks: ({
    children,
    value,
  }: PortableTextComponentProps<PortableTextBlock>) => {
    return (
      <ul
        className='list-checkmark'
        style={{ textAlign: getBlockTextAlignment(value) }}
      >
        {children}
      </ul>
    )
  },
  'blue-bullet': ({
    children,
    value,
  }: PortableTextComponentProps<PortableTextBlock>) => (
    <ul
      className='list-blue-bullet'
      style={{ textAlign: getBlockTextAlignment(value) }}
    >
      {children}
    </ul>
  ),
}

export { Lists }
