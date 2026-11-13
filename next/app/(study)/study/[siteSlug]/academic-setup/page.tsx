import Projects from '@sanity/icons/Projects'
import { UI_STRINGS } from '@shared/config/strings'
import { AcademicSetupForm } from '@/components/academics/setup/AcademicSetupForm'
import { NextLink } from '@/components/common/NextLink'
import { PageLayout } from '@/components/layout/PageLayout'
import { Text } from '@/components/typography/Text'
import { fetchAcademicDetailOrNotFound } from '@/lib/academic-detail-page'
import { getSession } from '@/lib/api/auth-api'
import { getRequestCookieHeader } from '@/lib/api/next-api'
import { ACADEMIC_PAGE_TAGS } from '@/lib/sanity-tags'
import { catalogUrl } from '@/lib/study-origin'
import { getStudySiteOrNotFound } from '@/lib/study-site'
import { studyDetailQuery } from '@/sanity/queries/academics/study.queries'
import type { StudySiteRouteParams } from '@/types/academics/academics.types'
import type { StudyDetail } from '@/types/academics/study.types'

export const metadata = {
  title: UI_STRINGS.onboarding.academicSetup.title,
  robots: { index: false, follow: false },
}

/**
 * One study's academic setup: where the study's gate sends a reader who has no
 * profile for it, where the "finish setup" link returns, and where "edit
 * academics" starts. The study's own subjects are read here on the server, so
 * the page needs no catalog and no provider — the client owns only the ticked
 * boxes and the write.
 *
 * It reads the session, unlike the study's own pages: a member of this study is
 * updating the profile it holds rather than creating one, and the heading, the
 * submit label and the boxes it opens on all differ. The study is still resolved
 * once per request from the tagged cache.
 */
export default async function AcademicSetupPage({
  params,
}: {
  params: Promise<StudySiteRouteParams>
}) {
  const { siteSlug } = await params
  const site = await getStudySiteOrNotFound(siteSlug)
  const cookie = await getRequestCookieHeader()

  const [study, session] = await Promise.all([
    fetchAcademicDetailOrNotFound<StudyDetail>({
      query: studyDetailQuery,
      params: {
        universitySlug: site.universitySlug,
        facultySlug: site.facultySlug,
        studySlug: site.studySlug,
      },
      fetchOrigin: `study-setup-${siteSlug}`,
      tags: ACADEMIC_PAGE_TAGS.study,
    }),
    getSession(cookie),
  ])

  // Only subjects that exist in the database can carry a completion status,
  // which is the same filter the onboarding catalog applies.
  const subjects = (study.subjects ?? []).flatMap((subject) =>
    subject.dbId
      ? [
          {
            _id: subject._id,
            dbId: subject.dbId,
            name: subject.name,
            year: subject.year,
            elective: subject.elective,
          },
        ]
      : []
  )

  const viewer = session?.user ?? null
  const hasProfile = Boolean(
    site.dbId && viewer?.selected_study_ids.includes(site.dbId)
  )
  // The session carries the account's statuses by database id; the pickers work
  // in Sanity ids, and the study's own subjects are already here to translate.
  const completedDbIds = new Set(
    hasProfile
      ? viewer?.subjects
          .filter((subject) => subject.status === 'completed')
          .map((subject) => subject.subject_id)
      : []
  )

  return (
    <PageLayout
      header={{
        greeting: site.name,
        // subtitle:  UI_STRINGS.onboarding.academicSetup.greeting,
        title: hasProfile
          ? UI_STRINGS.onboarding.academicSetup.updateTitle
          : UI_STRINGS.onboarding.academicSetup.title,
        actions: (
          <NextLink
            href={catalogUrl('/start')}
            className='button button-sm subtle gap-1'
          >
            <Projects />
            {UI_STRINGS.onboarding.academicSetup.setupAnother}
          </NextLink>
        ),
      }}
    >
      {site.dbId ? (
        <AcademicSetupForm
          siteSlug={siteSlug}
          studySanityId={site._id}
          studyId={site.dbId}
          studyName={site.name}
          subjects={subjects}
          hasProfile={hasProfile}
          accountCompletedSubjectIds={subjects.flatMap((subject) =>
            completedDbIds.has(subject.dbId) ? [subject._id] : []
          )}
        />
      ) : (
        <Text className='ui-caption'>
          {UI_STRINGS.onboarding.academicSetup.notSynced}
        </Text>
      )}
    </PageLayout>
  )
}
