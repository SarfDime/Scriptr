import type { LocaleId } from '@shared/config/localization-constants'
import { UI_STRINGS_PACK } from '@shared/config/strings'
import type { StudySeoQueryResult } from '@shared/types/sanity.types'
import type { WithResolvedSanityData } from '@shared/types/sanity-transform.types'
import type { ScriptSummary } from '@shared/types/scripts.types'
import type { ReactNode } from 'react'
import { Suspense } from 'react'
import { ScriptFeedToggle } from '@/components/academics/scripts/ScriptFeedToggle'
import {
  ScriptsListSkeleton,
  ScriptsPageSkeleton,
} from '@/components/academics/scripts/ScriptsPageSkeleton'
import { ScriptsSection } from '@/components/academics/scripts/ScriptsSection'
import { StudySetupGate } from '@/components/academics/setup/StudySetupGate'
import { StudySubjectsPanel } from '@/components/academics/subject/StudySubjectsPanel'
import { Box } from '@/components/common/Box'
import { NextLink } from '@/components/common/NextLink'
import { PageLayout } from '@/components/layout/PageLayout'
import { createAcademicMetadata } from '@/lib/academic-metadata'
import { getStudyFeedPath, getStudySiteUrl } from '@/lib/academic-routes'
import { getSession } from '@/lib/api/auth-api'
import { getRequestCookieHeader } from '@/lib/api/next-api'
import {
  getTopScripts,
  getTopScriptsForSubjects,
  searchScripts,
} from '@/lib/api/scripts-api'
import {
  getAllSubjectsForStudies,
  getIncompleteSubjectIdsForStudies,
} from '@/lib/profile-subjects'
import { ACADEMIC_PAGE_TAGS } from '@/lib/sanity-tags'
import { toScriptSummaryDetails } from '@/lib/script-display'
import {
  normalizeSearchQuery,
  type SearchQueryParam,
} from '@/lib/script-search'
import { getServerStrings } from '@/lib/server-strings'
import { studySitePath } from '@/lib/study-origin'
import {
  getStudySite,
  getStudySiteOrNotFound,
  type StudySite,
} from '@/lib/study-site'
import { getScriptSubjectNames } from '@/lib/subject-ref'
import { studySeoQuery } from '@/sanity/queries/academics/study.queries'
import type { StudySiteRouteParams } from '@/types/academics/academics.types'
import type { LocalePageProps } from '@/types/localization.types'

/** `?scripts=all` switches the feed from the viewer's unfinished subjects to
 * every script in the study. Kept in the URL so the page decides server-side
 * which list to render — no client state, no double fetch. */
const ALL_SCRIPTS_PARAM = 'all'

/** The curated feed is off for now: the page lists every script and every
 * subject in the study. The switch and the per-subject read stay, so this flag
 * is all turning it back on takes. */
const CURATED_FEED_ENABLED: boolean = false

type StudySeoDetail = NonNullable<WithResolvedSanityData<StudySeoQueryResult>>

export const generateMetadata = createAcademicMetadata<
  StudySeoDetail,
  StudySiteRouteParams
>({
  query: studySeoQuery,
  resolveQueryParams: async ({ siteSlug }, locale) => {
    const site = await getStudySite(siteSlug, locale)
    if (!site) return null
    return {
      universitySlug: site.universitySlug,
      facultySlug: site.facultySlug,
      studySlug: site.studySlug,
    }
  },
  getPath: ({ siteSlug }, locale) => getStudyFeedPath(siteSlug, locale),
  entityLabel: (strings) => strings.academics.entity.study,
  fetchOriginPrefix: 'study-site-scripts',
  tags: ACADEMIC_PAGE_TAGS.study,
  getOwnSlug: ({ siteSlug }) => siteSlug,
  titleTemplate: (study, strings) =>
    strings.scripts.feed.metadataTitle(study.name),
  descriptionFallback: (study, strings) =>
    strings.scripts.feed.metadataDescription(study.name),
})

/**
 * A study's content surface: every script its students share, with the study's
 * subjects beside it. The study's root is its academic overview, so this is the
 * sub-page a reader goes to once they know what the study is — a cold visitor
 * is not dropped straight into a feed they have to set up to read.
 *
 * Two parts, because they resolve at different times. The page frame is the
 * study's own — its name, its faculty, the way back to the overview, and the
 * setup gate — and is prerendered per study. The feed below it is read for the
 * reader (the audience is the session: a guest sees the study's top scripts, a
 * member the same list plus their subjects) and streams in.
 *
 * `?q=` turns it into this study's search results: the study's own header bar
 * submits here, because `/search` in the catalog is the catalog's — universities
 * and professors — and never a study's scripts.
 */
export default function StudyScriptsPage({
  params,
  searchParams,
}: LocalePageProps<StudySiteRouteParams> & {
  searchParams: Promise<{ scripts?: string; q?: SearchQueryParam }>
}) {
  return (
    <Suspense fallback={<ScriptsPageSkeleton />}>
      <StudyScriptsFrame params={params} searchParams={searchParams} />
    </Suspense>
  )
}

