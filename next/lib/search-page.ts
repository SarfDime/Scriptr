import type { CatalogSearchQueryResult } from '@shared/types/sanity.types'
import { getAcademicPath } from '@/lib/academic-routes'
import { ACADEMIC_CATALOG_TAGS } from '@/lib/sanity-tags'
import {
  normalizeSearchQuery,
  type SearchQueryParam,
} from '@/lib/script-search'
import { getServerLocale } from '@/lib/server-strings'
import { fetchSanityData } from '@/sanity/lib/utils'
import { catalogSearchQuery } from '@/sanity/queries/catalog-search.queries'
import type { SearchResultGroups } from '@/types/components/Search.types'

const EMPTY_RESULTS: SearchResultGroups = {
  universities: [],
  faculties: [],
  studies: [],
  professors: [],
}

/**
 * Loads the catalog search: universities, faculties, studies and professors,
 * each with the link its page lives at. Nothing here is a study's content —
 * scripts and subjects are searched inside a study, not globally.
 *
 * A failed read is reported as `failed`, not as an empty list: "nothing
 * matches" and "the search never ran" need different copy.
 */
export const loadSearchPage = async (
  rawQuery: SearchQueryParam
): Promise<{
  query: string
  results: SearchResultGroups
  failed: boolean
}> => {
  const query = normalizeSearchQuery(rawQuery)
  if (!query) return { query, results: EMPTY_RESULTS, failed: false }

  const catalog = await fetchSanityData<CatalogSearchQueryResult>({
    query: catalogSearchQuery,
    // GROQ's word matching, widened to a prefix of the last typed word.
    params: { term: `${query}*` },
    locale: await getServerLocale(),
    fetchOrigin: `catalog-search-${query}`,
    tags: ACADEMIC_CATALOG_TAGS,
  }).catch(() => null)

  if (!catalog) return { query, results: EMPTY_RESULTS, failed: true }

  const locale = await getServerLocale()

  return {
    query,
    failed: false,
    results: {
      universities: catalog.universities.flatMap((university) =>
        university.slug
          ? [
              {
                id: university._id,
                name: university.name,
                href: getAcademicPath(
                  { type: 'university', universitySlug: university.slug },
                  locale
                ),
              },
            ]
          : []
      ),
      faculties: catalog.faculties.flatMap((faculty) =>
        faculty.slug && faculty.university?.slug
          ? [
              {
                id: faculty._id,
                name: faculty.name,
                context: faculty.university.name,
                href: getAcademicPath(
                  {
                    type: 'faculty',
                    universitySlug: faculty.university.slug,
                    facultySlug: faculty.slug,
                  },
                  locale
                ),
              },
            ]
          : []
      ),
      studies: catalog.studies.flatMap((study) => {
        const faculty = study.faculty
        if (!study.slug || !faculty?.slug || !faculty.university?.slug)
          return []

        return [
          {
            id: study._id,
            name: study.name,
            context: faculty.name,
            href: getAcademicPath(
              {
                type: 'study',
                siteSlug: study.siteSlug,
                universitySlug: faculty.university.slug,
                facultySlug: faculty.slug,
                studySlug: study.slug,
              },
              locale
            ),
          },
        ]
      }),
      professors: catalog.professors.flatMap((professor) =>
        professor.slug
          ? [
              {
                id: professor._id,
                name: professor.name,
                href: getAcademicPath(
                  { type: 'professor', professorSlug: professor.slug },
                  locale
                ),
              },
            ]
          : []
      ),
    },
  }
}
