import type { ReactNode } from 'react'
import type { BoxProps } from '@/components/common/Box'
import type { NextImageProps } from '@/components/common/NextImage'
import type { ComponentColorPalettes } from '../component.types'
import type { PersonSummary } from './Person.types'
import type { PortableContentProps } from './PortableText.types'

type OverviewCardActionItem = {
  key: string
  icon: ReactNode
  label: ReactNode
  href?: string
  colorPalette?: ComponentColorPalettes
  hideExternalIcon?: boolean
}

type OverviewCardActionProps = {
  action: OverviewCardActionItem
}

type AdministratorListProps = {
  administrators: Array<PersonSummary>
}

type OverviewCardProps = {
  picture?: Omit<NextImageProps, 'alt' | 'className' | 'fillProp'>
  imageAlt?: string
  administrators?: Array<PersonSummary>
  /** Escape hatch for callers that need something other than an administrator list in the header */
  headerContent?: ReactNode
  eyebrow: string
  eyebrowIcon?: ReactNode
  description?: PortableContentProps['children']
  actions?: Array<OverviewCardActionItem>
} & BoxProps

export type {
  AdministratorListProps,
  OverviewCardActionItem,
  OverviewCardActionProps,
  OverviewCardProps,
}
