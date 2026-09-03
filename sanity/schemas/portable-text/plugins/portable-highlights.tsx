import type { ReactNode } from 'react'
import {
  type BlockProps,
  PortableTextInput,
  type PortableTextInputProps,
} from 'sanity'

// ^ Same from bellow.
// export const RenderChild = ({ value, children }) => {
//   const text = value?.text

//   if (text === '\n') {
//     return (
//       <span className='block w-full bg-lavender/30 caret-black'>
//         {children}
//       </span>
//     )
//   }

//   if (typeof text !== 'string' || !text.includes('\n')) {
//     return <>{children}</>
//   }

//   return <span data-empty='true'>{children}</span>
// }

export const RenderBlock = ({
  value,
  children,
}: Omit<BlockProps, 'renderDefault'>): ReactNode => {
  const block = value

  const hasNewLine =
    Array.isArray(block.children) &&
    block.children.some((child) => {
      const leaf = child
      return typeof leaf.text === 'string' && leaf.text.includes('\n')
    })

  if (!hasNewLine) {
    return <div>{children}</div>
  }

  return (
    <div data-empty='' data-text=''>
      {children}
    </div>
  )
}

export function CustomPortableTextInput(
  props: PortableTextInputProps & {
    customClassName?: string
  }
) {
  return (
    <div className={`richtext ${props?.customClassName ?? ''}`}>
      <PortableTextInput
        {...props}
        renderBlock={RenderBlock}
        // TODO: When this is available use it, it's better.
        // renderChild={RenderChild}
      />
    </div>
  )
}
