import type { ReactElement, ReactNode } from 'react'
import type {
  FormPatch,
  FormSetPatch,
  PatchEvent,
  PortableTextBlock,
  SanityClient,
} from 'sanity'
import type { StructureBuilder } from 'sanity/structure'
import type { ButtonVariantType } from './button.types'

type BlockArrayType = Array<PortableTextBlock>

type CommonPreviewProps = {
  title?: string | BlockArrayType
  fallbackTitle?: string | BlockArrayType
  subtitle?: string | BlockArrayType
  media?: string | ReactNode
}

type LinkSelectorPreviewProps = {
  pageSlug?: { _type: 'slug'; current: string } | null
  slug?: { _type: 'slug'; current: string } | null
  pageRef?: string | null
  customLink?: string
  sectionSlug?: string
  linkType?: 'internal' | 'custom'
  variant?: ButtonVariantType
} & Pick<CommonPreviewProps, 'title' | 'media'>

/**
 * Represents properties commonly used for schema previews.
 * - 'title': The title of the schema.
 * - 'slug': The path to the schema.
 */
type PreviewPrepareProps = {
  sectionImage?: string
  variant?: ButtonVariantType
} & CommonPreviewProps &
  Pick<LinkSelectorPreviewProps, 'pageSlug' | 'slug' | 'pageRef'>

type StructureToolTypes = {
  // biome-ignore lint/style/useNamingConvention: <Exception>
  Build: StructureBuilder
  context: {
    getClient: (clientOptions: {
      apiVersion: string
      perspective: string
    }) => SanityClient
  }
}

type OnChange = (patch: FormPatch | Array<FormPatch> | PatchEvent) => void

type ComponentProps = {
  children?: ReactElement
  title?: string
  customColor?: string
  customClass?: string

  path?: string

  _id?: string

  icon?: ReactElement
  value?: { url?: string; color?: string; _ref?: string }
  renderDefault?: (props: unknown) => ReactElement
  onChange?: OnChange
  inputProps?: { onChange?: (value: Array<FormSetPatch>) => void }
} & {
  media?: {
    props: {
      'data-variant': ButtonVariantType
    }
  }
  fallbackTitle?: string
}

export type {
  BlockArrayType,
  CommonPreviewProps,
  ComponentProps,
  LinkSelectorPreviewProps,
  OnChange,
  PreviewPrepareProps,
  StructureToolTypes,
}
