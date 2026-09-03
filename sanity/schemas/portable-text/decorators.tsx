import { RemoveIcon } from '@sanity/icons/Remove'
import {
  ALIGNMENT_DECORATORS,
  type AlignmentType,
  COLOR_DECORATORS,
  type ColorsType,
  DEFAULT_DECORATOR_NAMES,
  type DefaultDecoratorsType,
  type FontWeightType,
  WEIGHT_DECORATORS,
} from '@shared/config/shared-pt-config'
import { type BlockDecoratorProps, DEFAULT_DECORATORS } from 'sanity'
import { AlignText } from '../../components/Icons'

const ColorIcon = (color: string) => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    width='1em'
    height='1em'
    viewBox='0 0 24 24'
    className='color-toolbar-icon'
    style={{
      color,
    }}
  >
    <title>Color Icon</title>
    <path
      fill='currentColor'
      d='M1 12C1 5.925 5.925 1 12 1s11 4.925 11 11s-4.925 11-11 11S1 18.075 1 12'
    />
  </svg>
)

const ColorDecorator = (props: BlockDecoratorProps, value: ColorsType) => (
  <span data-decorator-label={value} className={`color-decorator ${value}`}>
    {props?.children}
  </span>
)

const WeightIcon = (label: string, weight: number) => (
  <span style={{ fontWeight: weight, fontSize: '0.75em' }}>{label}</span>
)

const WeightDecorator = (
  props: BlockDecoratorProps,
  weight: number,
  value: FontWeightType
) => (
  <span
    className={`weight-decorator ${value}`}
    data-decorator-label={`${
      // biome-ignore lint/style/noNestedTernary: <Simplest way to do this>
      value === 'semibold' ? 'SEMIBOLD' : value === 'strong' ? 'BOLD' : 'BOLD+'
    }`}
    data-decorator-weight={weight}
    style={{ fontWeight: weight }}
  >
    {props?.children}
  </span>
)

const AlignmentDecorator = (
  props: BlockDecoratorProps,
  alignment: AlignmentType
) => {
  const alignmentArrow =
    // biome-ignore lint/style/noNestedTernary: <Simplest way to do this>
    alignment === 'left' ? '<-' : alignment === 'center' ? '-' : '->'
  return (
    <div
      className={`align-decorator ${alignment}`}
      data-decorator-label={`${alignmentArrow} ${alignment} ${alignmentArrow}`}
      // data-decorator-alignment={}
      style={{ textAlign: alignment }}
    >
      {props?.children}
    </div>
  )
}

const ColorDecorators = COLOR_DECORATORS.map((d) => ({
  title: d.label,
  value: d.name,
  icon: ColorIcon(d.color),
  component: (props: BlockDecoratorProps) => ColorDecorator(props, d.name),
}))

const WeightDecorators = WEIGHT_DECORATORS.map((d) => ({
  title: d.label,
  value: d.name,
  icon: WeightIcon(d.label, d.weight),
  component: (props: BlockDecoratorProps) =>
    WeightDecorator(props, d.weight, d.name),
}))

const AlignmentDecorators = ALIGNMENT_DECORATORS.map((d) => ({
  title: d.label,
  value: d.name,
  icon: AlignText({ alignment: d.name }),
  component: (props: BlockDecoratorProps) => AlignmentDecorator(props, d.name),
}))

const DefaultDecorators = DEFAULT_DECORATORS.filter((decorator) =>
  DEFAULT_DECORATOR_NAMES.includes(decorator.value as DefaultDecoratorsType)
)

const SlimDecorators = DefaultDecorators.filter(
  (decorator) => decorator.value !== 'strong'
)

const AllDecorators = [
  {
    title: 'Clear Formatting',
    value: 'clear-formatting',
    icon: RemoveIcon,
  },
  ...ColorDecorators,
  ...DefaultDecorators,
  ...WeightDecorators,
  ...AlignmentDecorators,
]

export {
  AlignmentDecorators,
  AllDecorators,
  ColorDecorators,
  DefaultDecorators,
  SlimDecorators,
  WeightDecorators,
}
