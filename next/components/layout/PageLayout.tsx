import React, { type ReactNode } from 'react'
import { cn } from '@/lib/common-utils'
import { Box, type BoxProps } from '../common/Box'
import { Divider, type DividerProps } from '../ui/Divider'
import { PageHeader, type PageHeaderProps } from './PageHeader'

/** The `header` shorthand: `PageHeader`'s own props, plus `actions` where its
 * children would go. Copy may be a string or an `{ en, mk }` entry, which
 * `PageHeader` resolves in the reader's language. */
export type PageHeaderConfig = Omit<PageHeaderProps, 'children'> & {
  actions?: ReactNode
}

export type PageLayoutProps = {
  header?: PageHeaderConfig | ReactNode
  sidebar?: ReactNode
  children: ReactNode
  dividerProps?: DividerProps & { showDivider?: boolean }
  contentProps?: BoxProps
} & BoxProps

const isHeaderConfig = (
  header: PageHeaderConfig | ReactNode
): header is PageHeaderConfig => {
  return (
    !React.isValidElement(header) &&
    header !== null &&
    typeof header === 'object' &&
    ('title' in header ||
      'greeting' in header ||
      'subtitle' in header ||
      'actions' in header)
  )
}

/** A page's content column — an optional heading, a main column and a sidebar.
 * The chrome around it is `MainLayout`, which its group layout renders.
 *
 * A Server Component, like `PageHeader`: header copy can be passed as an
 * `{ en, mk }` entry and is resolved below, so a page does not have to read a
 * whole string collection to render a title. */
export const PageLayout = ({
  header,
  sidebar,
  children,
  className,
  dividerProps,
  ...rest
}: PageLayoutProps) => {
  return (
    <Box className={cn('ui-stack ui-section gap-6', className)} {...rest}>
      {header &&
        (isHeaderConfig(header) ? (
          <PageHeader
            greeting={header.greeting}
            title={header.title}
            subtitle={header.subtitle}
          >
            <Box className='ui-cluster gap-2.5'>{header.actions}</Box>
          </PageHeader>
        ) : (
          header
        ))}

      {dividerProps?.showDivider && <Divider {...dividerProps} />}

      {sidebar ? (
        <Box className='flex flex-col lg:flex-row gap-8 items-stretch w-full'>
          <Box className='w-full lg:flex-2 min-w-0 ui-stack gap-6 flex flex-col'>
            {children}
          </Box>
          <Box className='w-full lg:flex-1 min-w-0 ui-stack gap-6 flex flex-col'>
            {sidebar}
          </Box>
        </Box>
      ) : (
        children
      )}
    </Box>
  )
}
