import { Badge, type BadgeProps } from '@/components/ui/Badge'
import { getColorPalette } from '@/lib/color-pallette-gen'
import { cn } from '@/lib/common-utils'
import type { SubjectSemester } from '@/types/academics/subject.types'

type AcademicBadgeProps = (
  | { type: 'year'; value: number }
  | { type: 'credits'; value: number }
  | { type: 'semester'; value: SubjectSemester }
  | { type: 'code'; value: string }
  | { type: 'title'; value: string }
) &
  Omit<BadgeProps, 'colorPalette' | 'children'>

const getBadgeContent = (props: AcademicBadgeProps) => {
  switch (props.type) {
    case 'year':
      return {
        colorPalette: getColorPalette({ type: 'year', value: props.value }),
        label: `Year ${props.value}`,
      }
    case 'credits':
      return {
        colorPalette: getColorPalette({ type: 'credits', value: props.value }),
        label: `${props.value} ECTS`,
      }
    case 'semester':
      return {
        colorPalette: getColorPalette({ type: 'semester', value: props.value }),
        label: props.value,
        className: 'capitalize',
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
  const {
    colorPalette,
    label,
    className: badgeClassName,
  } = getBadgeContent(props)

  return (
    <Badge
      colorPalette={colorPalette}
      className={cn('ui-caption', className, badgeClassName)}
    >
      {label}
    </Badge>
  )
}
