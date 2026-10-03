'use client'

import { UI_STRINGS } from '@shared/config/strings'
import { ScriptsSection } from '@/components/academics/scripts/ScriptSection'
import { SubjectsSidebar } from '@/components/academics/subject/SubjectsSidebar'
import { ActivityStats } from '@/components/common/ActivityStats'
import { Box } from '@/components/common/Box'
import { PageHeader } from '@/components/layout/PageHeader'
import { PageLayout } from '@/components/layout/PageLayout'
import { Divider } from '@/components/ui/Divider'
import { DEFAULT_ACTIVITY_CONTENT } from '@/config/content'
import {
  FAKE_SCRIPTS,
  subjects,
  subjectsContent,
} from '@/lib/fake-scripts-data'
import type { PageDataProps } from '@/types/components/Scripts.types'

const Page = ({
  greeting = 'Good morning, Nora',
  authoredCount = 8,
  commentCount = 14,
  activityContent = DEFAULT_ACTIVITY_CONTENT,
  subjects: pageSubjects = subjects,
}: PageDataProps) => {
  return (
    <PageLayout>
      <PageHeader
        greeting={greeting}
        title={UI_STRINGS.home.title}
        subtitle={UI_STRINGS.home.subtitle}
      />

      <Divider />
      {/* Make this class a utility class for responsive grid layout */}
      <Box className='grid gap-10 xl:grid-cols-[minmax(0,1fr)_340px]'>
        <ScriptsSection scripts={FAKE_SCRIPTS} />
        <SubjectsSidebar subjects={pageSubjects} content={subjectsContent} />
      </Box>

      <ActivityStats // TODO: Replace hardcoded savedCount with actual data
        savedCount={4}
        authoredCount={authoredCount}
        commentCount={commentCount}
        content={activityContent}
      />
    </PageLayout>
  )
}

export default Page
