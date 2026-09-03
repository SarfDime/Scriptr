import { Box, Card, Flex, Text } from '@sanity/ui'
import { set } from 'sanity'
import type { VariantListInputProps } from '../types/button.types'

/* Generic List Input component */
export function VariantListInput({
  options,
  value,
  onChange,
  renderPreview,
}: VariantListInputProps) {
  return (
    <div className='variant-grid'>
      {options.map((option) => {
        const optionValue = option?.value ?? ''
        const isSelected = value === option?.value

        return (
          <Card
            key={optionValue || 'unset'}
            border
            padding={2}
            radius={2}
            tone={isSelected ? 'positive' : 'neutral'}
            className='variant-list-card'
            onClick={() => onChange(set(option?.value))}
            style={{ cursor: 'pointer' }}
          >
            <Box style={{ flex: 1 }} className='variant-list-label'>
              <Flex align='center' gap={2} justify='space-between'>
                <Box>
                  <Text size={1} weight='semibold'>
                    {option?.title}
                  </Text>
                  {option?.description && (
                    <Text muted size={0}>
                      {option.description}
                    </Text>
                  )}
                </Box>
                {renderPreview?.(option, isSelected)}
              </Flex>
            </Box>
          </Card>
        )
      })}
    </div>
  )
}
