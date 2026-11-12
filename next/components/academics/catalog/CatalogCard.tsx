import { Box } from '@/components/common/Box'
import { NextImage } from '@/components/common/NextImage'
import { Text } from '@/components/typography/Text'
import { Title } from '@/components/typography/Title'
import { Badge } from '@/components/ui/Badge'
import { ClickableCard } from '@/components/ui/Card'
import { Divider } from '@/components/ui/Divider'
import { cn } from '@/lib/common-utils'
import { IMAGE_SIZES } from '@/styles/style'
import type { CatalogCardProps } from '@/types/academics/catalog.types'

/**
 * A compact version of the entity page's overview card: the picture fills the
 * header band, and the body carries the logo, the name, a counts line and the
 * entity's place in the catalog instead of a description and contact actions.
 * Width comes from the caller's grid; `h-72` is fixed so the cards in a column
 * stay even, and the lines that can run long clamp instead of growing the card.
 *
 * The images are decorative for assistive tech: the body already names the
 * entity, so repeating it through the alts would only lengthen the link's
 * accessible name.
 */
export const CatalogCard = ({
  href,
  eyebrow,
  title,
  subtitle,
  caption,
  picture,
  logo,
  colorPalette,
  priority = false,
}: CatalogCardProps) => (
  <ClickableCard
    href={href}
    className={cn(
      colorPalette,
      'cp-vars group flex grow min-h-full w-full flex-col overflow-hidden ui-above-inside ui-sheen-vertical transition-[border-color,box-shadow] hover:shadow-button-hover'
    )}
  >
    <ClickableCard.Header className='relative h-32 shrink-0 overflow-hidden p-0 ui-above-defaults rounded-lg'>
      <Box aria-hidden='true' className='absolute inset-0'>
        {picture ? (
          <NextImage
            {...picture}
            alt=''
            fillProp
            sizes={IMAGE_SIZES.CATALOG_CARD}
            className='absolute inset-0 h-full w-full'
            objectFitProp='cover'
            priority={priority}
          />
        ) : (
          <CatalogBandFallback logo={logo} />
        )}
      </Box>
      {/* A soft fade at the band's foot, so the picture settles into the body
          instead of ending against it as a pasted rectangle. */}
      <Box className='absolute inset-0 bg-linear-to-t from-background-150/60 via-transparent to-transparent' />
    </ClickableCard.Header>

    <ClickableCard.Body className='flex min-h-0 flex-1 flex-col gap-1.5'>
      <Box className='flex min-w-0 items-center gap-2'>
        {logo && (
          <Box
            aria-hidden='true'
            className='relative h-6 w-6 shrink-0 overflow-hidden rounded-md'
          >
            <NextImage
              {...logo}
              alt=''
              fillProp
              sizes={IMAGE_SIZES.AVATAR}
              objectFitProp='contain'
            />
          </Box>
        )}
        <Title
          as='h3'
          className='ui-title min-w-0 flex-1 line-clamp-2 transition-colors group-hover:cp-text'
        >
          {title}
        </Title>
      </Box>
      <Divider className='group-hover:cp-divider my-2' />

      {subtitle && <Text className='ui-caption truncate'>{subtitle}</Text>}
      {caption && (
        <Text className='ui-caption mt-auto truncate ui-cluster justify-between'>
          {caption}
          <Badge className='ui-small-label' colorPalette={`${colorPalette}-nb`}>
            {eyebrow}
          </Badge>
        </Text>
      )}
    </ClickableCard.Body>
  </ClickableCard>
)

/** A band without a picture still reads as a card: a soft brand wash with the
 * logo centered, or just the wash when the entity has none. */
const CatalogBandFallback = ({ logo }: { logo?: CatalogCardProps['logo'] }) => (
  <Box className='flex h-full w-full items-center justify-center bg-linear-to-br from-brand-500/20 via-background-200 to-background-100'>
    {logo && (
      <Box className='relative h-10 w-10 opacity-70'>
        <NextImage
          {...logo}
          alt=''
          fillProp
          sizes={IMAGE_SIZES.AVATAR}
          objectFitProp='contain'
        />
      </Box>
    )}
  </Box>
)
