import { Box, Flex, Text, TextInput } from '@sanity/ui'
import type { StringFieldProps } from 'sanity'

/**
 * A custom input component for Sanity Studio that displays a text input field
 * for custom links with a disclaimer indicating whether the link is internal or external.
 */
export function CustomLinkInput(props: StringFieldProps) {
  const {
    inputProps: {
      elementProps: { value, onChange },
    },
    schemaType,
  } = props

  const getDisclaimer = (linkValue: string) => {
    if (!linkValue) return null

    if (linkValue.startsWith('https://')) {
      return (
        <Text size={1} style={{ color: '#00FFFF', fontWeight: 500 }}>
          ✓ This is an <strong>EXTERNAL link</strong>
        </Text>
      )
    }

    if (linkValue.startsWith('/')) {
      return (
        <Text size={1} style={{ color: '#27ae60', fontWeight: 500 }}>
          ✓ This is an <strong>INTERNAL link</strong>
        </Text>
      )
    }

    return (
      <Text size={1} style={{ color: '#f39c12', fontWeight: 500 }}>
        ⚠ Link should start with <code>/</code> (internal) or{' '}
        <code>https://</code> (external)
      </Text>
    )
  }

  return (
    <Flex direction='column' gap={2}>
      <Text size={1} weight='semibold'>
        {schemaType?.title}
      </Text>
      <Text size={1}>{schemaType?.description}</Text>
      <TextInput value={value} onChange={onChange} />
      <Box style={{ marginTop: '0.25rem' }}>{getDisclaimer(value ?? '')}</Box>
    </Flex>
  )
}
