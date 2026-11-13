import Folder from '@sanity/icons/Folder'
import { UI_STRINGS } from '@shared/config/strings'
import { ProfessorsSection } from '@/components/academics/professor/ProfessorsSection'
import { ScriptsSection } from '@/components/academics/scripts/ScriptsSection'
import { StudyOverviewCard } from '@/components/academics/study/StudyOverviewCard'
import { SubjectsExplorer } from '@/components/academics/subject/SubjectsExplorer'
import { BackLink } from '@/components/common/BackLink'
import { NextLink } from '@/components/common/NextLink'
import { PageLayout } from '@/components/layout/PageLayout'
import { getAcademicPath, getStudyFeedPath } from '@/lib/academic-routes'
import { catalogUrl } from '@/lib/study-origin'
import type { StudyDetail } from '@/types/academics/study.types'
import type { ScriptDetail } from '@/types/components/Scripts.types'

export type StudyDetailContentProps = {
  study: StudyDetail
  /** Slugs to fall back on when a parent document's own are missing. */
  fallback: { universitySlug: string; facultySlug: string }
  /** The study's top scripts, for the sidebar beside the professors. */
  scripts: Array<ScriptDetail>
  /** `true` when the script read failed, so the sidebar does not claim there
   * are none. */
  scriptsUnavailable?: boolean
}

/**
 * A study's academic overview: the overview card, its subjects and its
 * professors. It is the study site's root (`/study/[siteSlug]`), so the page
 * leads with what the study is; the scripts are a step ahead through the header
 * action rather than the landing content.
 */
export const StudyDetailContent = ({
  study,
  fallback,
  scripts,
  scriptsUnavailable,
}: StudyDetailContentProps) => {
  return (
    <PageLayout
      header={{
        greeting: study.faculty?.name ?? UI_STRINGS.academics.entity.faculty,
        title: study.name,
        actions: (
          <>
            <NextLink
              href={getStudyFeedPath(study.siteSlug)}
              className='button button-sm solid'
            >
              <Folder />
              {UI_STRINGS.scripts.browseAll}
            </NextLink>
            <BackLink
              href={catalogUrl(
                getAcademicPath({
                  type: 'faculty',
                  universitySlug:
                    study.faculty?.university?.slug ?? fallback.universitySlug,
                  facultySlug: study.faculty?.slug ?? fallback.facultySlug,
                })
              )}
              label={study.faculty?.name ?? UI_STRINGS.academics.entity.faculty}
              backLevel='twoBack'
            />
            <BackLink
              href={catalogUrl(
                getAcademicPath({
                  type: 'university',
                  universitySlug:
                    study.faculty?.university?.slug ?? fallback.universitySlug,
                })
              )}
              label={
                study.faculty?.university?.name ??
                UI_STRINGS.academics.entity.university
              }
              backLevel='threeBack'
            />
          </>
        ),
      }}
      sidebar={
        <>
          <ProfessorsSection professors={study.professors} />
          <ScriptsSection
            scripts={scripts}
            scriptsUnavailable={scriptsUnavailable}
            title={UI_STRINGS.scripts.studySidebarTitle}
            subtitle={UI_STRINGS.scripts.studySidebarSubtitle}
            emptyMessage={UI_STRINGS.scripts.studySidebarEmpty}
            showControls={{
              all: true,
              search: true,
              filters: false,
              create: false,
            }}
            headerActions={
              <NextLink
                href={getStudyFeedPath(study.siteSlug)}
                className='button button-sm subtle'
              >
                {UI_STRINGS.scripts.showAll}
              </NextLink>
            }
          />
        </>
      }
    >
      <StudyOverviewCard study={study} />

      <SubjectsExplorer subjects={study.subjects ?? []} />
    </PageLayout>
  )
}
