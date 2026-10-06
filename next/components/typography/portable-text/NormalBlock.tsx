import { ALIGNMENTS } from '@shared/config/shared-pt-config'
import type { PortableTextBlock } from 'next-sanity'
import { Children, createElement, type ReactNode } from 'react'
import { cn } from '@/lib/common-utils'
import { getBlockTextAlignment } from '@/lib/portable-text'
import type { ComponentParserType } from '../../../types/components/PortableText.types'

const ALIGNMENT_MAP = {
  center: 'md:justify-center',
  left: 'md:justify-start',
  right: 'md:justify-end',
} as const

/**
 * Checks whether the block contains any children of the expected Portable Text types.
 */
const hasChildType = (value: PortableTextBlock, expectedTypes: Array<string>) =>
  value?.children?.some((child) => expectedTypes?.includes(child?._type)) ??
  false

/**
 * Finds the text alignment mark for references blocks.
 */
const getReferenceMarkAlignment = (value: PortableTextBlock) => {
  return value?.children
    ?.filter((child) => child?._type === 'span')
    ?.flatMap((child) => child?.marks ?? [])
    ?.find((mark) => mark in ALIGNMENT_MAP)
}

/**
 * Detects when a paragraph has no meaningful rendered children.
 */
const isEmptyParagraph = (children: ReactNode) => {
  const childrenArray = Children?.toArray(children)

  return (
    childrenArray?.length === 0 ||
    childrenArray?.every((child) => {
      return (
        child === null ||
        child === undefined ||
        (typeof child === 'string' && child?.trim() === '')
      )
    })
  )
}

/**
 * Renders a generic aligned block container for Portable Text blocks.
 *
 * This helper can be reused for button blocks or any other block type that
 * needs a shared wrapper with optional alignment styling.
 */
const renderBlockContainer = (
  children: ReactNode,
  alignmentMark?: keyof typeof ALIGNMENT_MAP,
  className?: string,
  alignmentMap: typeof ALIGNMENT_MAP = ALIGNMENT_MAP,
  filterFn?: (child: ReactNode) => boolean
) => {
  const filteredChildren = Children.toArray(children).filter((child) => {
    if (typeof filterFn === 'function') {
      return filterFn(child)
    }

    const markType = (
      child as { props?: { markType?: (typeof ALIGNMENTS)[number] } }
    )?.props?.markType

    return !markType || !ALIGNMENTS.includes(markType)
  })

  return (
    <div
      className={cn(
        'my-4 flex flex-wrap justify-center gap-4',
        alignmentMark ? alignmentMap?.[alignmentMark] : undefined,
        className
      )}
    >
      {filteredChildren}
    </div>
  )
}

/**
 * Renders a container for embedded items like images and tables.
 */
const renderItemContainer = (children: ReactNode, className?: string) => {
  return <div className={cn(className, 'item-container')}>{children}</div>
}

/**
 * Renders the default paragraph element with an optional override tag.
 */
const renderDefaultParagraph = (
  children: ReactNode,
  className?: string,
  tag?: string
) => {
  const Tag = tag ?? 'p'
  return createElement(Tag, { className: cn(className) }, children)
}

type NormalBlockProps = {
  children: ReactNode
  value: PortableTextBlock
  renderDefaultBlock?: boolean
  overrideElements?: ComponentParserType['overrideElements']
}

/**
 * Renders the Portable Text normal block with custom handling for buttons,
 * embedded items, and empty paragraphs.
 */
export const NormalBlock = ({
  children,
  value,
  renderDefaultBlock = true,
  overrideElements,
}: NormalBlockProps) => {
  if (!renderDefaultBlock) {
    return <>{children}</>
  }

  if (hasChildType(value, ['buttonReference'])) {
    const alignmentMark = getReferenceMarkAlignment(value)
    return renderBlockContainer(
      children,
      alignmentMark,
      overrideElements?.p?.className
    )
  }

  if (hasChildType(value, ['image'])) {
    const alignmentMark = getReferenceMarkAlignment(value)

    return renderBlockContainer(
      children,
      alignmentMark,
      overrideElements?.p?.className
    )
  }

  if (hasChildType(value, ['table', 'tableReference', 'horizontalRule'])) {
    return renderItemContainer(children, overrideElements?.p?.className)
  }

  if (isEmptyParagraph(children)) {
    return <br />
  }

  return renderDefaultParagraph(
    <span className='block' style={{ textAlign: getBlockTextAlignment(value) }}>
      {children}
    </span>,
    overrideElements?.p?.className,
    overrideElements?.p?.tag
  )
}
