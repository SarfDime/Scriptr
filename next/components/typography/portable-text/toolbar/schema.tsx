import {
  defineDecorator,
  defineSchema,
  defineTextBlock,
} from '@portabletext/editor'
import {
  ALIGNMENT_DECORATORS,
  COLOR_DECORATORS,
  DEFAULT_DECORATOR_NAMES,
  FONT_SIZE_STYLE_CLASSES,
  FONT_SIZE_STYLES,
  type FontSizeType,
  LIST_ITEMS,
  WEIGHT_DECORATORS,
} from '@shared/config/shared-pt-config'

export type PortableTextEditorOptions = {
  excludedStyles?: ReadonlyArray<FontSizeType>
  showStyles?: boolean
  showLists?: boolean
  showAlignment?: boolean
}

const createTextBlock = ({
  showAlignment,
}: Pick<Required<PortableTextEditorOptions>, 'showAlignment'>) =>
  defineTextBlock({
    type: 'block',
    render: ({ attributes, children, node }) => {
      const style = FONT_SIZE_STYLES.find((item) => item.name === node.style)
      const list = LIST_ITEMS.find((item) => item.name === node.listItem)
      let listClass = ''
      if (list?.name === 'number') listClass = 'list-decimal'
      if (list?.name === 'bullet') listClass = 'list-disc'
      if (list?.name === 'checkmarks') listClass = 'list-checkmark'
      if (list?.name === 'blue-bullet') listClass = 'list-blue-bullet'
      const paddingAmount = listClass === 'list-decimal' ? 1.65 : 0.5
      const fontSizeClass =
        style && style.name !== 'normal' && style.name !== '-'
          ? FONT_SIZE_STYLE_CLASSES[style.name]
          : undefined
      const textAlign =
        showAlignment && 'textAlign' in node
          ? ALIGNMENT_DECORATORS.find((item) => item.name === node.textAlign)
              ?.name
          : undefined

      return (
        <div
          {...attributes}
          className={list ? 'my-0.5' : undefined}
          style={{
            paddingLeft: list
              ? `${(node.level ?? 1) * paddingAmount}rem`
              : undefined,
            textAlign,
          }}
        >
          <span
            className={
              list
                ? `list-item list-inside ${listClass} ${fontSizeClass ?? ''}`
                : fontSizeClass
            }
          >
            {children}
          </span>
        </div>
      )
    },
  })

// const span = defineSpan({
//   type: 'span',
//   render: ({ attributes, children, node }) => {
//     const text = node.text

//     if (text === '\n') {
//       return (
//         <span
//           {...attributes}
//           className='block w-full bg-lavender/30 caret-black'
//         >
//           {children}
//         </span>
//       )
//     }

//     if (typeof text !== 'string' || !text.includes('\n')) {
//       return <span {...attributes}>{children}</span>
//     }

//     return (
//       <span
//         {...attributes}
//         className='block w-full whitespace-pre-wrap bg-lavender/30 caret-black'
//         data-empty='true'
//       >
//         {children}
//       </span>
//     )
//   },
// })

const decoratorRenderers = {
  ...Object.fromEntries(
    DEFAULT_DECORATOR_NAMES.map((name) => [
      name,
      defineDecorator({
        type: name,
        render: ({ children }) => {
          if (name === 'em') return <em>{children}</em>
          if (name === 'underline') return <u>{children}</u>
          return <s>{children}</s>
        },
      }),
    ])
  ),
  ...Object.fromEntries(
    COLOR_DECORATORS.map(({ name }) => [
      name,
      defineDecorator({
        type: name,
        render: ({ children }) => {
          const className = {
            brand: 'text-brand',
            'brand-light': 'text-brand-400',
            muted: 'text-grey',
            white: 'text-background',
            dark: 'text-fg',
          }[name]
          return <span className={className}>{children}</span>
        },
      }),
    ])
  ),
  ...Object.fromEntries(
    WEIGHT_DECORATORS.map(({ name }) => [
      name,
      defineDecorator({
        type: name,
        render: ({ children }) => {
          const className = {
            semibold: 'font-semibold',
            strong: 'font-bold',
            black: 'font-black',
          }[name]
          return <strong className={className}>{children}</strong>
        },
      }),
    ])
  ),
}

export const createPortableTextEditorConfig = (
  options: PortableTextEditorOptions = {}
) => {
  const excludedStyles = options.excludedStyles ?? []
  const showAlignment = options.showAlignment ?? true
  const styles = FONT_SIZE_STYLES.filter(
    (style) =>
      style.name !== '-' &&
      (style.name === 'normal' || !excludedStyles.includes(style.name))
  )

  return {
    schemaDefinition: defineSchema({
      block: {
        fields: showAlignment ? [{ name: 'textAlign', type: 'string' }] : [],
      },
      decorators: [
        ...DEFAULT_DECORATOR_NAMES.map((name) => ({ name })),
        ...COLOR_DECORATORS.map((d) => ({ name: d.name })),
        ...WEIGHT_DECORATORS.map((d) => ({ name: d.name })),
        { name: 'highlight-newline' },
      ],
      styles: styles.map((style) => ({ name: style.name })),
      lists:
        options.showLists === false
          ? []
          : LIST_ITEMS.map((list) => ({ name: list.name })),
    }),
    editorNodes: [
      createTextBlock({ showAlignment }),
      ...Object.values(decoratorRenderers),
    ],
  }
}

export const { schemaDefinition, editorNodes } =
  createPortableTextEditorConfig()
