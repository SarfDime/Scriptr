'use client'

import type { LocaleId } from '@shared/config/localization-constants'
import type { LocalizedMessage } from '@shared/types/localization.types'
import type { PortableTextValue } from '@shared/types/portable-text.types'
import { resolveLocalizedText } from '@shared/utils/localized-strings'
import { isPortableTextValue } from '@shared/utils/portable-text.utils'
import type { ReactNode } from 'react'
import { useLocale } from '@/providers/locale/LocaleProvider'
import { Box } from '../common/Box'
import { Text } from '../typography/Text'
import { Title } from '../typography/Title'

export type PageHeaderProps = {
  /** Copy, or a name that is already in the reader's language. A `{ en, mk }`
   * entry is resolved here, so a page or a component does not have to resolve a
   * whole collection to hand one string down — it can pass the entry. A `string`
   * is used as it is: an entity name from Sanity, or copy read with
   * `useUIStrings`/`getServerStrings`, both already resolved. */
  greeting?: LocalizedMessage
  /** As above, and Portable Text is rendered as rich text. */
  title?: LocalizedMessage | PortableTextValue
  subtitle?: LocalizedMessage
  children?: ReactNode
}

/** The heading is the only slot that may be rich text; the others are text. */
const resolveTitle = (
  value: LocalizedMessage | PortableTextValue | undefined,
  locale: LocaleId
): string | PortableTextValue | undefined => {
  if (value === undefined) return undefined
  return isPortableTextValue(value)
    ? value
    : resolveLocalizedText(value, locale)
}

export const PageHeader = ({
  greeting,
  title,
  subtitle,
  children,
}: PageHeaderProps) => {
  const { locale } = useLocale()

  const greetingText =
    greeting === undefined ? undefined : resolveLocalizedText(greeting, locale)
  const titleText = resolveTitle(title, locale)
  const subtitleText =
    subtitle === undefined ? undefined : resolveLocalizedText(subtitle, locale)

  return (
    <Box className='ui-cluster justify-between items-end'>
      <Box className='ui-stack gap-1'>
        {greetingText && (
          <Text className='ui-title-modern text-brand-600'>{greetingText}</Text>
        )}
        {titleText && (
          <Title as='h1' className='ui-display'>
            {titleText}
          </Title>
        )}
        {subtitleText && (
          <Text className='ui-body-strong text-fg-muted'>{subtitleText}</Text>
        )}
      </Box>
      {children}
    </Box>
  )
}
