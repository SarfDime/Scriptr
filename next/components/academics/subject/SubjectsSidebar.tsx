'use client'

import { cn } from '@/lib/common-utils'
import { useUIStrings } from '@/providers/locale/use-strings'
import type { SubjectsSidebarProps } from '@/types/academics/subject.types'
import { Box } from '../../common/Box'
import { SectionHeader } from '../../common/SectionHeader'
import { ShowMoreList } from '../../common/ShowMoreList'
import { SubjectCard } from './SubjectCard'

const LIST_MAX_HEIGHT = 'max-h-[36rem]'

/** The "Your subjects" sidebar: a header and the subject list (or
 * `emptyMessage` when there are none). */
export const SubjectsSidebar = ({
  subjects,
  title,
  subtitle,
  emptyMessage,
  toolbar,
  headerProps,
  className,
  ...props
}: SubjectsSidebarProps) => {
  const ui = useUIStrings()
  const hasSubjects = subjects.length > 0

  return (
    <Box
      as='aside'
      className={cn('ui-stack ui-above h-fit min-w-0', className)}
      {...props}
    >
      <SectionHeader
        title={title ?? ui.subjects.sidebarTitle}
        titleVariant='modern'
        subtitle={
          hasSubjects ? subtitle : (emptyMessage ?? ui.subjects.emptyState)
        }
        {...headerProps}
      />

      {toolbar}

      {hasSubjects && (
        <ShowMoreList
          className={cn('space-y-3 overflow-y-auto', LIST_MAX_HEIGHT)}
        >
          {subjects.map((item) => (
            <SubjectCard key={item._id} {...item} />
          ))}
        </ShowMoreList>
      )}
    </Box>
  )
}
