import { UI_STRINGS } from '@shared/config/strings'
import type { StudySeoQueryResult } from '@shared/types/sanity.types'
import type { WithResolvedSanityData } from '@shared/types/sanity-transform.types'
import { ScriptFeedToggle } from '@/components/academics/scripts/ScriptFeedToggle'
import { ScriptsSection } from '@/components/academics/scripts/ScriptSection'
import { StudySetupGate } from '@/components/academics/setup/StudySetupGate'
import { StudySubjectsPanel } from '@/components/academics/subject/StudySubjectsPanel'
import { Box } from '@/components/common/Box'
import { NextLink } from '@/components/common/NextLink'
import { PageLayout } from '@/components/layout/PageLayout'
import { Divider } from '@/components/ui/Divider'
import { createAcademicMetadata } from '@/lib/academic-detail-page'
import {
  getStudyFeedPath,
  studySiteFeedPath,
  studySiteHomePath,
} from '@/lib/academic-routes'
import { getSession } from '@/lib/api/auth-api'
import { getRequestCookieHeader } from '@/lib/api/next-api'
import { getTopScripts, getTopScriptsForSubjects } from '@/lib/api/scripts-api'
import {
  getIncompleteSubjectIdsForStudies,
  getIncompleteSubjectsForStudies,
} from '@/lib/profile-subjects'
import { ACADEMIC_PAGE_TAGS } from '@/lib/sanity-tags'
import { toScriptSummaryDetails } from '@/lib/script-display'
import { getStudySite, getStudySiteOrNotFound } from '@/lib/study-site'
import { getDailyStudyTip } from '@/lib/study-tip'
import { studySeoQuery } from '@/sanity/queries/academics/study.queries'
import type { StudySiteRouteParams } from '@/types/academics/academics.types'

/** `?scripts=all` switches the feed from the viewer's unfinished subjects to
 * every script in the study. Kept in the URL so the page decides server-side
 * which list to render — no client state, no double fetch. */
const ALL_SCRIPTS_PARAM = 'all'

type StudySeoDetail = NonNullable<WithResolvedSanityData<StudySeoQueryResult>>

export const generateMetadata = createAcademicMetadata<
  StudySeoDetail,
  StudySiteRouteParams
>({
  query: studySeoQuery,
  resolveQueryParams: async ({ siteSlug }) => {
    const site = await getStudySite(siteSlug)
    if (!site) return null
    return {
      universitySlug: site.universitySlug,
      facultySlug: site.facultySlug,
      studySlug: site.studySlug,
    }
  },
  getPath: ({ siteSlug }) => getStudyFeedPath(siteSlug),
  entityLabel: UI_STRINGS.academics.entity.study,
  fetchOriginPrefix: 'study-site-scripts',
  tags: ACADEMIC_PAGE_TAGS.study,
  getOwnSlug: ({ siteSlug }) => siteSlug,
  titleTemplate: (study) => UI_STRINGS.scripts.feed.metadataTitle(study.name),
  descriptionFallback: (study) =>
    UI_STRINGS.scripts.feed.metadataDescription(study.name),
})

/**
 * A study's content surface: the scripts its students share, curated to the
 * reader's unfinished subjects, with their subjects beside it. The study's root
 * is its academic overview, so this is the sub-page a reader goes to once they
 * know what the study is — a cold visitor is not dropped straight into a feed
 * they have to set up to read.
 *
 * Personalized, so it is rendered per request: the audience is the session (a
 * guest sees the study's top scripts), and the study's scripts come from the API
 * with a cookie the cache must not share. The Sanity reads behind the names are
 * still cached by tag.
 */
export default async function StudyScriptsPage({
  params,
  searchParams,
}: {
  params: Promise<StudySiteRouteParams>
  searchParams: Promise<{ scripts?: string }>
}) {
  const [{ siteSlug }, query, cookie] = await Promise.all([
    params,
    searchParams,
    getRequestCookieHeader(),
  ])
  const site = await getStudySiteOrNotFound(siteSlug)
  const showAllScripts = query.scripts === ALL_SCRIPTS_PARAM

  const [session, studyTip] = await Promise.all([
    getSession(cookie),
    getDailyStudyTip(),
  ])
  const user = session?.user
  const studyId = site.dbId

  // Everything below is this study's: its own subjects, its own scripts.
  const [subjects, incompleteSubjectIds] =
    user && studyId
      ? await Promise.all([
          getIncompleteSubjectsForStudies([studyId], user.subjects),
          getIncompleteSubjectIdsForStudies([studyId], user.subjects),
        ])
      : [[], []]

  // Curated by default: the reader's unfinished subjects in this study. The
  // study's top scripts are the fallback and the explicit choice behind the
  // switch, so a guest — or someone with nothing left to take — still lands on
  // something to read.
  const isCurated = !showAllScripts && incompleteSubjectIds.length > 0
  const feedScripts = isCurated
    ? await getTopScriptsForSubjects(incompleteSubjectIds)
    : await getTopScripts(undefined, studyId)
  const scripts = toScriptSummaryDetails(feedScripts ?? [])

  const feedPath = studySiteFeedPath
  const overviewPath = studySiteHomePath

  return (
    <PageLayout
      header={{
        greeting: site.facultyName ?? UI_STRINGS.academics.entity.faculty,
        title: site.name,
        actions: (
          <NextLink href={overviewPath} className='button button-sm subtle'>
            {UI_STRINGS.academics.studyOverview}
          </NextLink>
        ),
      }}
    >
      {site.dbId && <StudySetupGate studyId={site.dbId} />}

      <Divider />
      <Box
        className={
          user
            ? 'grid gap-10 xl:grid-cols-[minmax(0,1fr)_380px]'
            : 'ui-stack gap-10'
        }
      >
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
              <ScriptFeedToggle showAll={showAllScripts} basePath={feedPath} />
            ) : undefined
          }
        />
        {user && <StudySubjectsPanel subjects={subjects} studyTip={studyTip} />}
      </Box>
    </PageLayout>
  )
}
