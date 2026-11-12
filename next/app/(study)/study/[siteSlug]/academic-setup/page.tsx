import { UI_STRINGS } from '@shared/config/strings'
import { AcademicSetupForm } from '@/components/academics/setup/AcademicSetupForm'
import { PageLayout } from '@/components/layout/PageLayout'
import { fetchAcademicDetailOrNotFound } from '@/lib/academic-detail-page'
import { ACADEMIC_PAGE_TAGS } from '@/lib/sanity-tags'
import { getStudySiteOrNotFound } from '@/lib/study-site'
import { studyDetailQuery } from '@/sanity/queries/academics/study.queries'
import type { StudySiteRouteParams } from '@/types/academics/academics.types'
import type { StudyDetail } from '@/types/academics/study.types'

/**
 * One study's academic setup: where the study's gate sends a reader who has no
 * profile for it, and where the "finish setup" link returns. The study's own
 * subjects are read here on the server, so the page needs no catalog and no
 * provider — the client owns only the ticked boxes and the write.
 */
export const revalidate = false

export const metadata = {
  title: UI_STRINGS.onboarding.academicSetup.title,
  robots: { index: false, follow: false },
}

export default async function AcademicSetupPage({
  params,
}: {
  params: Promise<StudySiteRouteParams>
}) {
  const { siteSlug } = await params
  const site = await getStudySiteOrNotFound(siteSlug)

  const study = await fetchAcademicDetailOrNotFound<StudyDetail>({
    query: studyDetailQuery,
    params: {
      universitySlug: site.universitySlug,
      facultySlug: site.facultySlug,
      studySlug: site.studySlug,
    },
    fetchOrigin: `study-setup-${siteSlug}`,
    tags: ACADEMIC_PAGE_TAGS.study,
  })

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

  return (
    <PageLayout
      header={{
        greeting: site.name,
        title: UI_STRINGS.onboarding.academicSetup.title,
      }}
    >
      {site.dbId ? (
        <AcademicSetupForm
          studySanityId={site._id}
          studyId={site.dbId}
          studyName={site.name}
          subjects={subjects}
        />
      ) : (
        <p className='ui-caption'>
          {UI_STRINGS.onboarding.academicSetup.notSynced}
        </p>
      )}
    </PageLayout>
  )
}