async function StudyScriptsFrame({
  params,
  searchParams,
}: LocalePageProps<StudySiteRouteParams> & {
  searchParams: Promise<{ scripts?: string; q?: SearchQueryParam }>
}) {
  const { siteSlug, locale } = await params
  const site = await getStudySiteOrNotFound(siteSlug)
  const UI_STRINGS = await getServerStrings(UI_STRINGS_PACK, locale)

  return (
    <PageLayout
      header={{
        greeting: site.facultyName ?? UI_STRINGS.academics.entity.faculty,
        title: site.name,
        actions: (
          <NextLink
            href={getStudySiteUrl(siteSlug, locale)}
            className='button button-sm subtle'
          >
            {UI_STRINGS.academics.studyOverview}
          </NextLink>
        ),
      }}
    >
      {site.dbId && <StudySetupGate siteSlug={siteSlug} studyId={site.dbId} />}

      <Suspense fallback={<ScriptsListSkeleton />}>
        <StudyScriptsFeed
          site={site}
          siteSlug={siteSlug}
          locale={locale}
          searchParams={searchParams}
        />
      </Suspense>
    </PageLayout>
  )
}

async function StudyScriptsFeed({
  site,
  siteSlug,
  locale,
  searchParams,
}: {
  site: StudySite
  siteSlug: string
  locale: LocaleId
  searchParams: Promise<{ scripts?: string; q?: SearchQueryParam }>
}) {
  const [query, cookie] = await Promise.all([
    searchParams,
    getRequestCookieHeader(),
  ])
  const UI_STRINGS = await getServerStrings(UI_STRINGS_PACK, locale)
  const showAllScripts = query.scripts === ALL_SCRIPTS_PARAM
  // The study's header search lands here with `?q=`: the catalog's `/search`
  // never carries a study's content, so the study's own feed answers it.
  const searchQuery = normalizeSearchQuery(query.q)
  const searching = searchQuery.length > 0

  const session = await getSession(cookie)

  const user = session?.user
  const studyId = site.dbId

  // Everything below is this study's: its own subjects, its own scripts.
  // The incomplete ids only feed the curated branch, so with curation off they
  // are not read at all.
  const [subjects, incompleteSubjectIds] =
    user && studyId
      ? await Promise.all([
          getAllSubjectsForStudies([studyId]),
          CURATED_FEED_ENABLED
            ? getIncompleteSubjectIdsForStudies([studyId], user.subjects)
            : [],
        ])
      : [[], []]

  // With curation on, the reader's unfinished subjects in this study; the
  // study's top scripts are the fallback and the explicit choice behind the
  // switch, so a guest — or someone with nothing left to take — still lands on
  // something to read. A search is neither: the API matches the query against
  // every script in the study.
  const usesCuratedFeed =
    CURATED_FEED_ENABLED && incompleteSubjectIds.length > 0
  const isCurated = !showAllScripts && usesCuratedFeed

  let feedScripts: Array<ScriptSummary> | null
  if (searching) {
    feedScripts = studyId ? await searchScripts(searchQuery, studyId) : null
  } else if (isCurated) {
    feedScripts = await getTopScriptsForSubjects(incompleteSubjectIds)
  } else {
    feedScripts = await getTopScripts(undefined, studyId)
  }
  const subjectNames = await getScriptSubjectNames(
    (feedScripts ?? []).map((script) => script.subject?.sanity_id)
  )
  const scripts = toScriptSummaryDetails(
    feedScripts ?? [],
    locale,
    subjectNames
  )

  const feedPath = getStudyFeedPath(siteSlug, locale)
  // Where the page's own search bar submits: a path on this site, so the study
  // host answers it without the cross-origin redirect a feed URL would take.
  const searchPath = studySitePath(siteSlug, '/scripts', locale)

  // A search result list is already filtered by the server, so the subject and
  // sort controls would only narrow it again; the bar stays so a new query can
  // be typed and submitted.
  const searchControls = { all: true, search: true, filters: false }

  let feedTitle: string | undefined
  let feedSubtitle: string | undefined
  let emptyMessage: string | undefined
  if (searching) {
    feedTitle = UI_STRINGS.scripts.feed.searchTitle(searchQuery)
    emptyMessage = UI_STRINGS.scripts.feed.searchEmpty(searchQuery)
  } else if (showAllScripts || !CURATED_FEED_ENABLED) {
    feedTitle = UI_STRINGS.scripts.feed.allTitle
    feedSubtitle = UI_STRINGS.scripts.feed.allSubtitle
  } else {
    feedTitle = UI_STRINGS.scripts.feed.forYouTitle
  }

  let headerActions: ReactNode
  if (searching) {
    headerActions = (
      <NextLink href={feedPath} className='button button-sm subtle'>
        {UI_STRINGS.scripts.feed.clearSearch}
      </NextLink>
    )
  } else if (user && usesCuratedFeed) {
    // Only worth offering when there is a curated feed to switch away from; a
    // guest (or someone with nothing left to take) has one list.
    headerActions = (
      <ScriptFeedToggle showAll={showAllScripts} basePath={feedPath} />
    )
  }

  return (
    <Box
      className={
        user
          ? 'grid gap-10 xl:grid-cols-[minmax(0,1fr)_380px]'
          : 'ui-stack gap-10'
      }
    >
      <ScriptsSection
        key={searchQuery}
        scripts={scripts}
        scriptsUnavailable={feedScripts === null}
        title={feedTitle}
        subtitle={feedSubtitle}
        searchPath={searchPath}
        searchQuery={searching ? searchQuery : undefined}
        showControls={searching ? searchControls : undefined}
        emptyMessage={emptyMessage}
        headerActions={headerActions}
        initialPageSize={9}
        pageSize={3}
      />
      {user && <StudySubjectsPanel subjects={subjects} />}
    </Box>
  )
}
