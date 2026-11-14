'use client'

import type { UI_STRINGS_PACK } from '@shared/config/strings'
import type { SubjectSemester } from '@shared/types/academic.types'
import type { ResolvedStrings } from '@shared/types/localization.types'
import { Badge, type BadgeProps } from '@/components/ui/Badge'
import { getColorPalette } from '@/lib/color-pallette-gen'
import { cn } from '@/lib/common-utils'
import { useUIStrings } from '@/providers/locale/use-strings'

type AcademicBadgeProps = (
  | { type: 'year'; value: number }
  | { type: 'credits'; value: number }
  | { type: 'semester'; value: SubjectSemester }
  | { type: 'elective' }
  | { type: 'code'; value: string }
  | { type: 'title'; value: string }
) &
  Omit<BadgeProps, 'colorPalette' | 'children'>

type UIStrings = ResolvedStrings<typeof UI_STRINGS_PACK>

const getBadgeContent = (props: AcademicBadgeProps, strings: UIStrings) => {
  switch (props.type) {
    case 'year':
      return {
        colorPalette: getColorPalette({ type: 'year', value: props.value }),
        label: strings.general.year(props.value),
      }
    case 'credits':
      return {
        colorPalette: getColorPalette({ type: 'credits', value: props.value }),
        label: strings.academics.professor.ects(props.value),
      }
    case 'semester':
      return {
        colorPalette: getColorPalette({ type: 'semester', value: props.value }),
        label: strings.academics.semester(props.value),
      }
    case 'elective':
      return {
        colorPalette: 'cp-amber' as const,
        label: strings.subjects.electiveLabel,
      }
    case 'code':
      return {
        colorPalette: getColorPalette({ type: 'seed', value: props.value }),
        label: props.value,
      }
    case 'title':
      return {
        colorPalette: 'cp-brand' as const,
        label: props.value,
      }
  }
}

/** A component that renders an academic badge based on its type and value. */
export const AcademicBadge = ({ className, ...props }: AcademicBadgeProps) => {
  const strings = useUIStrings()
  const { colorPalette, label } = getBadgeContent(props, strings)

  return (
    <Badge colorPalette={colorPalette} className={cn('ui-caption', className)}>
      {label}
    </Badge>
  )
}
