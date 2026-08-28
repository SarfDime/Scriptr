import type {
  AriaAttributes,
  CSSProperties,
  HTMLAttributes,
  RefAttributes,
  SVGProps,
} from 'react'

type ComponentTags = {
  box: 'div' | 'section' | 'article' | 'main'
  navigation: 'footer' | 'nav'
  list: 'ul' | 'ol'
  listItem: 'li'
  heading: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  text: 'p' | 'span' | 'label'
  link: 'a'
  button: 'button'
  input: 'input'
  label: 'label'
  image: 'img'
  video: 'video'
  audio: 'audio'
}

type ComponentColorPalettes =
  | 'red'
  | 'green'
  | 'blue'
  | 'gray'
  | 'yellow'
  | 'brand'
  | 'unstyled'

type ComponentPlacement = {
  placement: 'left' | 'center' | 'right'
  offsetY?: string
  offsetX?: string
}

type BoxTags =
  | ComponentTags['text']
  | ComponentTags['box']
  | ComponentTags['list']
  | ComponentTags['listItem']
  | ComponentTags['navigation']

type IconProps = Omit<SVGProps<SVGSVGElement>, 'ref'> &
  RefAttributes<SVGSVGElement>

type AdditionalComponentAttributes = {
  children?: React.ReactNode
  disabled?: boolean
  style?: CSSProperties & { [key: `--${string}`]: number | string | undefined }
} & AriaAttributes &
  Omit<HTMLAttributes<HTMLElement>, 'style'>

export type {
  AdditionalComponentAttributes,
  BoxTags,
  ComponentColorPalettes,
  ComponentPlacement,
  ComponentTags,
  IconProps,
}
