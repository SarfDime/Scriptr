import { UI_STRINGS } from '@shared/config/strings'
import {
  StudyPicker,
  type StudyPickerCatalog,
} from '@/components/academics/setup/StudyPicker'
import { PageLayout } from '@/components/layout/PageLayout'
import { ACADEMIC_CATALOG_TAGS } from '@/lib/sanity-tags'
import { fetchSanityData } from '@/sanity/lib/utils'
import { studyPickerQuery } from '@/sanity/queries/academics/study.queries'

/**
 * Entry point for someone who has not picked a study yet: the catalog tree, and
 * a hand-off into that study's setup. Guests and signed-in readers see the same
 * page — nothing here reads the session.
 *
 * Cached until the publish webhook invalidates it, like the rest of the catalog.
 */
export const revalidate = false

export const metadata = {
  title: UI_STRINGS.onboarding.studySelection.title,
}

export default async function StartPage() {
  const catalog = await fetchSanityData<StudyPickerCatalog>({
    query: studyPickerQuery,
    fetchOrigin: 'study-picker',
    tags: ACADEMIC_CATALOG_TAGS,
  })

  return (
    <PageLayout
      header={{
        title: UI_STRINGS.onboarding.studySelection.title,
        greeting: UI_STRINGS.onboarding.studySelection.subtitle,
      }}
    >
      <StudyPicker
        catalog={catalog ?? { universities: [], faculties: [], studies: [] }}
      />
    </PageLayout>
  )
}
