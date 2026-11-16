import { defineField } from 'sanity'

// The field builders and the theme-color list the background canvas documents
// share. They lived in the star-canvas schema until that document type was retired.

// Values must match CSS theme variables (--color-<value> or --<value>)
export const THEME_COLORS = [
  { title: 'Brand (Blue)', value: 'brand' },
  { title: 'Brand Light', value: 'brand-300' },
  { title: 'Brand Dark', value: 'brand-850' },
  { title: 'Sky', value: 'sky' },
  { title: 'Jade', value: 'jade' },
  { title: 'Lavender', value: 'lavender' },
  { title: 'Rose Pink', value: 'rose-pink' },
  { title: 'Amber', value: 'amber' },
  { title: 'Golden Yellow', value: 'golden-yellow' },
  { title: 'Yellow', value: 'yellow' },
  { title: 'Error Red', value: 'error-red' },
  { title: 'White / Lightest', value: 'background-50' },
  { title: 'Grey Light', value: 'grey-200' },
  { title: 'Grey', value: 'grey-300' },
  { title: 'Grey Dark', value: 'grey-800' },
  { title: 'Black / Darkest', value: 'background-1000' },
]

export type Context = { parent?: Record<string, unknown> }

export type NumberFieldOptions = {
  name: string
  title: string
  description: string
  initialValue: number
  group: string
  fieldset?: string
  min?: number
  max?: number
  integer?: boolean
  precision?: number
  hidden?: (context: Context) => boolean
}

export const numberField = ({
  name,
  title,
  description,
  initialValue,
  group,
  fieldset,
  min,
  max,
  integer,
  precision,
  hidden,
}: NumberFieldOptions) =>
  defineField({
    name,
    title,
    description,
    type: 'number',
    group,
    fieldset,
    hidden,
    initialValue,
    validation: (rule) => {
      let r = rule
      if (integer) r = r.integer()
      if (min !== undefined) r = r.min(min)
      if (max !== undefined) r = r.max(max)
      if (precision !== undefined) r = r.precision(precision)
      return r
    },
  })
