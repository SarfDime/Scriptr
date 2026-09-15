import type { SanityButton, SanityImageType } from '@shared/types/common.types'
import type { PortableTextBlock, PortableTextComponentProps } from 'next-sanity'
import { IMAGE_SIZES } from '@/styles/style'
import { cn, generateSlug } from '../../lib/common-utils'
import type { ComponentParserType } from '../../types/components/PortableText.types'
import { NextImage } from '../common/NextImage'
import { NextLink } from '../common/NextLink'
import { Divider } from '../ui/Divider'
import { PortableTextContent } from './PortableTextContent'
import { Decorators } from './portable-text/Decorators'
import { Lists } from './portable-text/Lists'
import { NormalBlock } from './portable-text/NormalBlock'
import { FontSizeBlocks } from './portable-text/StyleBlocks'

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
      }: PortableTextComponentProps<
        SanityImageType & { aspectRatio: number }
      >) => {
        return (
          <NextImage
            asset={value?.asset}
            alt={value?.alt}
            fillProp
            className='sm:max-h-[40vh] w-[-webkit-fill-available]'
            style={{ aspectRatio: value?.aspectRatio }}
            imageProps={{ className: 'w-unset' }}
            sizes={IMAGE_SIZES.FEATURED_SECTION_IMAGE_OPTIMIZATION}
          />
        )
      },
      year: ({ value }: { value: { year?: string } }) => <>{value?.year}</>,
      horizontalRule: () => <Divider className='divider mt-2.5 mb-1' />,
      buttonReference: ({ value }: { value: SanityButton }) => {
        const { buttonLabel, buttonColorVariant } = value
        const buttonSlug = generateSlug(value)
        return (
          <div className={cn('my-4 flex flex-wrap justify-center gap-4')}>
            <NextLink
              href={buttonSlug}
              className={cn(
                'button min-w-40 py-2 text-sm no-underline md:min-w-55 md:text-lg',
                buttonColorVariant
              )}
            >
              <PortableTextContent>{buttonLabel}</PortableTextContent>
            </NextLink>
          </div>
        )
      },
    },
    marks: Decorators,
    list: Lists,
    block: {
      ...FontSizeBlocks,
      normal: ({
        children,
        value,
      }: PortableTextComponentProps<PortableTextBlock>) => {
        return (
          <NormalBlock
            value={value}
            renderDefaultBlock={renderDefaultBlock}
            overrideElements={overrideElements}
          >
            {children}
          </NormalBlock>
        )
      },
    },
  }
}
