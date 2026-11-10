import { UI_STRINGS } from '@shared/config/strings'
import { ProfessorsSection } from '@/components/academics/professor/ProfessorsSection'
import { ScriptsSection } from '@/components/academics/scripts/ScriptSection'
import { StudyOverviewCard } from '@/components/academics/study/StudyOverviewCard'
import { SubjectsExplorer } from '@/components/academics/subject/SubjectsExplorer'
import { BackLink } from '@/components/common/BackLink'
import { PageLayout } from '@/components/layout/PageLayout'
import { getAcademicPath } from '@/lib/academic-routes'
import { getScriptsByStudy } from '@/lib/api/scripts-api'
import { toScriptSummaryDetails } from '@/lib/script-display'
import type { StudyDetail } from '@/types/academics/study.types'

export type StudyDetailContentProps = {
  study: StudyDetail
  /** Slugs to fall back on when a parent document's own are missing. */
  fallback: { universitySlug: string; facultySlug: string }
  /** The study's database id. Its scripts are only readable with it. */
  studyId: string | null
}

/**
 * One study's page body, shared by its site (`/study/[siteSlug]`) and the
 * nested catalog URL a study still has while it has no handle. Both parents are
 * catalog pages either way, so the breadcrumbs do not depend on which route
 * rendered it.
 */
export const StudyDetailContent = async ({
  study,
  fallback,
  studyId,
}: StudyDetailContentProps) => {
  const studyScripts = studyId ? await getScriptsByStudy(studyId) : []
  const scripts = studyScripts ? toScriptSummaryDetails(studyScripts) : []

  return (
    <PageLayout
      header={{
        greeting: study.faculty?.name ?? UI_STRINGS.academics.entity.faculty,
        title: study.name,
        actions: (
          <>
            <BackLink
              href={getAcademicPath({
                type: 'faculty',
                universitySlug:
                  study.faculty?.university?.slug ?? fallback.universitySlug,
                facultySlug: study.faculty?.slug ?? fallback.facultySlug,
              })}
              label={study.faculty?.name ?? UI_STRINGS.academics.entity.faculty}
            />
            <BackLink
              href={getAcademicPath({
                type: 'university',
                universitySlug:
                  study.faculty?.university?.slug ?? fallback.universitySlug,
              })}
              label={
                study.faculty?.university?.name ??
                UI_STRINGS.academics.entity.university
              }
              backLevel='twoBack'
            />
          </>
        ),
      }}
      sidebar={<ProfessorsSection professors={study.professors} />}
    >
      <StudyOverviewCard study={study} />

      <SubjectsExplorer subjects={study.subjects ?? []} />

      {/* The study's own scripts, with search, subject filter and sort inline:
        the site is where a reader looks for them, so they live on its home
        rather than on a listing page of their own. */}
      <ScriptsSection
        scripts={scripts}
        scriptsUnavailable={studyId !== null && studyScripts === null}
      />
    </PageLayout>
  )
}
