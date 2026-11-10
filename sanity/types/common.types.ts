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
  customLink?: string
  variant?: ButtonVariantType
} & Pick<CommonPreviewProps, 'title' | 'media'>

/**
 * Represents properties commonly used for schema previews.
 * - 'title': The title of the schema.
 * - 'subtitle': The path or short description shown under the title.
 */
type PreviewPrepareProps = {
  variant?: ButtonVariantType
} & CommonPreviewProps

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
