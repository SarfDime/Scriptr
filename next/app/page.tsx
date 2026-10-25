import { UI_STRINGS } from '@shared/config/strings'
import { ScriptsSection } from '@/components/academics/scripts/ScriptSection'
import { GuestSubjectsSidebar } from '@/components/academics/subject/GuestSubjectsSidebar'
import { SubjectsSidebar } from '@/components/academics/subject/SubjectsSidebar'
import { Box } from '@/components/common/Box'
import { PageHeader } from '@/components/layout/PageHeader'
import { PageLayout } from '@/components/layout/PageLayout'
import { Divider } from '@/components/ui/Divider'
import { getSession } from '@/lib/api/auth-api'
import { getRequestCookieHeader } from '@/lib/api/next-api'
import { getTopScripts, getTopScriptsForSubjects } from '@/lib/api/scripts-api'
import {
  getIncompleteSubjectIdsForStudies,
  getIncompleteSubjectsForStudies,
} from '@/lib/profile-subjects'
import { toScriptSummaryDetails } from '@/lib/script-display'
import { getDailyStudyTip } from '@/lib/study-tip'

const Page = async () => {
  const cookie = await getRequestCookieHeader()
  const [session, topScripts, studyTip] = await Promise.all([
    getSession(cookie),
    getTopScripts(),
    getDailyStudyTip(),
  ])
  const user = session?.user
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
        <ScriptsSection scripts={scripts} showGlobalSearch />
        {user ? (
          <SubjectsSidebar
            subjects={subjects.slice(0, 3)}
            studyTip={studyTip}
          />
        ) : (
          <GuestSubjectsSidebar studyTip={studyTip} />
        )}
      </Box>
    </PageLayout>
  )
}

export default Page
