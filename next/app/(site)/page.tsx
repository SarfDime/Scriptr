import { UI_STRINGS } from '@shared/config/strings'
import { ScriptFeedToggle } from '@/components/academics/scripts/ScriptFeedToggle'
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

/** `?scripts=all` switches the feed from the viewer's subjects to the whole
 * platform. Kept in the URL so the page decides server-side which list to
 * render — no client state, no double fetch. */
const ALL_SCRIPTS_PARAM = 'all'

const Page = async ({
  searchParams,
}: {
  searchParams: Promise<{ scripts?: string }>
}) => {
  const [cookie, params] = await Promise.all([
    getRequestCookieHeader(),
    searchParams,
  ])
  const showAllScripts = params.scripts === ALL_SCRIPTS_PARAM

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

  // Curated by default: a signed-in viewer's own in-progress subjects. The
  // platform-wide top list is the fallback, and the explicit choice behind the
  // feed switch, so early on everyone can still reach every script.
  const isCurated = !showAllScripts && incompleteSubjectIds.length > 0
  const feedScripts = isCurated
    ? await getTopScriptsForSubjects(incompleteSubjectIds)
    : topScripts
  const scripts = toScriptSummaryDetails(feedScripts ?? [])

  return (
    <PageLayout>
      <PageHeader
        greeting={UI_STRINGS.home.greeting}
        title={UI_STRINGS.home.title}
        subtitle={UI_STRINGS.home.subtitle}
      />

      <Divider />
      <Box className='grid gap-10 xl:grid-cols-[minmax(0,1fr)_340px]'>
        <ScriptsSection
          scripts={scripts}
          scriptsUnavailable={feedScripts === null}
          title={showAllScripts ? UI_STRINGS.scripts.feed.allTitle : undefined}
          subtitle={
            showAllScripts ? UI_STRINGS.scripts.feed.allSubtitle : undefined
          }
          // Only worth offering when there is a curated feed to switch away
          // from; a guest (or someone with nothing left to take) has one list.
          headerActions={
            user && incompleteSubjectIds.length > 0 ? (
              <ScriptFeedToggle showAll={showAllScripts} />
            ) : undefined
          }
        />
        {user ? (
          <SubjectsSidebar
            subjects={subjects.slice(0, 3)}
            showAllHref='/user'
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
