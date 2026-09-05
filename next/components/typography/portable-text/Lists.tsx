import type { PortableTextBlock, PortableTextComponentProps } from 'next-sanity'

const Lists = {
  bullet: ({ children }: PortableTextComponentProps<PortableTextBlock>) => {
    return <ul className='list-disc'>{children}</ul>
  },
  number: ({ children }: PortableTextComponentProps<PortableTextBlock>) => {
    return <ol className='list-decimal'>{children}</ol>
  },
  checkmarks: ({ children }: PortableTextComponentProps<PortableTextBlock>) => {
    return <ul className='list-checkmark'>{children}</ul>
  },
}

export { Lists }
