import { UI_STRINGS } from '@shared/config/strings'
import { Divider } from '@/components/ui/Divider'
import { cn } from '@/lib/common-utils'
import type { SubjectsSidebarProps } from '@/types/academics/subject.types'
import { Box } from '../../common/Box'
import { SectionHeader } from '../../common/SectionHeader'
import { StudyTipCard } from '../../common/StudyTipCard'
import { SubjectCard } from './SubjectCard'

/** The "Your subjects" sidebar: a header, the subject list (or `emptyMessage`
 * when there are none) and the study tip. */
export const SubjectsSidebar = ({
  subjects,
  title = UI_STRINGS.subjects.sidebarTitle,
  subtitle = UI_STRINGS.subjects.sidebarSubtitle,
  emptyMessage = UI_STRINGS.subjects.emptyState,
  toolbar,
  headerProps,
  className,
  ...props
}: SubjectsSidebarProps) => {
  const hasSubjects = subjects.length > 0

  return (
    <Box
      as='aside'
      className={cn('ui-stack ui-above-light h-fit', className)}
      {...props}
    >
      <SectionHeader
        title={title}
        subtitle={hasSubjects ? subtitle : emptyMessage}
        {...headerProps}
      />

      {toolbar}

      {hasSubjects && (
        <Box className='ui-stack gap-3'>
          {subjects.map((item) => (
            <SubjectCard key={item._id} {...item} />
          ))}
        </Box>
      )}
      <Divider />
      <StudyTipCard />
    </Box>
  )
}
