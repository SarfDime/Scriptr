import { cn } from '@/lib/common-utils'
import type { SectionHeaderProps } from '@/types/components/SectionHeader.types'
import { Text } from '../typography/Text'
import { Title } from '../typography/Title'
import { Badge } from '../ui/Badge'
import { Box } from './Box'

/**
 * Heading for a page section: optional icon, title, count badge and end-aligned
 * actions on one row, with an optional subtitle underneath. Typography comes
 * from `ui-title` / `ui-subtitle`, so every section reads the same.
 *
 * ```tsx
 * <SectionHeader title='Files' count={3} icon={DocumentIcon} />
 * <SectionHeader title='Comments' subtitle='Join the discussion' actions={<Button />} />
 * ```
 */
export const SectionHeader = ({
  title,
  subtitle,
  icon: Icon,
  count,
  actions,
  as = 'h2',
  titleVariant = 'title',
  align = 'start',
  titleProps,
  subtitleProps,
  iconProps,
  badgeProps,
  className,
  ...rest
}: SectionHeaderProps) => {
  const isCentered = align === 'center'

  return (
    <Box
      className={cn(
        'ui-stack gap-1',
        isCentered && 'items-center text-center',
        className
      )}
      {...rest}
    >
      <Box
        className={cn(
          'ui-cluster justify-between gap-3',
          isCentered && 'justify-center'
        )}
      >
        <Box className='ui-cluster min-w-0 items-center gap-2'>
          {Icon && (
            <Icon
              aria-hidden='true'
              {...iconProps}
              className={cn(
                'size-5 shrink-0',
                !iconProps?.className?.includes('text-') && 'text-brand-600',
                iconProps?.className
              )}
            />
          )}
          <Title
            as={as}
            {...titleProps}
            className={cn(
              titleVariant === 'heading' ? 'ui-heading' : 'ui-title',
              titleProps?.className
            )}
          >
            {title}
          </Title>
          {count !== undefined && (
            <Badge colorPalette='cp-brand' {...badgeProps}>
              {count}
            </Badge>
          )}
        </Box>
        {actions}
      </Box>
      {subtitle && (
        <Text
          {...subtitleProps}
          className={cn('ui-subtitle', subtitleProps?.className)}
        >
          {subtitle}
        </Text>
      )}
    </Box>
  )
}
