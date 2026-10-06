import { UI_STRINGS } from '@shared/config/strings'
import { ScriptsSection } from '@/components/academics/scripts/ScriptSection'
import { SubjectsSidebar } from '@/components/academics/subject/SubjectsSidebar'
import { Box } from '@/components/common/Box'
import { PageHeader } from '@/components/layout/PageHeader'
import { PageLayout } from '@/components/layout/PageLayout'
import { Text } from '@/components/typography/Text'
import { Divider } from '@/components/ui/Divider'
import { SUBJECTS_SIDEBAR_CONTENT } from '@/config/content'
import { getSession } from '@/lib/api/auth-api'
import { getRequestCookieHeader } from '@/lib/api/next-api'
import { getTopScripts, getTopScriptsForSubjects } from '@/lib/api/scripts-api'
import {
  getIncompleteSubjectIdsForStudies,
  getIncompleteSubjectsForStudies,
} from '@/lib/profile-subjects'
import { toScriptSummaryDetails } from '@/lib/script-display'
import type { SubjectById } from '@/types/academics/subject.types'

function renderSubjectsSidebar(
  isAuthenticated: boolean,
  subjects: Array<SubjectById>
) {
  if (!isAuthenticated) {
    return (
      <Box as='aside' className='ui-stack gap-3'>
        <Text className='ui-title'>Discover subjects</Text>
        <Text className='ui-body text-grey-500'>
          Sign in and select your studies to see subjects tailored to you.
        </Text>
      </Box>
    )
  }

  if (subjects.length === 0) {
    return (
      <Box as='aside' className='ui-stack gap-3'>
        <Text className='ui-title'>Your subjects</Text>
        <Text className='ui-body text-grey-500'>
          Complete your study setup to see your current subjects here.
        </Text>
      </Box>
    )
  }

  return (
    <SubjectsSidebar subjects={subjects} content={SUBJECTS_SIDEBAR_CONTENT} />
  )
}

const Page = async () => {
  const cookie = await getRequestCookieHeader()
  const [session, topScripts] = await Promise.all([
    getSession(cookie),
    getTopScripts(),
  ])
  const user = session.user
  const [subjects, incompleteSubjectIds] = user
    ? await Promise.all([
        getIncompleteSubjectsForStudies(user.selected_study_ids, user.subjects),
        getIncompleteSubjectIdsForStudies(
          user.selected_study_ids,
          user.subjects
        ),
      ])
    : [[], []]
  const scripts = toScriptSummaryDetails(
    incompleteSubjectIds.length > 0
      ? await getTopScriptsForSubjects(incompleteSubjectIds)
      : topScripts
  )

  return (
    <PageLayout>
      <PageHeader
        greeting='Welcome'
        title={UI_STRINGS.home.title}
        subtitle={UI_STRINGS.home.subtitle}
      />

      <Divider />
      <Box className='grid gap-10 xl:grid-cols-[minmax(0,1fr)_340px]'>
        <ScriptsSection scripts={scripts} />
        {renderSubjectsSidebar(Boolean(user), subjects)}
      </Box>
    </PageLayout>
  )
}

export default Page
