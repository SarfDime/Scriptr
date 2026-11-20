import { UI_STRINGS_PACK } from '@shared/config/strings'
import { localizedPath } from '@shared/utils/localized-path'
import {
  StudyPicker,
  type StudyPickerCatalog,
} from '@/components/academics/setup/StudyPicker'
import { PageLayout } from '@/components/layout/PageLayout'
import { languageAlternates } from '@/lib/localized-metadata'
import { ACADEMIC_CATALOG_TAGS } from '@/lib/sanity-tags'
import { getServerStrings } from '@/lib/server-strings'
import { fetchSanityData } from '@/sanity/lib/utils'
import { studyPickerQuery } from '@/sanity/queries/academics/study.queries'
import type { LocalePageProps } from '@/types/localization.types'

/**
 * Entry point for someone who has not picked a study yet: the catalog tree, and
 * a hand-off into that study's setup. Guests and signed-in readers see the same
 * page — nothing here reads the session.
 *
 * Cached until the publish webhook invalidates it, like the rest of the catalog.
 */
export const ensureStatic = 'navigation'

export async function generateMetadata({ params }: LocalePageProps) {
  const path = '/start'
  const { locale } = await params
  const UI_STRINGS = await getServerStrings(UI_STRINGS_PACK, locale)

  return {
    title: UI_STRINGS.onboarding.studySelection.title,
    alternates: {
      canonical: localizedPath(path, locale),
      languages: languageAlternates(path),
    },
  }
}

export default async function StartPage({ params }: LocalePageProps) {
  const { locale } = await params
  const UI_STRINGS = await getServerStrings(UI_STRINGS_PACK, locale)
  const catalog = await fetchSanityData<StudyPickerCatalog>({
    query: studyPickerQuery,
    locale,
    fetchOrigin: 'study-picker',
    tags: ACADEMIC_CATALOG_TAGS,
  })

  return (
    <PageLayout
      header={{
        greeting: UI_STRINGS.onboarding.studySelection.greeting,
        title: UI_STRINGS.onboarding.studySelection.title,
        subtitle: UI_STRINGS.onboarding.studySelection.subtitle,
      }}
    >
      <StudyPicker
        catalog={catalog ?? { universities: [], faculties: [], studies: [] }}
      />
    </PageLayout>
  )
}
