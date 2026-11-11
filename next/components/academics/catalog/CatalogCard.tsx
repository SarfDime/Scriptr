import { Box } from '@/components/common/Box'
import { Text } from '@/components/typography/Text'
import { Title } from '@/components/typography/Title'
import { ClickableCard } from '@/components/ui/Card'
import type { CatalogCardProps } from '@/types/academics/catalog.types'

/**
 * A compact version of the entity page's overview card: the picture fills the
 * header band, and the body carries the logo, the name, a counts line and the
 * entity's place in the catalog instead of a description and contact actions.
 * `h-72 w-80` is fixed rather than content-sized so every card in a section is
 * the same size; the lines that can run long clamp instead of growing the card.
 *
 * Both images are decorative for assistive tech: the body already names the
 * entity, so repeating it through the image alts would only lengthen the link's
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
}: CatalogCardProps) => (
  <ClickableCard
    href={href}
    className='group flex h-72 w-120 max-w-full flex-col overflow-hidden p-0 ui-above transition-colors hover:border-brand-200/50'
  >
    <ClickableCard.Header className='relative h-32 shrink-0 overflow-hidden border-b border-grey-300/20 p-0'>
      <Box aria-hidden='true' className='absolute inset-0'>
        {picture}
      </Box>
      {/* A soft fade into the body, so the band reads as part of the card. */}
      <Box className='absolute inset-0 bg-linear-to-t from-background-100/70 via-background-100/10 to-transparent' />
    </ClickableCard.Header>

    <ClickableCard.Body className='flex min-h-0 flex-1 flex-col gap-1.5 p-4 pt-0'>
      <Box className='ui-cluster gap-2'>
        {logo && (
          <Box aria-hidden='true' className='shrink-0'>
            {logo}
          </Box>
        )}
        <Text className='ui-small-label'>{eyebrow}</Text>
      </Box>
      <Title
        as='h3'
        className='ui-body-strong line-clamp-2 transition-colors group-hover:text-brand-500'
      >
        {title}
      </Title>
      {subtitle && <Text className='ui-caption truncate'>{subtitle}</Text>}
      {caption && (
        <Text className='ui-caption mt-auto truncate'>{caption}</Text>
      )}
    </ClickableCard.Body>
  </ClickableCard>
)
