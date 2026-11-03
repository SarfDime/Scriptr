import type {
  AriaAttributes,
  CSSProperties,
  HTMLAttributes,
  ReactNode,
  RefAttributes,
  SVGProps,
} from 'react'

type ComponentTags = {
  box: 'div' | 'section' | 'article' | 'main' | 'aside'
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

type SanityIconProps = Omit<SVGProps<SVGSVGElement>, 'ref'> &
  RefAttributes<SVGSVGElement>

/**
 * A control has to have an accessible name: rendered content, or an explicit
 * `aria-label`/`aria-labelledby` when it has none.
 *
 * It lives in the type rather than in a lint rule because lint cannot see
 * "this button's only child is an icon" — a `<Button><CloseIcon /></Button>`
 * satisfies every DOM rule and still announces nothing. Making the name a
 * condition of the props means the compiler asks for one at the call site,
 * next to the icon it is describing.
 */
type AccessibleNameProps =
  | { children: ReactNode; 'aria-label'?: string; 'aria-labelledby'?: string }
  | { children?: never; 'aria-label'?: string; 'aria-labelledby': string }
  | { children?: never; 'aria-label': string; 'aria-labelledby'?: string }

/**
 * `Omit` that survives a union. The built-in one keeps only the keys every
 * member has, so wrapping `ButtonProps`/`NextLinkProps` in it would quietly
 * drop the prop types instead of narrowing them — including the accessible-name
 * requirement below.
 */
type OmitProps<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never

type AdditionalComponentAttributes = {
  children?: React.ReactNode
  disabled?: boolean
  style?: CSSProperties & { [key: `--${string}`]: number | string | undefined }
} & AriaAttributes &
  Omit<HTMLAttributes<HTMLElement>, 'style'>

export type {
  AccessibleNameProps,
  AdditionalComponentAttributes,
  BoxTags,
  ComponentPlacement,
  ComponentTags,
  OmitProps,
  SanityIconProps,
}
