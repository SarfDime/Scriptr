import type {
  PortableTextBlock,
  PortableTextComponentProps,
  PortableTextMarkComponentProps,
} from 'next-sanity'
import { IMAGE_SIZES } from '@/styles/style'
import { cn } from '../../lib/common-utils'
import type { SanityImageSrcType } from '../../types/common.types'
import type { ComponentParserType } from '../../types/components/PortableText.types'
import { NextImage } from '../common/NextImage'
import { NextLink } from '../common/NextLink'
import { Divider } from '../ui/Divider'

/** A function that returns a Portable Text parser configuration object.
 * This object is used by the `PortableText` component to render
 * Portable Text content.
 */
export const portableTextParser = ({
  renderDefaultBlock = true,
  overrideElements,
}: ComponentParserType) => {
  return {
    types: {
      image: ({
        value,
      }: PortableTextComponentProps<{
        asset: SanityImageSrcType & { aspectRatio: number }
      }>) => {
        return (
          <NextImage
            src={value?.asset?.src}
            alt={value?.asset?.alt ?? ''}
            fillProp
            style={{ aspectRatio: value?.asset?.aspectRatio }}
            sizes={IMAGE_SIZES.BLOG_POST_IMAGE_OPTIMIZATION}
          />
        )
      },
      year: ({ value }: { value: { year?: string } }) => <>{value?.year}</>,
      horizontalRule: () => <Divider className='divider mt-2.5 mb-1' />,
    },
    marks: {
      link: ({ children, value }: PortableTextMarkComponentProps) => {
        return (
          <NextLink
            externalIconProps={{ className: 'w-5 h-5' }}
            className='gap-0'
            href={value?.url}
          >
            {children}
          </NextLink>
        )
      },
    },

    block: {
      normal: ({
        children,
        value,
      }: PortableTextComponentProps<PortableTextBlock>) => {
        if (!renderDefaultBlock) {
          return <>{children}</>
        }

        if (
          value.children?.some(
            (child) =>
              child._type === 'image' || child._type === 'horizontalRule'
          )
        ) {
          return (
            <div
              className={cn(overrideElements?.p?.className, 'item-container')}
            >
              {children}
            </div>
          )
        }

        const defaultElement = 'p'

        const Tag = overrideElements?.p?.tag ?? defaultElement

        return <Tag className={overrideElements?.p?.className}>{children}</Tag>
      },
    },
  }
}
