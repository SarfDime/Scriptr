import { Box } from '@/components/common/Box'
import { SectionHeader } from '@/components/common/SectionHeader'
import { Text } from '@/components/typography/Text'
import type { CatalogSectionProps } from '@/types/academics/catalog.types'
import { CatalogCard } from './CatalogCard'

/**
 * One column of the home directory: its heading and cards, or its empty line.
 * The page owns the column width; every card fills it and keeps the shared
 * card height, so the columns stay even as entities are added.
 */
export const CatalogSection = ({
  title,
  subtitle,
  empty,
  icon,
  cards,
  colorPalette,
  priority = false,
}: CatalogSectionProps) => (
  <Box as='section' className='ui-stack h-full ui-above'>
    {/* Two lines of subtitle are reserved so every column's first card starts
        at the same height whether its line wraps or not. */}
    <SectionHeader
      title={title}
      subtitle={subtitle}
      count={cards.length}
      icon={icon}
      colorPalette={colorPalette}
      subtitleProps={{ className: 'min-h-10' }}
    />
    {cards.length === 0 ? (
      <Text className='ui-caption ui-above-inside rounded-lg p-4'>{empty}</Text>
    ) : (
      <Box className='ui-stack gap-4 h-full'>
        {cards.map(({ key, ...card }, index) => (
          <CatalogCard
            key={key}
            {...card}
            colorPalette={colorPalette}
            priority={priority && index === 0}
          />
        ))}
      </Box>
    )}
  </Box>
)
