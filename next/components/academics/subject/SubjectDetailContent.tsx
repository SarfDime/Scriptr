import { UI_STRINGS_PACK } from '@shared/config/strings'
import { ScriptsSection } from '@/components/academics/scripts/ScriptsSection'
import { SubjectHighlightsCard } from '@/components/academics/subject/SubjectHighlightsCard'
import { BackLink } from '@/components/common/BackLink'
import { PageLayout } from '@/components/layout/PageLayout'
import { RatingsSection } from '@/components/ratings/RatingsSection'
import { getAcademicPath } from '@/lib/academic-routes'
import { getScriptsBySubject } from '@/lib/api/scripts-api'
import { toScriptSummaryDetails } from '@/lib/script-display'
import { getServerLocale, getServerStrings } from '@/lib/server-strings'
import type { SubjectDetail } from '@/types/academics/subject.types'

export type SubjectDetailContentProps = {
  subject: SubjectDetail
  /** The study's page: its site when it has a handle, else its nested URL. */
  studyPath: string
  /** The study's database id, which a create needs the reader to belong to. */
  studyId?: string | null
  /** Slugs to fall back on when the document's own are missing. */
  fallback: {
    universitySlug: string
    facultySlug: string
    studySlug: string
  }
}

/**
 * One subject's page body, shared by the study site and the nested catalog URL
 * a study still has while it has no handle. Only the study link differs between
 * the two, so the caller passes its `studyPath`.
 */
export const SubjectDetailContent = async ({
  subject,
  studyPath,
  studyId,
  fallback,
}: SubjectDetailContentProps) => {
  const ui = await getServerStrings(UI_STRINGS_PACK)
  const locale = await getServerLocale()
  const study = subject.study
  const subjectScripts = subject.dbId
    ? await getScriptsBySubject(subject.dbId)
    : []
  // Every card here is the same subject, whose localized name the page already
  // holds — no need to read it back from Sanity.
  const subjectNames = new Map([[subject._id, subject.name]])
  const scripts = toScriptSummaryDetails(
    subjectScripts ?? [],
    locale,
    subjectNames
  )

  return (
    <PageLayout
      header={{
        greeting: study?.name ?? ui.academics.entity.subject,
        title: subject.name,
        actions: study?.faculty && (
          <>
            <BackLink
              href={studyPath}
              label={study.name ?? ui.academics.entity.study}
            />
            <BackLink
              href={getAcademicPath(
                {
                  type: 'faculty',
                  universitySlug:
                    study.faculty.university?.slug ?? fallback.universitySlug,
                  facultySlug: study.faculty.slug ?? fallback.facultySlug,
                },
                locale
              )}
              label={study.faculty.name}
              backLevel='twoBack'
            />
          </>
        ),
      }}
      sidebar={
        <SubjectHighlightsCard {...subject}>
          {subject.dbId ? (
            <RatingsSection
              key={`ratings-${subject.dbId}`}
              targetType='subject'
              targetId={subject.dbId}
            />
          ) : null}
        </SubjectHighlightsCard>
      }
    >
      <ScriptsSection
        scripts={scripts}
        scriptsUnavailable={subjectScripts === null}
        parentSubject={subject}
        parentSubjectStudyId={studyId}
        showControls={{ subjectFilter: false }}
      />
    </PageLayout>
  )
}
