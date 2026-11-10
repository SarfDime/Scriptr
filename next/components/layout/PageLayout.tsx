import React, { type ReactNode } from 'react'
import { cn } from '@/lib/common-utils'
import type { CalendarAlertEvent } from '@/types/components/Calendar.types'
import { Box, type BoxProps } from '../common/Box'
import { Header } from '../navigation/Header'
import { Divider, type DividerProps } from '../ui/Divider'
import { Footer } from './Footer'
import { PageHeader } from './PageHeader'

export type PageHeaderConfig = {
  greeting?: string
  title?: string
  subtitle?: string
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

export type MainLayoutProps = BoxProps & {
  /** Only the study tree passes these: a calendar belongs to a study, and its
   * layout is the only place that knows which one on the server. */
  calendarAlert?: {
    events: Array<CalendarAlertEvent>
    calendarHref: string
  }
}

export const MainLayout = ({
  children,
  className,
  calendarAlert,
  ...rest
}: MainLayoutProps) => {
  return (
    <Box
      as='main'
      id='main'
      className={cn('ui-container flex flex-col', className)}
      {...rest}
    >
      <Header calendarAlert={calendarAlert} />
      {/* The container grows to full width while the navbar is collapsed (so the
          header spans the screen); page content keeps its docked-navbar width
          and is centered. `grow` pushes the footer to the bottom of short pages. */}
      <Box className='mx-auto w-full grow xl:max-w-(--nav-width-offset)'>
        {children}
      </Box>
      <Footer />
    </Box>
  )
}

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
