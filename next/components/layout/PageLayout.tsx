import React, { type ReactNode } from 'react'
import { cn } from '@/lib/common-utils'
import { Box } from '../common/Box'
import { Header } from '../navigation/Header'
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
  className?: string
  contentClassName?: string
}

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

export const PageLayout = ({
  header,
  sidebar,
  children,
  className,
  contentClassName,
}: PageLayoutProps) => {
  return (
    <Box as='main' className={cn('ui-container', className)}>
      <Header />
      <Box className={cn('ui-stack ui-section gap-8', contentClassName)}>
        {header &&
          (isHeaderConfig(header) ? (
            <PageHeader
              greeting={header.greeting}
              title={header.title}
              subtitle={header.subtitle}
            >
              {header.actions}
            </PageHeader>
          ) : (
            header
          ))}

        {sidebar ? (
          <Box className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
            <Box className='lg:col-span-2 ui-stack gap-6'>{children}</Box>
            <Box className='ui-stack gap-6'>{sidebar}</Box>
          </Box>
        ) : (
          children
        )}
      </Box>
    </Box>
  )
}
